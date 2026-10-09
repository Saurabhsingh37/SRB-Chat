"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function VerifiedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setLoading(false);
    }

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080a14] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
          <p className="text-sm text-zinc-500">
            Verifying your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a14] px-4 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[430px] w-[430px] rounded-full bg-blue-600/[0.10] blur-[110px]" />

        <div className="absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-violet-600/[0.10] blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.035] blur-[100px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="auth-card-border rounded-[26px] p-[1px]">
          <div className="rounded-[25px] border border-white/[0.06] bg-[#0b0d18]/90 p-8 text-center shadow-2xl shadow-black/40 backdrop-blur-2xl">
            
            {/* Success icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/20">
              <span className="text-2xl text-emerald-400">✓</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Email verified
            </h1>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Your email has been successfully verified.
              Your SRB Chat account is now ready.
            </p>

            <button
              onClick={() => router.push("/chat")}
              className="group relative mt-8 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

              <span className="relative z-10">
                Continue to SRB Chat
              </span>
            </button>

            <button
              onClick={() => router.push("/login")}
              className="mt-4 text-sm text-zinc-600 transition-colors hover:text-blue-400"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-card-border {
          background: linear-gradient(
            120deg,
            rgba(59, 130, 246, 0.55),
            rgba(139, 92, 246, 0.45),
            rgba(59, 130, 246, 0.18),
            rgba(139, 92, 246, 0.5)
          );
          background-size: 300% 300%;
          animation: borderFlow 7s ease infinite;
          box-shadow:
            0 0 35px rgba(59, 130, 246, 0.07),
            0 0 70px rgba(139, 92, 246, 0.04);
        }

        @keyframes borderFlow {
          0% {
            background-position: 0% 50%;
          }

          50% {
            background-position: 100% 50%;
          }

          100% {
            background-position: 0% 50%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .auth-card-border {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}