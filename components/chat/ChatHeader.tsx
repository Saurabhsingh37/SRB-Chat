"use client";

type ChatHeaderProps = {
  name: string;
  online: boolean;
  avatar: string;
  onBack: () => void;
};

export default function ChatHeader({
  name,
  online,
  avatar,
  onBack,
}: ChatHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-white/[0.06] bg-[#080a14]/95 text-white backdrop-blur-xl">

      {/* ================= BACKGROUND ART ================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Blue glow */}
        <div className="absolute -left-16 -top-20 h-40 w-40 animate-pulse rounded-full bg-blue-600/10 blur-3xl" />

        {/* Violet glow */}
        <div
          className="absolute -right-16 -top-24 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl"
          style={{
            animation: "headerFloat 6s ease-in-out infinite",
          }}
        />

        {/* Small decorative dots */}
        <span
          className="absolute left-[35%] top-4 h-1 w-1 rounded-full bg-blue-300/40"
          style={{
            animation: "headerFloat 4s ease-in-out infinite",
          }}
        />

        <span
          className="absolute right-[25%] bottom-3 h-1.5 w-1.5 rounded-full bg-violet-300/30"
          style={{
            animation: "headerFloat 5s ease-in-out infinite",
          }}
        />

      </div>

      {/* ================= CONTENT ================= */}

      <div className="relative z-10 flex h-[88px] items-center gap-3 px-3 py-3 md:px-5 md:py-4">

        {/* Back Button */}

        <button
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-lg text-zinc-400 transition-all duration-300 hover:bg-white/[0.07] hover:text-white active:scale-90 md:hidden"
          aria-label="Back to chats"
        >
          ←
        </button>

        {/* Avatar */}

        <div className="relative shrink-0">

          {/* Avatar glow */}

          <div
            className={`absolute -inset-1 rounded-full blur-md ${
              online
                ? "bg-emerald-500/20"
                : "bg-zinc-500/10"
            }`}
          />

          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-semibold shadow-lg shadow-blue-500/20 md:h-11 md:w-11">
            {avatar}
          </div>

          {/* Online indicator */}

          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#080a14] ${
              online
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                : "bg-zinc-600"
            }`}
          />

        </div>

        {/* User Information */}

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-2">

            <h2 className="truncate text-sm font-semibold md:text-base">
              {name}
            </h2>

            {online && (
              <span className="hidden rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-emerald-400 sm:inline-block">
                Online
              </span>
            )}

          </div>

          <p
            className={`mt-0.5 text-[11px] md:text-xs ${
              online
                ? "text-emerald-400"
                : "text-zinc-500"
            }`}
          >
            {online ? "Active now" : "Offline"}
          </p>

        </div>

        {/* More Button */}

        <button
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-lg text-zinc-500 transition-all duration-300 hover:bg-white/[0.07] hover:text-white active:scale-90"
          aria-label="More options"
        >
          ⋮
        </button>

      </div>

      {/* ================= ANIMATION ================= */}

      <style jsx>{`
        @keyframes headerFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>

    </header>
  );
}