"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const usernameValid = /^[a-zA-Z0-9_]*$/.test(username);

  const passwordStrength = useMemo(() => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  }, [password]);

  const strengthLabel =
    passwordStrength === 0
      ? ""
      : passwordStrength <= 2
        ? "Weak"
        : passwordStrength === 3
          ? "Medium"
          : passwordStrength === 4
            ? "Good"
            : "Strong";

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (username.length > 15) {
      setError("Username must be 15 characters or less.");
      return;
    }

    if (!usernameValid) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (passwordStrength < 4) {
      setError("Please choose a stronger password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username,
          display_name: username,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080a14] px-4 py-8 text-white">

      {/* =====================================================
          BACKGROUND ART
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Main blue glow */}
        <div
          className="absolute -left-32 -top-32 h-[430px] w-[430px] rounded-full bg-blue-600/[0.10] blur-[110px]"
          style={{
            animation: "authFloat 9s ease-in-out infinite",
          }}
        />

        {/* Violet glow */}
        <div
          className="absolute -bottom-40 -right-32 h-[460px] w-[460px] rounded-full bg-violet-600/[0.10] blur-[120px]"
          style={{
            animation: "authFloatReverse 11s ease-in-out infinite",
          }}
        />

        {/* Center soft glow */}
        <div
          className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.035] blur-[100px]"
          style={{
            animation: "centerPulse 6s ease-in-out infinite",
          }}
        />

        {/* Decorative orbit */}
        <div
          className="absolute -right-28 -top-24 h-72 w-72 rounded-full border border-blue-400/[0.08]"
          style={{
            animation: "orbitFloat 10s ease-in-out infinite",
          }}
        />

        <div
          className="absolute -right-16 -top-10 h-52 w-52 rounded-full border border-violet-400/[0.08]"
          style={{
            animation: "orbitFloatReverse 8s ease-in-out infinite",
          }}
        />

        {/* Decorative dots */}
        <span
          className="absolute left-[14%] top-[24%] h-1 w-1 rounded-full bg-blue-300/60"
          style={{
            animation: "dotFloat 4s ease-in-out infinite",
          }}
        />

        <span
          className="absolute right-[17%] top-[34%] h-1.5 w-1.5 rounded-full bg-violet-300/50"
          style={{
            animation: "dotFloat 5s ease-in-out infinite",
          }}
        />

        <span
          className="absolute bottom-[22%] left-[18%] h-1 w-1 rounded-full bg-blue-300/40"
          style={{
            animation: "dotFloatReverse 5s ease-in-out infinite",
          }}
        />

        {/* Bottom wave */}
        <div
          className="absolute -bottom-28 -left-10 h-52 w-[120%] rotate-[-5deg] rounded-[50%] border border-white/[0.035]"
        />

      </div>

      {/* =====================================================
          REGISTER CONTAINER
      ===================================================== */}

      <div
        className="relative z-10 w-full max-w-md"
        style={{
          animation: "pageEnter 0.7s ease-out both",
        }}
      >

        {/* ===================================================
            ANIMATED CARD BORDER
        =================================================== */}

        <div className="auth-card-border relative rounded-[26px] p-[1px]">

          <div className="relative rounded-[25px] border border-white/[0.06] bg-[#0b0d18]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">

            {/* Card top glow */}
            <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-8 text-center">

              {/* Logo */}
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-bold shadow-lg shadow-blue-500/20">

                <span className="relative z-10">
                  SRB
                </span>

                <span className="absolute inset-0 rounded-2xl bg-blue-400/20 blur-md" />

                <span className="absolute inset-0 rounded-2xl border border-white/10" />

              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Create account
              </h1>

              <p className="mt-2 text-sm text-zinc-500">
                Join SRB Chat and stay connected.
              </p>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >

              {/* Username */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-medium text-zinc-200">
                    Username
                  </label>

                  <span
                    className={`text-xs transition-colors ${
                      username.length >= 15
                        ? "text-amber-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {username.length}/15
                  </span>

                </div>

                <div className="input-wrap">
                  <input
                    type="text"
                    value={username}
                    maxLength={15}
                    onChange={(event) => {
                      const value = event.target.value;

                      if (/^[a-zA-Z0-9_]*$/.test(value)) {
                        setUsername(value);
                      }
                    }}
                    placeholder="Choose a username"
                    className="auth-input"
                    required
                  />
                </div>

                <p className="mt-1.5 text-xs text-zinc-600">
                  1–15 characters · letters, numbers and _
                </p>
              </div>

              {/* Email */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  Gmail
                </label>

                <div className="input-wrap">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@gmail.com"
                    className="auth-input"
                    required
                  />
                </div>

                <p className="mt-1.5 text-xs text-zinc-600">
                  We&apos;ll send a verification link to this email.
                </p>
              </div>

              {/* Password */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  Password
                </label>

                <div className="input-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Create a strong password"
                    className="auth-input pr-20"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-zinc-600 transition-colors hover:text-blue-400"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Password strength */}

                {password.length > 0 && (
                  <div className="mt-2">

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                            level <= passwordStrength
                              ? "bg-gradient-to-r from-blue-500 to-violet-500"
                              : "bg-white/[0.08]"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-1 flex justify-between">

                      <span className="text-[11px] text-zinc-600">
                        8+ chars, uppercase, number & symbol
                      </span>

                      <span
                        className={`ml-2 shrink-0 text-[11px] ${
                          passwordStrength <= 2
                            ? "text-red-400"
                            : passwordStrength === 3
                              ? "text-yellow-400"
                              : passwordStrength === 4
                                ? "text-blue-400"
                                : "text-emerald-400"
                        }`}
                      >
                        {strengthLabel}
                      </span>

                    </div>

                  </div>
                )}
              </div>

              {/* Confirm Password */}

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-200">
                  Confirm Password
                </label>

                <div className="input-wrap">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm your password"
                    className="auth-input pr-20"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-zinc-600 transition-colors hover:text-violet-400"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {confirmPassword.length > 0 && (
                  <p
                    className={`mt-1.5 text-xs ${
                      passwordsMatch
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {passwordsMatch
                      ? "✓ Passwords match"
                      : "Passwords do not match"}
                  </p>
                )}
              </div>

              {/* Authentication feedback */}

              {error && (
                <div className="rounded-xl border border-red-400/10 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-emerald-400/10 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
                  Account created! Check your email to verify your account.
                </div>
              )}

              {/* =================================================
                  CREATE ACCOUNT BUTTON
              ================================================= */}

              <button
                type="submit"
                disabled={
                  loading ||
                  !username ||
                  !email ||
                  !password ||
                  !confirmPassword ||
                  !usernameValid ||
                  passwordStrength < 4 ||
                  !passwordsMatch
                }
                className="group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/20 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100"
              >

                {/* Hover shine */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                <span className="relative z-10">
                  {loading ? "Creating account..." : "Create Account"}
                </span>

              </button>

            </form>

            {/* =================================================
                LOGIN
            ================================================= */}

            <p className="mt-6 text-center text-sm text-zinc-600">

              Already have an account?{" "}

              <a
                href="/login"
                className="font-medium text-blue-400 transition-colors hover:text-violet-400"
              >
                Login
              </a>

            </p>

          </div>

        </div>

        {/* Security text */}

        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-700">

          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />

          <span>
            Secure authentication
          </span>

        </div>

      </div>

      {/* =====================================================
          ANIMATION + COMPONENT STYLES
      ===================================================== */}

      <style jsx>{`

        /* -----------------------------------------------
           PAGE
        ------------------------------------------------ */

        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }


        /* -----------------------------------------------
           BACKGROUND
        ------------------------------------------------ */

        @keyframes authFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(25px, 20px, 0);
          }
        }

        @keyframes authFloatReverse {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(-25px, -20px, 0);
          }
        }

        @keyframes centerPulse {
          0%,
          100% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(1);
          }

          50% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1.12);
          }
        }

        @keyframes orbitFloat {
          0%,
          100% {
            transform: rotate(-20deg) translateY(0);
          }

          50% {
            transform: rotate(-14deg) translateY(-12px);
          }
        }

        @keyframes orbitFloatReverse {
          0%,
          100% {
            transform: rotate(25deg) translateY(0);
          }

          50% {
            transform: rotate(18deg) translateY(10px);
          }
        }

        @keyframes dotFloat {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }

          50% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        @keyframes dotFloatReverse {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.4;
          }

          50% {
            transform: translateY(8px);
            opacity: 0.8;
          }
        }


        /* -----------------------------------------------
           CARD BORDER
        ------------------------------------------------ */

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


        /* -----------------------------------------------
           INPUT
        ------------------------------------------------ */

        .input-wrap {
          position: relative;
          border-radius: 12px;
          padding: 1px;
          background: rgba(255, 255, 255, 0.07);
          transition:
            background 300ms ease,
            box-shadow 300ms ease;
        }

        .input-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            rgba(59, 130, 246, 0),
            rgba(59, 130, 246, 0),
            rgba(139, 92, 246, 0)
          );
          opacity: 0;
          transition: opacity 300ms ease;
        }

        .input-wrap:focus-within {
          background: linear-gradient(
            90deg,
            rgba(59, 130, 246, 0.8),
            rgba(139, 92, 246, 0.8)
          );

          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.05),
            0 0 22px rgba(59, 130, 246, 0.08);
        }

        .input-wrap:focus-within::before {
          opacity: 1;
        }

        .auth-input {
          position: relative;
          z-index: 1;
          width: 100%;
          border-radius: 11px;
          border: 0;
          background: #090b15;
          padding: 13px 16px;
          color: white;
          font-size: 14px;
          outline: none;
          transition:
            background 300ms ease,
            box-shadow 300ms ease;
        }

        .auth-input::placeholder {
          color: rgb(82 82 91);
        }

        .auth-input:focus {
          background: #080a14;
        }


        /* -----------------------------------------------
           REDUCED MOTION
        ------------------------------------------------ */

        @media (prefers-reduced-motion: reduce) {
          .auth-card-border,
          .input-wrap,
          .auth-input {
            animation: none !important;
            transition: none !important;
          }

          * {
            scroll-behavior: auto !important;
          }
        }

      `}</style>

    </main>
  );
}