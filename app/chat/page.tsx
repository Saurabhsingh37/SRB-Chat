"use client";

import { useState } from "react";

import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import MessageInput from "@/components/chat/MessageInput";

const chats = [
  {
    id: 1,
    name: "Rahul",
    online: true,
    avatar: "R",
    messages: [
      { id: 1, message: "Hey bro!", isOwn: false },
      { id: 2, message: "Hello Rahul! 👋", isOwn: true },
      { id: 3, message: "How are you?", isOwn: false },
      { id: 4, message: "I'm good bro 🔥", isOwn: true },
    ],
  },
  {
    id: 2,
    name: "Aman",
    online: false,
    avatar: "A",
    messages: [
      { id: 1, message: "Bro, project ready?", isOwn: false },
      { id: 2, message: "Almost ready 🚀", isOwn: true },
      { id: 3, message: "See you tomorrow.", isOwn: false },
    ],
  },
  {
    id: 3,
    name: "Priya",
    online: true,
    avatar: "P",
    messages: [
      {
        id: 1,
        message: "Did you complete the assignment?",
        isOwn: false,
      },
      { id: 2, message: "Yes 👍", isOwn: true },
      { id: 3, message: "Okay 👍", isOwn: false },
    ],
  },
];

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState(1);
  const [mobileScreen, setMobileScreen] = useState<"chats" | "chat">(
    "chats",
  );

  const selectedChat =
    chats.find((chat) => chat.id === selectedChatId) ?? chats[0];

  const [messages, setMessages] = useState(selectedChat.messages);

  function handleSelectChat(chatId: number) {
    const chat = chats.find((item) => item.id === chatId);

    if (!chat) return;

    setSelectedChatId(chatId);
    setMessages(chat.messages);
    setMobileScreen("chat");
  }

  function handleBack() {
    setMobileScreen("chats");
  }

  function handleSend(message: string) {
    const newMessage = {
      id: Date.now(),
      message,
      isOwn: true,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      newMessage,
    ]);
  }

  return (
    <main className="h-[100dvh] overflow-hidden bg-zinc-950 text-white">

      {/* ================= DESKTOP ================= */}

      <div className="hidden h-full md:flex">

        <ChatSidebar
          selectedChatId={selectedChatId}
          onSelectChat={handleSelectChat}
        />

        <section className="flex min-w-0 flex-1 flex-col">
          <ChatHeader
            name={selectedChat.name}
            online={selectedChat.online}
            avatar={selectedChat.avatar}
            onBack={handleBack}
          />

          <MessageList messages={messages} />

          <MessageInput onSend={handleSend} />
        </section>

      </div>

      {/* ================= MOBILE ================= */}

      <div className="h-full md:hidden">

        {/* CHAT LIST SCREEN */}

        {mobileScreen === "chats" && (
          <div className="h-full w-full">
            <ChatSidebar
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
            />
          </div>
        )}

        {/* CHAT SCREEN */}

        {mobileScreen === "chat" && (
          <div className="flex h-full w-full flex-col">
            <ChatHeader
              name={selectedChat.name}
              online={selectedChat.online}
              avatar={selectedChat.avatar}
              onBack={handleBack}
            />

            <MessageList messages={messages} />

            <MessageInput onSend={handleSend} />
          </div>
        )}

      </div>

    </main>
  );
}