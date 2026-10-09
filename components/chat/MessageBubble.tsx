"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase/client";

type PreviewKind = "image" | "pdf" | null;

type MessageBubbleProps = {
  id: string;
  message: string;
  isOwn: boolean;
  createdAt: string;
  messageType?: "text" | "image" | "file";
  attachment?: {
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    expiresAt: string;
  };
  onDelete: (messageId: string) => void;
};

export default function MessageBubble({
  id,
  message,
  isOwn,
  createdAt,
  messageType = "text",
  attachment,
  onDelete,
}: MessageBubbleProps) {
  const [showDelete, setShowDelete] =
    useState(false);

  const [attachmentUrl, setAttachmentUrl] =
    useState<string | null>(null);

  const [previewKind, setPreviewKind] =
    useState<PreviewKind>(null);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const longPressTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  const longPressTriggered =
    useRef(false);

  const isImage =
    messageType === "image" ||
    attachment?.mimeType.startsWith("image/") === true;

  const isPdf =
    attachment?.mimeType === "application/pdf" ||
    attachment?.fileName.toLowerCase().endsWith(".pdf") ===
      true;

  const isFile =
    messageType === "file" && !isImage;

  const hasCaption =
    Boolean(message) &&
    message !== attachment?.fileName;

  useEffect(() => {
    let isMounted = true;

    async function fetchSignedUrl() {
      setAttachmentUrl(null);

      if (!attachment?.filePath) {
        return;
      }

      const { data, error } = await supabase.storage
        .from("chat-files")
        .createSignedUrl(attachment.filePath, 3600);

      if (error) {
        console.error(
          "Error fetching attachment URL:",
          error.message,
        );
        return;
      }

      if (isMounted && data?.signedUrl) {
        setAttachmentUrl(data.signedUrl);
      }
    }

    void fetchSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [attachment?.filePath]);

  useEffect(() => {
    if (!previewKind) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewKind(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [previewKind]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    };
  }, []);

  const formattedTime = new Date(
    createdAt,
  ).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const fileSize = attachment?.fileSize
    ? attachment.fileSize < 1024 * 1024
      ? `${(attachment.fileSize / 1024).toFixed(1)} KB`
      : `${(
          attachment.fileSize /
          (1024 * 1024)
        ).toFixed(1)} MB`
    : null;

  const handleDelete = () => {
    const confirmed = window.confirm(
      "Delete this message for everyone?",
    );

    if (!confirmed) {
      return;
    }

    setShowDelete(false);
    onDelete(id);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!isOwn) {
      return;
    }

    if (
      event.pointerType !== "touch" &&
      event.pointerType !== "pen"
    ) {
      return;
    }

    longPressTriggered.current = false;

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowDelete(true);

      if (
        typeof navigator !== "undefined" &&
        "vibrate" in navigator
      ) {
        navigator.vibrate(40);
      }
    }, 600);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    longPressTriggered.current = false;
  };

  const handlePointerMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleBubbleClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (longPressTriggered.current) {
      event.preventDefault();
      longPressTriggered.current = false;
      return;
    }

    if (showDelete) {
      setShowDelete(false);
    }
  };

  const handleContextMenu = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (isOwn) {
      event.preventDefault();
    }
  };

  const openPreview = (
    kind: Exclude<PreviewKind, null>,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (attachmentUrl) {
      setPreviewKind(kind);
    }
  };

  const downloadAttachment = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (
      !attachment?.filePath ||
      !attachment.fileName ||
      isDownloading
    ) {
      return;
    }

    setIsDownloading(true);

    const { data, error } = await supabase.storage
      .from("chat-files")
      .download(attachment.filePath);

    setIsDownloading(false);

    if (error || !data) {
      console.error(
        "Error downloading attachment:",
        error?.message,
      );
      return;
    }

    const objectUrl = URL.createObjectURL(data);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = attachment.fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  };

  return (
    <>
      <div
        className={`flex ${
          isOwn ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`message-bubble-enter group relative max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.985] ${
            isOwn
              ? "rounded-br-md bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-blue-500/20"
              : "rounded-bl-md border border-white/10 bg-white/5 text-zinc-200 shadow-black/10"
          }`}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerMove={handlePointerMove}
          onClick={handleBubbleClick}
          onContextMenu={handleContextMenu}
          style={{ touchAction: "pan-y" }}
        >
          {isOwn && (
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleDelete();
              }}
              className={`absolute -right-2 -top-2 z-30 flex h-8 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-[#11131f] px-3 text-xs font-medium text-zinc-300 shadow-xl transition-all duration-200 ${
                showDelete
                  ? "pointer-events-auto scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0"
              } md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:scale-100 md:group-hover:opacity-100 hover:bg-red-500/15 hover:text-red-400 active:scale-95`}
              aria-label="Delete message"
              title="Delete message"
            >
              <span
                className="text-sm leading-none"
                aria-hidden="true"
              >
                🗑️
              </span>
              <span>Delete</span>
            </button>
          )}

          {isImage && attachmentUrl && (
            <button
              type="button"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) =>
                openPreview("image", event)
              }
              className="image-card group/image mb-2 block w-full overflow-hidden rounded-xl bg-black/20 text-left focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="View full image"
            >
              <img
                src={attachmentUrl}
                alt={attachment?.fileName || "Uploaded image"}
                className="max-h-64 w-full rounded-xl object-cover transition duration-500 ease-out group-hover/image:scale-[1.035]"
              />

              <div className="pointer-events-none absolute inset-x-3 bottom-8 flex justify-center opacity-0 transition duration-200 group-hover/image:opacity-100">
                <span className="rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-md">
                  Tap to view
                </span>
              </div>
            </button>
          )}

          {isFile && (
            <button
              type="button"
              disabled={!isPdf || !attachmentUrl}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                if (isPdf) {
                  openPreview("pdf", event);
                }
              }}
              className={`mb-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-left transition-all duration-200 ${
                isPdf && attachmentUrl
                  ? "hover:-translate-y-0.5 hover:bg-black/30 active:scale-[0.985]"
                  : "cursor-default"
              }`}
              aria-label={
                isPdf ? "View PDF" : "Attached file"
              }
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-xl">
                {isPdf ? "📕" : "📄"}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-white">
                  {attachment?.fileName || message}
                </span>

                <span className="mt-1 block text-[10px] text-zinc-400">
                  {isPdf
                    ? "Tap to view PDF"
                    : "File attachment"}
                  {fileSize ? ` · ${fileSize}` : ""}
                </span>
              </span>

              {isPdf && (
                <span className="text-zinc-400 transition-transform duration-200 group-hover:translate-x-0.5">
                  →
                </span>
              )}
            </button>
          )}

          {(isImage
            ? hasCaption
            : messageType === "text" || hasCaption) ? (
            <p className="break-words leading-relaxed">
              {message}
            </p>
          ) : null}

          <div
            className={`mt-1 text-right text-[10px] ${
              isOwn ? "text-blue-100" : "text-zinc-500"
            }`}
          >
            {formattedTime}
          </div>
        </div>
      </div>

      {previewKind && attachmentUrl && (
        <div
          className="preview-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={
            previewKind === "image"
              ? "Image preview"
              : "PDF preview"
          }
          onClick={() => setPreviewKind(null)}
        >
          <div
            className="preview-content flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#11131f] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {attachment?.fileName ||
                    (previewKind === "image"
                      ? "Image"
                      : "Document")}
                </p>

                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {previewKind === "image"
                    ? "Image preview"
                    : "PDF preview"}
                  {fileSize ? ` · ${fileSize}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={downloadAttachment}
                  disabled={isDownloading}
                  className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDownloading
                    ? "Downloading..."
                    : "↓ Download"}
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewKind(null)}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                  aria-label="Close preview"
                >
                  ✕ Close
                </button>
              </div>
            </header>

            <div className="flex min-h-0 flex-1 items-center justify-center bg-black/40 p-2 sm:p-4">
              {previewKind === "image" ? (
                <img
                  src={attachmentUrl}
                  alt={
                    attachment?.fileName || "Uploaded image"
                  }
                  className="preview-image max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <iframe
                  src={attachmentUrl}
                  title={attachment?.fileName || "PDF preview"}
                  className="h-full min-h-[65vh] w-full rounded-lg bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .message-bubble-enter {
          animation: messageBubbleEnter 360ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .image-card {
          position: relative;
        }

        .preview-backdrop {
          animation: previewFadeIn 180ms ease-out both;
          backdrop-filter: blur(8px);
        }

        .preview-content {
          animation: previewContentIn 300ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .preview-image {
          animation: previewImageIn 380ms
            cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes messageBubbleEnter {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes previewFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes previewContentIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes previewImageIn {
          from {
            opacity: 0;
            transform: scale(0.94);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .message-bubble-enter,
          .preview-backdrop,
          .preview-content,
          .preview-image {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}