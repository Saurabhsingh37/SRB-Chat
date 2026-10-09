"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AttachmentModalProps = {
  onClose: () => void;
  onSendAttachment: (file: File) => void | Promise<void>;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function AttachmentModal({
  onClose,
  onSendAttachment,
}: AttachmentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [sending, setSending] = useState(false);

  /*
   * =========================================================
   * PREVIEW URL CLEANUP
   * =========================================================
   */

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  /*
   * =========================================================
   * ESCAPE KEY
   * =========================================================
   */

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [onClose]);

  /*
   * =========================================================
   * FILE SIZE FORMAT
   * =========================================================
   */

  function formatFileSize(size: number) {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  /*
   * =========================================================
   * FILE PICKER
   * =========================================================
   */

  function openFilePicker(type: "image" | "pdf") {
    if (!fileInputRef.current) {
      return;
    }

    setError(null);

    fileInputRef.current.value = "";

    fileInputRef.current.accept =
      type === "image"
        ? "image/*"
        : ".pdf,application/pdf";

    fileInputRef.current.click();
  }

  /*
   * =========================================================
   * FILE SELECT
   * =========================================================
   */

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    /*
     * File type validation
     */

    if (!isImage && !isPdf) {
      setSelectedFile(null);
      setPreviewUrl(null);

      setError(
        "Only image files and PDF documents are allowed.",
      );

      return;
    }

    /*
     * File size validation
     */

    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setPreviewUrl(null);

      setError(
        `File is too large. Maximum size is 10 MB. Selected file is ${formatFileSize(
          file.size,
        )}.`,
      );

      return;
    }

    /*
     * Remove previous preview
     */

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    /*
     * Create image preview
     */

    if (isImage) {
      const url = URL.createObjectURL(file);

      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  /*
   * =========================================================
   * REMOVE FILE
   * =========================================================
   */

  function removeFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  }

  /*
   * =========================================================
   * CLOSE MODAL
   * =========================================================
   */

  function handleClose() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);

    onClose();
  }

  /*
   * =========================================================
   * SEND
   * =========================================================
   */

  async function handleSend() {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        "This file is too large. Maximum size is 10 MB.",
      );

      return;
    }

    try {
      setSending(true);
      setError(null);

      await onSendAttachment(selectedFile);

      handleClose();
    } catch (error) {
      console.error(
        "Attachment send error:",
        error,
      );

      setError(
        "Unable to send this file. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  /*
   * =========================================================
   * MODAL
   * =========================================================
   */

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-end justify-center p-3 pb-[92px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share attachment"
    >
      {/* ================= BACKDROP ================= */}

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* ================= MODAL CARD ================= */}

      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/[0.10] bg-[#0c0f1c] shadow-[0_30px_100px_rgba(0,0,0,0.75)]"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* ================= TOP GLOW ================= */}

        <div className="pointer-events-none absolute left-0 right-0 top-0 h-32 bg-gradient-to-b from-blue-500/[0.09] to-transparent" />

        {/* ================= HEADER ================= */}

        <div className="relative flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-white sm:text-lg">
              Share attachment
            </h2>

            <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">
              Select an image or PDF
            </p>
          </div>

          {/* ================= CLOSE BUTTON ================= */}

          <button
            type="button"
            onClick={handleClose}
            className="relative z-50 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05] text-base text-zinc-400 transition-all duration-200 hover:border-white/[0.15] hover:bg-white/[0.10] hover:text-white active:scale-90"
            aria-label="Close attachment modal"
          >
            ✕
          </button>
        </div>

        {/* ================= CONTENT ================= */}

        <div className="relative p-4 sm:p-5">
          {/* ================= ERROR ================= */}

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.07] px-3 py-3"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-500/[0.12] text-sm">
                ⚠️
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-5 text-red-300">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 text-xs text-red-400 transition-colors hover:text-red-200"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {!selectedFile ? (
            <div className="grid grid-cols-2 gap-3">
              {/* ================= IMAGE ================= */}

              <button
                type="button"
                onClick={() =>
                  openFilePicker("image")
                }
                className="group flex min-h-[145px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] transition-all duration-200 hover:border-blue-500/30 hover:bg-blue-500/[0.07] active:scale-[0.97]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/[0.10] text-3xl transition-transform duration-200 group-hover:scale-110">
                  🖼️
                </div>

                <span className="mt-3 text-sm font-semibold text-zinc-200">
                  Image
                </span>

                <span className="mt-1 text-[10px] text-zinc-600">
                  JPG • PNG • WEBP
                </span>

                <span className="mt-1 text-[9px] text-zinc-700">
                  Max 10 MB
                </span>
              </button>

              {/* ================= PDF ================= */}

              <button
                type="button"
                onClick={() =>
                  openFilePicker("pdf")
                }
                className="group flex min-h-[145px] flex-col items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.035] transition-all duration-200 hover:border-violet-500/30 hover:bg-violet-500/[0.07] active:scale-[0.97]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/[0.10] text-3xl transition-transform duration-200 group-hover:scale-110">
                  📄
                </div>

                <span className="mt-3 text-sm font-semibold text-zinc-200">
                  PDF
                </span>

                <span className="mt-1 text-[10px] text-zinc-600">
                  PDF document
                </span>

                <span className="mt-1 text-[9px] text-zinc-700">
                  Max 10 MB
                </span>
              </button>
            </div>
          ) : (
            <div>
              {/* ================= PREVIEW ================= */}

              {previewUrl ? (
                <div className="flex max-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-black/30">
                  <img
                    src={previewUrl}
                    alt={selectedFile.name}
                    className="max-h-[280px] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex min-h-[210px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/[0.10] text-5xl">
                    📄
                  </div>

                  <p className="mt-4 max-w-[80%] truncate text-sm font-semibold text-zinc-200">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    PDF document
                  </p>
                </div>
              )}

              {/* ================= FILE INFO ================= */}

              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-lg">
                  {previewUrl
                    ? "🖼️"
                    : "📄"}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {selectedFile.name}
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatFileSize(
                      selectedFile.size,
                    )}
                  </p>
                </div>

                <div className="shrink-0 rounded-lg bg-emerald-500/[0.08] px-2 py-1 text-[10px] font-medium text-emerald-400">
                  Ready
                </div>
              </div>

              {/* ================= ACTIONS ================= */}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={sending}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-sm font-medium text-zinc-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Choose another
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-200 hover:scale-[1.02] hover:shadow-blue-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </span>
                  ) : (
                    "Send"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= FILE INPUT ================= */}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
