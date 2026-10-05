type MessageBubbleProps = {
  message: string;
  isOwn: boolean;
};

export default function MessageBubble({
  message,
  isOwn,
}: MessageBubbleProps) {
  return (
    <div
      className={`flex ${
        isOwn ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isOwn
            ? "rounded-br-md bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-blue-500/10"
            : "rounded-bl-md border border-white/10 bg-white/5 text-zinc-200"
        }`}
      >
        <p>{message}</p>

        <div
          className={`mt-1 text-[10px] ${
            isOwn ? "text-blue-100" : "text-zinc-600"
          }`}
        >
          12:30 PM
        </div>
      </div>
    </div>
  );
}