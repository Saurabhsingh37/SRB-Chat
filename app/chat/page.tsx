
"use client";

/*
 * ================================================================
 * SRB CHAT — MAIN CHAT PAGE
 * ================================================================
 *
 * TECHNOLOGIES
 * - Next.js 16
 * - React 19
 * - TypeScript
 * - Tailwind CSS 4
 * - Supabase Auth
 * - Supabase PostgreSQL
 * - Supabase Realtime
 * - Supabase Storage
 *
 * FEATURES
 * 1. Authentication/session check and login redirect.
 * 2. Desktop and mobile chat layouts.
 * 3. Load messages and attachment metadata from PostgreSQL.
 * 4. Realtime message INSERT and DELETE subscriptions.
 * 5. Send text messages.
 * 6. Upload images and PDF files to the private "chat-files" bucket.
 * 7. Save attachment metadata with a seven-day expiry timestamp.
 * 8. Roll back uploaded files/messages when a later step fails.
 * 9. Optimistically update the current user's message list.
 * 10. Delete messages and refresh after deletion errors.
 *
 * ATTACHMENT FLOW
 * File -> Supabase Storage -> messages -> message_attachments
 *      -> Local message UI + Realtime for other conversation members
 *
 * DATABASE EXPECTATIONS
 * - messages.message_type accepts: text, image, file.
 * - messages.content is non-empty.
 * - message_attachments references messages.id.
 * - RLS policies authorize conversation members.
 * - Storage bucket "chat-files" is private.
 *
 * DEBUGGING
 * - Attachment diagnostics are logged inside handleSendAttachment().
 * - Never put messageData references inside the Realtime callback:
 *   messageData exists only inside handleSendAttachment().
 *
 * SECURITY NOTE
 * - The expiry timestamp does not automatically delete a file.
 *   A scheduled cleanup process must be configured separately.
 * ================================================================
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";
import { supabase } from "@/lib/supabase/client";

type Friend = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type Message = {
  id: string;
  message: string;
  isOwn: boolean;
  createdAt: string;
  messageType: "text" | "image" | "file";
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    expiresAt: string;
  };
};

export default function ChatPage() {
  const router = useRouter();

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const [selectedFriend, setSelectedFriend] =
    useState<Friend | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [mobileScreen, setMobileScreen] = useState<
    "chats" | "chat"
  >("chats");

  const [authChecking, setAuthChecking] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  /*
   * =========================================================
   * AUTH CHECK
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        console.error("❌ Session check failed:", error);
      }

      if (!session) {
        router.replace("/login");
        return;
      }

      setAuthChecking(false);
    }

    void checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      } else {
        setAuthChecking(false);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  /*
   * =========================================================
   * LOAD MESSAGES + ATTACHMENT METADATA
   * =========================================================
   */

  async function loadMessages(conversationId: string) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("❌ Could not identify current user:", userError);
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select(`
        id,
        content,
        sender_id,
        created_at,
        message_type,
        message_attachments (
          file_name,
          file_path,
          file_size,
          mime_type,
          expires_at
        )
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error loading messages:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return;
    }

    const formattedMessages: Message[] = (data ?? []).map((item) => {
      const attachment = Array.isArray(item.message_attachments)
        ? item.message_attachments[0]
        : item.message_attachments;

      return {
        id: String(item.id),
        message: item.content ?? "",
        isOwn: item.sender_id === user.id,
        createdAt: String(item.created_at),
        messageType:
          (item.message_type as "text" | "image" | "file") || "text",
        ...(attachment
          ? {
              attachment: {
                fileName: attachment.file_name,
                filePath: attachment.file_path,
                fileSize: Number(attachment.file_size),
                mimeType: attachment.mime_type,
                expiresAt: attachment.expires_at,
              },
            }
          : {}),
      };
    });

    setMessages(formattedMessages);
  }

  /*
   * =========================================================
   * REALTIME MESSAGES
   * =========================================================
   */

  useEffect(() => {
    if (!selectedConversationId) return;

    let cancelled = false;

    const conversationId = selectedConversationId;
    const channel = supabase.channel(`chat-${conversationId}`);

    /*
     * ---------------- INSERT ----------------
     */

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        if (cancelled) return;

        console.log("🟢 REALTIME INSERT:", payload);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled || !user) return;

        const newMessage = payload.new as {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          message_type: "text" | "image" | "file";
        };

        let attachment: Message["attachment"] | undefined;

        /*
         * Load metadata for an image/PDF message.
         * This query may run before the sender inserts metadata.
         */

        if (
          newMessage.message_type === "image" ||
          newMessage.message_type === "file"
        ) {
          const {
            data: attachmentData,
            error: attachmentError,
          } = await supabase
            .from("message_attachments")
            .select(
              "file_name, file_path, file_size, mime_type, expires_at",
            )
            .eq("message_id", newMessage.id)
            .maybeSingle();

          if (attachmentError) {
            console.error("❌ Realtime attachment lookup failed:", {
              messageId: newMessage.id,
              code: attachmentError.code,
              message: attachmentError.message,
              details: attachmentError.details,
              hint: attachmentError.hint,
            });
          }

          if (attachmentData) {
            attachment = {
              fileName: attachmentData.file_name,
              filePath: attachmentData.file_path,
              fileSize: Number(attachmentData.file_size),
              mimeType: attachmentData.mime_type,
              expiresAt: attachmentData.expires_at,
            };
          }
        }

        if (cancelled) return;

        setMessages((currentMessages) => {
          const alreadyExists = currentMessages.some(
            (message) => message.id === String(newMessage.id),
          );

          if (alreadyExists) {
            /*
             * If this message arrived through Realtime before the
             * sender finished uploading its metadata, don't duplicate it.
             */
            return currentMessages;
          }

          return [
            ...currentMessages,
            {
              id: String(newMessage.id),
              message: newMessage.content ?? "",
              isOwn: newMessage.sender_id === user.id,
              createdAt: String(newMessage.created_at),
              messageType: newMessage.message_type,
              ...(attachment ? { attachment } : {}),
            },
          ];
        });
      },
    );

    /*
     * ---------------- DELETE ----------------
     */

    channel.on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "messages",
      },
      (payload) => {
        if (cancelled) return;

        console.log("🔴 REALTIME DELETE:", payload);

        const deletedMessage = payload.old as {
          id?: string;
          conversation_id?: string;
        };

        if (!deletedMessage.id) return;

        if (
          deletedMessage.conversation_id &&
          deletedMessage.conversation_id !== conversationId
        ) {
          return;
        }

        setMessages((currentMessages) =>
          currentMessages.filter(
            (message) => message.id !== String(deletedMessage.id),
          ),
        );
      },
    );

    channel.subscribe((status) => {
      console.log(`📡 Realtime [${conversationId}]:`, status);
    });

    return () => {
      cancelled = true;
      console.log(`🧹 Removing Realtime [${conversationId}]`);
      void supabase.removeChannel(channel);
    };
  }, [selectedConversationId]);

  /*
   * =========================================================
   * SELECT CHAT
   * =========================================================
   */

  async function handleSelectChat(
    conversationId: string,
    friend: Friend,
  ) {
    setSelectedConversationId(conversationId);
    setSelectedFriend(friend);
    setMessages([]);
    setMobileScreen("chat");

    console.log("Selected conversation:", {
      conversationId,
      friend,
    });

    await loadMessages(conversationId);
  }

  /*
   * =========================================================
   * BACK TO CHAT LIST
   * =========================================================
   */

  function handleBack() {
    setMobileScreen("chats");
  }

  /*
   * =========================================================
   * SEND TEXT MESSAGE
   * =========================================================
   */

  async function handleSend(message: string) {
    if (!selectedConversationId || !message.trim() || sendingMessage) {
      return;
    }

    try {
      setSendingMessage(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: selectedConversationId,
          sender_id: user.id,
          content: message.trim(),
          message_type: "text",
        })
        .select("id, content, sender_id, created_at, message_type")
        .single();

      if (error || !data) {
        console.error("❌ Error sending text message:", {
          code: error?.code,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
        });
        return;
      }

      const newMessage: Message = {
        id: String(data.id),
        message: data.content,
        isOwn: data.sender_id === user.id,
        createdAt: String(data.created_at),
        messageType: "text",
      };

      setMessages((currentMessages) => {
        if (currentMessages.some((item) => item.id === newMessage.id)) {
          return currentMessages;
        }

        return [...currentMessages, newMessage];
      });
    } catch (error) {
      console.error("❌ Unexpected error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  }

  /*
   * =========================================================
   * SEND IMAGE / PDF ATTACHMENT
   * =========================================================
   *
   * IMPORTANT DEBUGGING ORDER
   * 1. Upload file to Storage.
   * 2. Insert messages row.
   * 3. Log actual IDs after the insert succeeds.
   * 4. Insert message_attachments metadata.
   * 5. Add the completed message to local UI.
   *
   * If metadata insertion fails, inspect the logged IDs and RLS
   * diagnostics. Don't reference messageData outside this function.
   */

  async function handleSendAttachment(file: File) {
    if (!selectedConversationId) {
      console.error("❌ No conversation selected.");
      return;
    }

    let filePath: string | null = null;
    let createdMessageId: string | null = null;

    try {
      /*
       * ---------------- GET CURRENT USER ----------------
       */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("❌ Could not identify current user:", userError);
        router.replace("/login");
        return;
      }

      const conversationId = selectedConversationId;

      /*
       * ---------------- VALIDATE FILE ----------------
       */

      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";

      if (!isImage && !isPdf) {
        console.error("❌ Unsupported attachment type:", file.type);
        return;
      }

      if (file.size <= 0) {
        console.error("❌ Cannot upload an empty file.");
        return;
      }

      const messageType: "image" | "file" = isImage ? "image" : "file";

      /*
       * ---------------- CREATE STORAGE PATH ----------------
       */

      const fileExtension = file.name.split(".").pop() || "file";
      const uploadId =
        typeof globalThis.crypto?.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random()
              .toString(36)
              .slice(2)}`;
      const safeFileName =
        `${Date.now()}-${uploadId}.${fileExtension}`;

      filePath = `${conversationId}/${user.id}/${safeFileName}`;

      console.log("📤 Uploading attachment:", {
        name: file.name,
        type: file.type,
        size: file.size,
        path: filePath,
        conversationId,
        userId: user.id,
      });

      /*
       * ---------------- UPLOAD FILE ----------------
       */

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from("chat-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error("❌ Attachment upload failed:", {
          message: uploadError.message,
          name: uploadError.name,
        });
        return;
      }

      console.log("✅ Attachment uploaded:", uploadData);

      /*
       * ---------------- INSERT MESSAGE ROW ----------------
       */

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: file.name,
          message_type: messageType,
        })
        .select("id, content, sender_id, created_at, message_type")
        .single();

      if (messageError || !messageData) {
        console.error("❌ Message creation failed:", {
          code: messageError?.code,
          message: messageError?.message,
          details: messageError?.details,
          hint: messageError?.hint,
          conversationId,
          userId: user.id,
        });

        const { error: storageRollbackError } = await supabase.storage
          .from("chat-files")
          .remove([filePath]);

        if (storageRollbackError) {
          console.error(
            "❌ Failed to remove uploaded file:",
            storageRollbackError.message,
          );
        }

        return;
      }

      createdMessageId = messageData.id;

      /*
       * THIS IS THE CORRECT LOCATION FOR THE DEBUG LOG.
       *
       * messageData has now been declared and the message exists.
       * Copy these actual UUIDs for the SQL diagnostic query.
       */

      console.log("🔎 ATTACHMENT RLS DEBUG", {
        messageId: messageData.id,
        conversationId,
        userId: user.id,
        senderId: messageData.sender_id,
        messageType: messageData.message_type,
        filePath,
      });

      console.log("✅ Message row created:", messageData);

      /*
       * ---------------- SET SEVEN-DAY EXPIRY ----------------
       *
       * This records an expiry time. It does not delete files
       * automatically; scheduled cleanup must be implemented.
       */

      const expiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      /*
       * ---------------- INSERT ATTACHMENT METADATA ----------------
       */

      console.log("📎 Creating attachment metadata:", {
        message_id: messageData.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        expires_at: expiresAt,
      });

      const { data: attachmentData, error: attachmentError } =
        await supabase
          .from("message_attachments")
          .insert({
            message_id: messageData.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            expires_at: expiresAt,
          })
          .select(
            "file_name, file_path, file_size, mime_type, expires_at",
          )
          .single();

      if (attachmentError || !attachmentData) {
        console.error("❌ Attachment metadata creation failed:", {
          code: attachmentError?.code,
          message: attachmentError?.message,
          details: attachmentError?.details,
          hint: attachmentError?.hint,
        });

        /*
         * Roll back the message and storage object.
         * If the current RLS policies deny deletion, the rollback
         * error will be logged separately.
         */

        const { error: rollbackMessageError } = await supabase
          .from("messages")
          .delete()
          .eq("id", messageData.id);

        if (rollbackMessageError) {
          console.error(
            "❌ Failed to roll back message:",
            rollbackMessageError.message,
          );
        }

        const { error: rollbackStorageError } = await supabase.storage
          .from("chat-files")
          .remove([filePath]);

        if (rollbackStorageError) {
          console.error(
            "❌ Failed to roll back storage file:",
            rollbackStorageError.message,
          );
        }

        console.error(
          "🧪 Use the ATTACHMENT RLS DEBUG UUIDs above to check " +
            "message existence and conversation membership in SQL Editor.",
        );

        return;
      }

      /*
       * ---------------- ADD COMPLETED MESSAGE TO LOCAL UI ----------------
       */

      const newMessage: Message = {
        id: String(messageData.id),
        message: messageData.content,
        isOwn: messageData.sender_id === user.id,
        createdAt: String(messageData.created_at),
        messageType,
        attachment: {
          fileName: attachmentData.file_name,
          filePath: attachmentData.file_path,
          fileSize: Number(attachmentData.file_size),
          mimeType: attachmentData.mime_type,
          expiresAt: attachmentData.expires_at,
        },
      };

      setMessages((currentMessages) => {
        if (currentMessages.some((item) => item.id === newMessage.id)) {
          return currentMessages;
        }

        return [...currentMessages, newMessage];
      });

      console.log("🎉 Attachment message created successfully:", {
        messageId: messageData.id,
        attachment: attachmentData,
        filePath,
      });
    } catch (error) {
      console.error("❌ Unexpected attachment error:", error);

      /*
       * Do not silently delete a message here: a network exception
       * can occur after a database insert actually committed.
       * Use the logged IDs to inspect state before manual cleanup.
       */
      console.error("Attachment operation context:", {
        conversationId: selectedConversationId,
        messageId: createdMessageId,
        filePath,
      });
    }
  }

  /*
   * =========================================================
   * DELETE MESSAGE
   * =========================================================
   */

  async function handleDeleteMessage(messageId: string) {
    const previousMessages = messages;

    setMessages((currentMessages) =>
      currentMessages.filter((message) => message.id !== messageId),
    );

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) {
        console.error("❌ Error deleting message:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        if (selectedConversationId) {
          await loadMessages(selectedConversationId);
        } else {
          setMessages(previousMessages);
        }

        return;
      }

      console.log("🗑️ Message deleted:", messageId);
    } catch (error) {
      console.error("❌ Unexpected error deleting message:", error);

      if (selectedConversationId) {
        await loadMessages(selectedConversationId);
      } else {
        setMessages(previousMessages);
      }
    }
  }

  /*
   * =========================================================
   * AUTH LOADING SCREEN
   * =========================================================
   */

  if (authChecking) {
    return (
      <main className="flex h-[100dvh] items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

          <p className="text-sm text-zinc-500">
            Checking your session...
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * MAIN PAGE — DESKTOP + MOBILE
   * =========================================================
   */

  return (
    <main className="h-[100dvh] overflow-hidden bg-zinc-950 text-white">
      {/* ======================= DESKTOP ======================= */}

      <div className="hidden h-full md:flex">
        <ChatSidebar
          selectedChatId={selectedConversationId}
          onSelectChat={handleSelectChat}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          {!selectedConversationId || !selectedFriend ? (
            <div className="flex h-full flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-2xl">
                  💬
                </div>

                <h2 className="text-lg font-semibold text-white">
                  No conversation selected
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Select a friend to start chatting.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ChatHeader
                name={selectedFriend.display_name}
                online={false}
                avatar={selectedFriend.avatar_url || ""}
                onBack={handleBack}
              />

              <MessageList
                messages={messages}
                onDelete={handleDeleteMessage}
              />

              <MessageInput
                onSend={handleSend}
                onSendAttachment={handleSendAttachment}
              />
            </>
          )}
        </section>
      </div>

      {/* ======================== MOBILE ======================== */}

      <div className="h-full md:hidden">
        {mobileScreen === "chats" && (
          <div className="h-full w-full">
            <ChatSidebar
              selectedChatId={selectedConversationId}
              onSelectChat={handleSelectChat}
            />
          </div>
        )}

        {mobileScreen === "chat" && (
          <div className="flex h-full w-full flex-col">
            {selectedFriend && selectedConversationId ? (
              <>
                <ChatHeader
                  name={selectedFriend.display_name}
                  online={false}
                  avatar={selectedFriend.avatar_url || ""}
                  onBack={handleBack}
                />

                <MessageList
                  messages={messages}
                  onDelete={handleDeleteMessage}
                />

                <MessageInput
                  onSend={handleSend}
                  onSendAttachment={handleSendAttachment}
                />
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-zinc-500">
                  No conversation selected.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
