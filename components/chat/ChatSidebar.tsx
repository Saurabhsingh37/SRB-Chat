"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import ProfilePanel from "@/components/profile/ProfilePanel";

type ChatSidebarProps = {
  selectedChatId: string | null;
  onSelectChat: (conversationId: string, friend: Friend) => void;
};

type Profile = {
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type Friend = Profile & {
  id: string;
};

type FriendRequest = {
  sender_id: string;
  receiver_id: string;
};

export default function ChatSidebar({
  selectedChatId,
  onSelectChat,
}: ChatSidebarProps) {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [openingConversationId, setOpeningConversationId] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting session:", sessionError);
          return;
        }

        if (!session?.user) {
          console.warn("No authenticated user found.");
          return;
        }

        const user = session.user;

        console.log("ChatSidebar authenticated user:", {
          id: user.id,
          email: user.email,
        });

        const { data, error } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error loading profile:", error);
          return;
        }

        if (!data) {
          console.warn(
            "No profile found for authenticated user:",
            user.id,
          );
          return;
        }

        if (mounted) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Unexpected error loading profile:", error);
      }
    }

    async function loadFriends() {
      try {
        setFriendsLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting current user:", userError);

          if (mounted) {
            setFriendsLoading(false);
          }

          return;
        }

        if (!user) {
          console.warn("No authenticated user found.");

          if (mounted) {
            setFriendsLoading(false);
          }

          return;
        }

        /*
         * Get all accepted friendships involving
         * the current user.
         */
        const { data: requests, error: requestsError } =
          await supabase
            .from("friend_requests")
            .select("sender_id, receiver_id")
            .eq("status", "accepted")
            .or(
              `sender_id.eq.${user.id},receiver_id.eq.${user.id}`,
            );

        if (requestsError) {
          console.error(
            "Error loading accepted friends:",
            requestsError,
          );

          if (mounted) {
            setFriendsLoading(false);
          }

          return;
        }

        const acceptedRequests =
          (requests as FriendRequest[] | null) || [];

        /*
         * Find the other user's ID from each friendship.
         */
        const friendIds = acceptedRequests
          .map((request) =>
            request.sender_id === user.id
              ? request.receiver_id
              : request.sender_id,
          )
          .filter((id, index, array) => array.indexOf(id) === index);

        if (friendIds.length === 0) {
          if (mounted) {
            setFriends([]);
            setFriendsLoading(false);
          }

          return;
        }

        /*
         * Load profiles of all accepted friends.
         */
        const { data: friendProfiles, error: profilesError } =
          await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", friendIds);

        if (profilesError) {
          console.error(
            "Error loading friend profiles:",
            profilesError,
          );

          if (mounted) {
            setFriendsLoading(false);
          }

          return;
        }

        if (mounted) {
          setFriends(friendProfiles || []);
          setFriendsLoading(false);
        }
      } catch (error) {
        console.error("Unexpected error loading friends:", error);

        if (mounted) {
          setFriendsLoading(false);
        }
      }
    }

    loadProfile();
    loadFriends();

    /*
     * Refresh profile/friends when authentication changes.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        loadProfile();
        loadFriends();
      }

      if (event === "SIGNED_OUT" && mounted) {
        setProfile(null);
        setFriends([]);
        setFriendsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /*
   * Open an existing conversation or create
   * a new direct conversation with this friend.
   */
  async function handleFriendClick(friend: Friend) {
    if (openingConversationId) {
      return;
    }

    try {
      setOpeningConversationId(friend.id);

      const { data, error } = await supabase.rpc(
        "get_or_create_direct_conversation",
        {
          target_user_id: friend.id,
        },
      );

      if (error) {
        console.error(
          "Error opening conversation:",
          error,
        );

        return;
      }

      if (!data) {
        console.error(
          "Conversation RPC returned no conversation ID.",
        );

        return;
      }

      const conversationId = data as string;

      console.log("Conversation opened:", {
        conversationId,
        friendId: friend.id,
        friendName: friend.display_name,
      });

      onSelectChat(conversationId, friend);
    } catch (error) {
      console.error(
        "Unexpected error opening conversation:",
        error,
      );
    } finally {
      setOpeningConversationId(null);
    }
  }

  return (
    <aside className="relative flex h-full w-full flex-col overflow-hidden bg-[#080a14] text-white md:w-80">
      {/* ================= BACKGROUND ART ================= */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-64 w-64 animate-pulse rounded-full bg-blue-600/10 blur-3xl" />

        <div
          className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl"
          style={{
            animation: "float 7s ease-in-out infinite",
          }}
        />

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

        <div className="absolute -bottom-20 -left-10 h-48 w-[120%] rotate-[-5deg] rounded-[50%] border border-white/[0.03]" />
      </div>

      {/* ================= CONTENT ================= */}

      <div className="relative z-10 flex h-full flex-col">
        {/* ================= HEADER ================= */}

        <div className="border-b border-white/[0.06] px-5 pb-5 pt-6 md:p-5">
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl shadow-lg shadow-blue-500/20">
              <span className="relative z-10">💬</span>

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

        {/* ================= SEARCH ================= */}

        <div className="px-4 pb-5 pt-4">
          <div className="group flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 backdrop-blur-xl transition-all duration-300 focus-within:border-blue-500/30 focus-within:bg-white/[0.05]">
            <span className="text-sm text-zinc-500 transition group-focus-within:text-blue-400">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search users..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>

        {/* ================= HEADING ================= */}

        <div className="px-5 pb-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              Messages
            </p>

            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-400/60">
                {friends.length}
              </span>

              {/* ================= FRIENDS BUTTON ================= */}

              <button
                type="button"
                onClick={() => router.push("/friends")}
                className="group flex h-7 w-7 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 active:translate-y-0 active:scale-95"
                title="Friends"
                aria-label="Open Friends"
              >
                <span className="text-sm transition-transform duration-300 group-hover:scale-110">
                  👥
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= FRIENDS / CHAT LIST ================= */}

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {friendsLoading ? (
            <div className="flex h-full items-center justify-center px-4">
              <div className="text-center">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

                <p className="text-xs text-zinc-600">
                  Loading friends...
                </p>
              </div>
            </div>
          ) : friends.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.035] text-xl">
                  💬
                </div>

                <h2 className="text-sm font-medium text-zinc-300">
                  No conversations
                </h2>

                <p className="mt-2 text-xs leading-5 text-zinc-600">
                  Add a friend to start chatting.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((friend) => {
                const isSelected =
                  selectedChatId !== null &&
                  openingConversationId !== friend.id;

                const isOpening =
                  openingConversationId === friend.id;

                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => handleFriendClick(friend)}
                    disabled={Boolean(openingConversationId)}
                    className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300 ${
                      isSelected
                        ? "border-blue-500/25 bg-blue-500/[0.08] shadow-lg shadow-blue-500/5"
                        : "border-white/[0.05] bg-white/[0.025] hover:-translate-y-0.5 hover:border-blue-500/20 hover:bg-white/[0.05]"
                    } ${
                      openingConversationId &&
                      !isOpening
                        ? "cursor-not-allowed opacity-60"
                        : ""
                    }`}
                  >
                    {/* Hover glow */}

                    <span className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Avatar */}

                    <div className="relative z-10 shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-semibold shadow-lg shadow-violet-500/10">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt={friend.display_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          friend.display_name
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      {/* Temporary online indicator */}

                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#080a14] bg-emerald-400" />
                    </div>

                    {/* Friend information */}

                    <div className="relative z-10 min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium transition-colors ${
                          isSelected
                            ? "text-blue-100"
                            : "text-zinc-200 group-hover:text-blue-100"
                        }`}
                      >
                        {friend.display_name}
                      </p>

                      <p className="truncate text-xs text-zinc-500">
                        @{friend.username}
                      </p>
                    </div>

                    {/* Loading / Arrow */}

                    {isOpening ? (
                      <span className="relative z-10 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/10 border-t-blue-400" />
                    ) : (
                      <span
                        className={`relative z-10 text-sm transition-all duration-300 ${
                          isSelected
                            ? "translate-x-1 text-blue-400"
                            : "text-zinc-700 group-hover:translate-x-1 group-hover:text-blue-400"
                        }`}
                      >
                        →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ================= PROFILE BUTTON ================= */}

        <div className="p-4">
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.035] p-3 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/20 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-blue-500/5 active:translate-y-0"
          >
            {/* Hover glow */}

            <span className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-blue-500/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

            {/* Avatar */}

            <div className="relative z-10">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-blue-500 font-semibold shadow-lg shadow-violet-500/10 transition-transform duration-300 group-hover:scale-105">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profile?.display_name?.charAt(0).toUpperCase() || "?"
                )}
              </div>

              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#080a14] bg-emerald-400" />
            </div>

            {/* Profile text */}

            <div className="relative z-10 min-w-0 flex-1">
              <p className="truncate text-sm font-medium transition-colors duration-300 group-hover:text-blue-100">
                {profile?.display_name || "Loading..."}
              </p>

              <p className="truncate text-xs text-zinc-500">
                @{profile?.username || "loading"}
              </p>
            </div>

            {/* Arrow */}

            <span className="relative z-10 text-sm text-zinc-700 transition-all duration-300 group-hover:translate-x-1 group-hover:text-blue-400">
              →
            </span>
          </button>
        </div>
      </div>

      {/* ================= PROFILE PANEL ================= */}

      {showProfile && (
        <div className="absolute inset-0 z-[60]">
          <div className="h-full animate-profile-open">
            <ProfilePanel
              onClose={() => setShowProfile(false)}
            />
          </div>
        </div>
      )}

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

        @keyframes profileOpen {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-profile-open {
          animation: profileOpen 0.35s cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </aside>
  );
}
