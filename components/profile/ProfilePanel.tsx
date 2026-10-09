
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
};

type ProfilePanelProps = {
  onClose: () => void;
};

export default function ProfilePanel({
  onClose,
}: ProfilePanelProps) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "username, display_name, avatar_url, bio",
        )
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        setError("Unable to load your profile.");
        setLoading(false);
        return;
      }

      setProfile(data);

      setUsername(data.username);
      setDisplayName(data.display_name);
      setBio(data.bio || "");
      setAvatarUrl(data.avatar_url || "");

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave() {
    setError("");
    setMessage("");

    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    const cleanBio = bio.trim();

    if (!cleanUsername) {
      setError("Username cannot be empty.");
      return;
    }

    if (!cleanDisplayName) {
      setError("Display name cannot be empty.");
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setError("You are not logged in.");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        username: cleanUsername,
        display_name: cleanDisplayName,
        bio: cleanBio || null,
        avatar_url: avatarUrl.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select(
        "username, display_name, avatar_url, bio",
      )
      .single();

    setSaving(false);

    if (error) {
      console.error("Error updating profile:", error);

      if (error.code === "23505") {
        setError("That username is already taken.");
      } else {
        setError("Unable to update your profile.");
      }

      return;
    }

    setProfile(data);

    setUsername(data.username);
    setDisplayName(data.display_name);
    setBio(data.bio || "");
    setAvatarUrl(data.avatar_url || "");

    setMessage("Profile updated successfully.");
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError("Unable to logout.");
      return;
    }

    window.location.href = "/login";
  }

  function handleCancel() {
    if (!profile) {
      return;
    }

    setUsername(profile.username);
    setDisplayName(profile.display_name);
    setBio(profile.bio || "");
    setAvatarUrl(profile.avatar_url || "");

    setMessage("");
    setError("");
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#080a14]/95 text-white backdrop-blur-xl md:left-auto md:right-0 md:top-0 md:h-full md:w-[50vw] md:min-w-[520px] md:max-w-[720px]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

          <p className="text-sm text-zinc-500">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[#080a14] text-white md:left-auto md:right-0 md:top-0 md:h-full md:w-[50vw] md:min-w-[520px] md:max-w-[720px] md:border-l md:border-white/[0.07] md:shadow-2xl md:shadow-black/40">
      {/* Background glow */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl animate-pulse" />

        <div
          className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl"
          style={{
            animation: "profileFloat 7s ease-in-out infinite",
          }}
        />

        <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-violet-500/[0.04] to-transparent" />
      </div>

      {/* Content */}

      <div className="relative z-10 flex h-full flex-col">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="group flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-zinc-500 transition-all duration-300 hover:bg-white/[0.05] hover:text-white"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1">
              ←
            </span>

            <span>Back</span>
          </button>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Profile
          </p>

          <div className="w-14" />
        </div>

        {/* Profile body */}

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Avatar */}

          <div className="mb-7 flex flex-col items-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-violet-500 to-blue-500 text-3xl font-bold shadow-2xl shadow-blue-500/20">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName || "Profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase() || "?"
                )}
              </div>

              <div className="absolute inset-[-6px] -z-10 rounded-full border border-blue-500/10 animate-pulse" />
            </div>

            <p className="mt-4 text-lg font-semibold">
              {displayName || "Your Name"}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              @{username || "username"}
            </p>
          </div>

          {/* Fields */}

          <div className="space-y-5">
            {/* Display Name */}

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">
                Display Name
              </label>

              <input
                type="text"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="Your display name"
                className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-zinc-700 focus:border-blue-500/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-blue-500/5"
              />
            </div>

            {/* Username */}

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">
                Username
              </label>

              <div className="flex items-center rounded-2xl border border-white/[0.07] bg-white/[0.035] transition-all duration-300 focus-within:border-blue-500/40 focus-within:ring-4 focus-within:ring-blue-500/5">
                <span className="pl-4 text-sm text-zinc-600">
                  @
                </span>

                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(
                      event.target.value
                        .toLowerCase()
                        .replace(/\s/g, ""),
                    );
                    setMessage("");
                    setError("");
                  }}
                  placeholder="username"
                  className="w-full bg-transparent px-2 py-3 pr-4 text-sm text-white outline-none placeholder:text-zinc-700"
                />
              </div>
            </div>

            {/* Bio */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-medium text-zinc-500">
                  Bio
                </label>

                <span className="text-[10px] text-zinc-700">
                  {bio.length}/160
                </span>
              </div>

              <textarea
                value={bio}
                maxLength={160}
                onChange={(event) => {
                  setBio(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="Tell people a little about yourself..."
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm leading-6 text-white outline-none transition-all duration-300 placeholder:text-zinc-700 focus:border-blue-500/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-blue-500/5"
              />
            </div>

            {/* Avatar URL */}

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-500">
                Profile Picture URL
              </label>

              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => {
                  setAvatarUrl(event.target.value);
                  setMessage("");
                  setError("");
                }}
                placeholder="https://..."
                className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition-all duration-300 placeholder:text-zinc-700 focus:border-blue-500/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-blue-500/5"
              />

              <p className="mt-2 text-[10px] leading-4 text-zinc-700">
                Image upload will be connected to Supabase Storage next.
              </p>
            </div>
          </div>

          {/* Status */}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/10 bg-red-500/[0.06] px-4 py-3 text-xs text-red-400">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.06] px-4 py-3 text-xs text-emerald-400">
              {message}
            </div>
          )}

          {/* Actions */}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-sm font-medium text-zinc-400 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07] hover:text-white active:translate-y-0 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-500/20 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {/* Account Actions */}

          <div className="mt-8 border-t border-white/[0.06] pt-6">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Account
            </p>

            <button
              type="button"
              className="mb-2 flex w-full items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-left transition-all duration-300 hover:bg-white/[0.05]"
            >
              <div>
                <p className="text-sm text-zinc-300">
                  Change Password
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Update your account password
                </p>
              </div>

              <span className="text-zinc-600">›</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-between rounded-2xl border border-red-500/10 bg-red-500/[0.04] px-4 py-3 text-left transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-500/[0.08]"
            >
              <div>
                <p className="text-sm text-red-400">
                  Logout
                </p>

                <p className="mt-1 text-xs text-red-400/40">
                  Sign out of SRB Chat
                </p>
              </div>

              <span className="text-red-400/50">→</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes profileFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-14px);
          }
        }
      `}</style>
    </div>
  );
}
