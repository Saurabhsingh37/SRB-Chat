"use client";

import { useRef, useState } from "react";

type MessageInputProps = {
  onSend: (message: string) => void;
};

export default function MessageInput({
  onSend,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && !selectedFile) return;

    if (trimmedMessage) {
      onSend(trimmedMessage);
    }

    console.log("Attachment:", selectedFile);

    setMessage("");
    removeFile();
  }

  function handleAttachmentClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    event.target.value = "";
  }

  function removeFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
  }

  return (
    <div className="relative border-t border-white/[0.06] bg-[#080a14]/95 p-2 backdrop-blur-xl md:p-3">

      {/* Background glow */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute -bottom-16 left-1/4 h-32 w-64 rounded-full bg-blue-600/[0.04] blur-3xl" />

        <div className="absolute -bottom-20 right-1/4 h-36 w-64 rounded-full bg-violet-600/[0.04] blur-3xl" />

      </div>

      {/* Hidden file input */}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Attachment Preview */}

      {selectedFile && (
        <div className="relative z-10 mb-2 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-2 backdrop-blur-xl">

          {/* Image preview */}

          {previewUrl ? (
            <img
              src={previewUrl}
              alt={selectedFile.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
              📄
            </div>
          )}

          {/* File information */}

          <div className="min-w-0 flex-1">

            <p className="truncate text-sm font-medium text-zinc-200">
              {selectedFile.name}
            </p>

            <p className="text-[10px] text-zinc-500">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>

          </div>

          {/* Remove */}

          <button
            type="button"
            onClick={removeFile}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.06] hover:text-white active:scale-90"
            aria-label="Remove attachment"
          >
            ✕
          </button>

        </div>
      )}

      {/* Input */}

      <div className="relative z-10 flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-1.5 shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 focus-within:border-blue-500/30 focus-within:bg-white/[0.05]">

        {/* Attachment */}

        <button
          type="button"
          onClick={handleAttachmentClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg text-zinc-500 transition-all duration-300 hover:bg-white/[0.06] hover:text-white active:scale-90"
          aria-label="Attach file"
        >
          +
        </button>

        {/* Message */}

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSend();
            }
          }}
          placeholder={
            selectedFile
              ? "Add a message..."
              : "Message..."
          }
          className="min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none placeholder:text-zinc-600 md:px-2"
        />

        {/* Send */}

        <button
          type="button"
          onClick={handleSend}
          disabled={!message.trim() && !selectedFile}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
          aria-label="Send message"
        >
          ➤
        </button>

      </div>

    </div>
  );
}