"use client";

import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";

type Message = {
  id: number;
  message: string;
  isOwn: boolean;
};

type MessageListProps = {
  messages: Message[];
};

export default function MessageList({
  messages,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-[#0a0c16] text-white">

      {/* ================= BACKGROUND ART ================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Top blue glow */}
        <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-blue-600/[0.06] blur-3xl" />

        {/* Right violet glow */}
        <div
          className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-violet-600/[0.05] blur-3xl"
          style={{
            animation: "messageFloat 9s ease-in-out infinite",
          }}
        />

        {/* Bottom glow */}
        <div
          className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/[0.035] blur-3xl"
          style={{
            animation: "messageFloat 11s ease-in-out infinite reverse",
          }}
        />

        {/* Decorative dots */}

        <span className="absolute left-[12%] top-[25%] h-1 w-1 rounded-full bg-blue-300/20" />

        <span
          className="absolute right-[18%] top-[48%] h-1.5 w-1.5 rounded-full bg-violet-300/20"
          style={{
            animation: "messageFloat 5s ease-in-out infinite",
          }}
        />

        <span className="absolute bottom-[20%] left-[25%] h-1 w-1 rounded-full bg-blue-300/15" />

        {/* Handcrafted curved line */}

        <div className="absolute -bottom-32 -left-20 h-64 w-[120%] rotate-[-6deg] rounded-[50%] border border-white/[0.025]" />

      </div>

      {/* ================= MESSAGE CONTENT ================= */}

      <div className="relative z-10 flex flex-1 flex-col gap-3 overflow-y-auto p-3 md:p-5">

        {/* Today separator */}

        <div className="flex justify-center py-2">

          <div className="rounded-full border border-white/[0.07] bg-white/[0.035] px-4 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500 shadow-lg backdrop-blur-xl">
            Today
          </div>

        </div>

        {/* Messages */}

        {messages.map((message, index) => (
          <div
            key={message.id}
            style={{
              animation: `messageAppear 0.35s ease-out ${
                index * 60
              }ms both`,
            }}
          >
            <MessageBubble
              message={message.message}
              isOwn={message.isOwn}
            />
          </div>
        ))}

        {/* Auto-scroll target */}

        <div ref={bottomRef} />

      </div>

      {/* ================= ANIMATION ================= */}

      <style jsx>{`
        @keyframes messageFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-14px);
          }
        }

        @keyframes messageAppear {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

    </main>
  );
}