"use client";

type Chat = {
  id: number;
  name: string;
  message: string;
  time: string;
  online: boolean;
  avatar: string;
};

type ChatSidebarProps = {
  selectedChatId: number;
  onSelectChat: (chatId: number) => void;
};

const chats: Chat[] = [
  {
    id: 1,
    name: "Rahul",
    message: "Hey bro!",
    time: "12:30",
    online: true,
    avatar: "R",
  },
  {
    id: 2,
    name: "Aman",
    message: "See you tomorrow",
    time: "11:45",
    online: false,
    avatar: "A",
  },
  {
    id: 3,
    name: "Priya",
    message: "Okay 👍",
    time: "10:20",
    online: true,
    avatar: "P",
  },
];

export default function ChatSidebar({
  selectedChatId,
  onSelectChat,
}: ChatSidebarProps) {
  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden bg-[#080a14] text-white md:w-80">

      {/* ================= BACKGROUND ART ================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Large glow */}
        <div className="absolute -left-24 -top-24 h-64 w-64 animate-pulse rounded-full bg-blue-600/10 blur-3xl" />

        <div
          className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl"
          style={{
            animation: "float 7s ease-in-out infinite",
          }}
        />

        {/* Handcrafted orbit */}
        <div
          className="absolute -right-24 -top-16 h-52 w-52 rounded-full border border-blue-400/10"
          style={{
            transform: "rotate(-20deg)",
          }}
        />

        <div
          className="absolute -right-16 -top-8 h-40 w-40 rounded-full border border-violet-400/10"
          style={{
            transform: "rotate(25deg)",
          }}
        />

        {/* Tiny decorative dots */}
        <span className="absolute left-[15%] top-[18%] h-1 w-1 animate-pulse rounded-full bg-blue-300/60" />

        <span
          className="absolute right-[18%] top-[30%] h-1.5 w-1.5 rounded-full bg-violet-300/50"
          style={{
            animation: "float 4s ease-in-out infinite",
          }}
        />

        <span
          className="absolute bottom-[25%] left-[12%] h-1 w-1 rounded-full bg-blue-300/40"
          style={{
            animation: "float 5s ease-in-out infinite",
          }}
        />

        {/* Handmade wave */}
        <div className="absolute -bottom-20 -left-10 h-48 w-[120%] rotate-[-5deg] rounded-[50%] border border-white/[0.03]" />

      </div>

      {/* ================= CONTENT ================= */}

      <div className="relative z-10 flex h-full flex-col">

        {/* Header */}
        <div className="border-b border-white/[0.06] px-5 pb-5 pt-6 md:p-5">

          <div className="flex items-center gap-3">

            {/* Logo */}
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl shadow-lg shadow-blue-500/20">

              <span className="relative z-10">
                💬
              </span>

              <span className="absolute inset-0 animate-ping rounded-2xl bg-blue-500/10" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                SRB Chat
              </h1>

              <p className="text-xs text-zinc-500">
                Stay connected ✦
              </p>
            </div>

          </div>

        </div>

        {/* Search */}
        <div className="px-4 pb-5 pt-4">

          <div className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 backdrop-blur-xl transition-all duration-300 focus-within:border-blue-500/30 focus-within:bg-white/[0.05]">

            <span className="text-sm text-zinc-500 transition group-focus-within:text-blue-400">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search chats..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />

          </div>

        </div>

        {/* Heading */}
        <div className="px-5 pb-3">

          <div className="flex items-center justify-between">

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Messages
            </p>

            <span className="text-xs text-blue-400/60">
              {chats.length}
            </span>

          </div>

        </div>

        {/* Chat List */}
        <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4">

          {chats.map((chat, index) => {

            const isSelected =
              chat.id === selectedChatId;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-3 text-left transition-all duration-300 active:scale-[0.98] ${
                  isSelected
                    ? "bg-blue-500/[0.10] ring-1 ring-blue-400/20"
                    : "hover:bg-white/[0.035]"
                }`}
                style={{
                  animation: `chatAppear 0.5s ease-out ${
                    index * 100
                  }ms both`,
                }}
              >

                {/* Selected glow */}
                {isSelected && (
                  <div className="absolute inset-y-2 left-0 w-1 rounded-full bg-gradient-to-b from-blue-400 to-violet-500 shadow-lg shadow-blue-500/50" />
                )}

                {/* Avatar */}
                <div className="relative shrink-0">

                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/80 to-violet-600/80 text-lg font-semibold shadow-lg transition-all duration-300 group-hover:scale-105 ${
                      isSelected
                        ? "shadow-blue-500/20"
                        : ""
                    }`}
                  >
                    {chat.avatar}
                  </div>

                  {/* Online indicator */}
                  <span
                    className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#080a14] ${
                      chat.online
                        ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                        : "bg-zinc-600"
                    }`}
                  />

                </div>

                {/* Chat info */}
                <div className="min-w-0 flex-1">

                  <div className="flex items-center justify-between gap-2">

                    <h3 className="truncate font-medium">
                      {chat.name}
                    </h3>

                    <span className="shrink-0 text-[10px] text-zinc-600">
                      {chat.time}
                    </span>

                  </div>

                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {chat.message}
                  </p>

                </div>

                {/* Mobile arrow */}
                <span className="text-zinc-700 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-400 md:hidden">
                  ›
                </span>

              </button>
            );
          })}

        </div>

        {/* User */}
        <div className="border-t border-white/[0.06] p-4">

          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.035] p-3 backdrop-blur-xl">

            <div className="relative">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 font-semibold shadow-lg shadow-violet-500/10">
                S
              </div>

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#080a14] bg-emerald-400" />

            </div>

            <div className="min-w-0">

              <p className="text-sm font-medium">
                Saurabh
              </p>

              <p className="text-xs text-zinc-500">
                Online
              </p>

            </div>

            <span className="ml-auto text-xs text-zinc-700">
              ✦
            </span>

          </div>

        </div>

      </div>

      {/* ================= ANIMATION STYLES ================= */}

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-12px);
          }
        }

        @keyframes chatAppear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </aside>
  );
}