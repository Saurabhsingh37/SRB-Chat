"use client";

import { useState } from "react";
import AttachmentModal from "./AttachmentModal";

type MessageInputProps = {
  onSend: (message: string) => void | Promise<void>;
  onSendAttachment: (file: File) => void | Promise<void>;
};

export default function MessageInput({
  onSend,
  onSendAttachment,
}: MessageInputProps) {
  const [message, setMessage] = useState("");

  const [showAttachmentModal, setShowAttachmentModal] =
    useState(false);

  /*
   * =========================================================
   * SEND MESSAGE
   * =========================================================
   */

  async function handleSend() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    /*
     * Wait for ChatPage to finish
     * inserting the message into Supabase.
     */

    await onSend(trimmedMessage);

    setMessage("");
  }

  /*
   * =========================================================
   * OPEN ATTACHMENT MODAL
   * =========================================================
   */

  function handleAttachmentClick() {
    setShowAttachmentModal(true);
  }

  /*
   * =========================================================
   * CLOSE ATTACHMENT MODAL
   * =========================================================
   */

  function handleAttachmentClose() {
    setShowAttachmentModal(false);
  }

  /*
   * =========================================================
   * SEND ATTACHMENT
   * =========================================================
   */

  async function handleSendAttachment(file: File) {
    /*
     * Pass the selected file to ChatPage.
     *
     * Uploading to Supabase Storage will be added
     * in the next phase.
     */

    await onSendAttachment(file);
  }

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <>
      {/* =====================================================
          MESSAGE INPUT BAR
          ===================================================== */}

      <div className="relative border-t border-white/[0.06] bg-[#080a14]/95 px-3 py-3 backdrop-blur-xl md:px-5 md:py-4">
        {/* ================= BACKGROUND GLOW ================= */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -bottom-20 left-1/4 h-40 w-72 rounded-full bg-blue-600/[0.05] blur-3xl" />

          <div className="absolute -bottom-24 right-1/4 h-44 w-72 rounded-full bg-violet-600/[0.05] blur-3xl" />
        </div>

        {/* ================= MESSAGE COMPOSER ================= */}

        <div className="relative z-10 mx-auto flex max-w-4xl items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-2 shadow-xl shadow-black/10 backdrop-blur-xl transition-all duration-300 focus-within:border-blue-500/30 focus-within:bg-white/[0.055] focus-within:shadow-blue-500/[0.06] md:gap-3 md:rounded-3xl md:p-2.5">
          {/* ================= ATTACHMENT ================= */}

          <button
            type="button"
            onClick={handleAttachmentClick}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.05] text-xl text-zinc-500 transition-all duration-200 hover:bg-white/[0.07] hover:text-blue-400 active:scale-90 md:h-12 md:w-12 md:rounded-2xl"
            aria-label="Attach file"
          >
            +
          </button>

          {/* ================= MESSAGE INPUT ================= */}

          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSend();
              }
            }}
            placeholder="Write a message..."
            className="min-w-0 flex-1 bg-transparent px-1 text-[15px] text-white outline-none placeholder:text-zinc-600 md:px-2 md:text-base"
          />

          {/* ================= SEND ================= */}

          <button
            type="button"
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-lg text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-105 hover:shadow-blue-500/30 active:scale-90 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100 md:h-12 md:w-12 md:rounded-2xl"
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
      </div>

      {/* =====================================================
          ATTACHMENT MODAL
          ===================================================== */}

      {showAttachmentModal && (
        <AttachmentModal
          onClose={handleAttachmentClose}
          onSendAttachment={handleSendAttachment}
        />
      )}
    </>
  );
}
