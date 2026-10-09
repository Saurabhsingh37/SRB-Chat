"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type FriendRequest = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type Tab = "requests" | "friends";

export default function FriendsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("requests");

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [requests, setRequests] = useState<
    Array<FriendRequest & { profile: Profile }>
  >([]);

  const [friends, setFriends] = useState<Profile[]>([]);

  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    loadFriendsData();
  }, []);

  async function loadFriendsData() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setCurrentUserId(user.id);

    await Promise.all([
      loadIncomingRequests(user.id),
      loadFriends(user.id),
    ]);

    setLoading(false);
  }

  async function loadIncomingRequests(userId: string) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("receiver_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading friend requests:", error);
      setError("Unable to load friend requests.");
      return;
    }

    if (!data || data.length === 0) {
      setRequests([]);
      return;
    }

    const senderIds = data.map((request) => request.sender_id);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", senderIds);

    if (profilesError) {
      console.error("Error loading request profiles:", profilesError);
      setError("Unable to load friend profiles.");
      return;
    }

    const profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, profile]),
    );

    setRequests(
      data
        .map((request) => {
          const profile = profileMap.get(request.sender_id);

          if (!profile) {
            return null;
          }

          return {
            ...request,
            profile,
          };
        })
        .filter(
          (
            request,
          ): request is FriendRequest & { profile: Profile } =>
            request !== null,
        ),
    );
  }

  async function loadFriends(userId: string) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("id, sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) {
      console.error("Error loading friends:", error);
      setError("Unable to load friends.");
      return;
    }

    if (!data || data.length === 0) {
      setFriends([]);
      return;
    }

    const friendIds = data.map((request) =>
      request.sender_id === userId
        ? request.receiver_id
        : request.sender_id,
    );

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", friendIds);

    if (profilesError) {
      console.error("Error loading friend profiles:", profilesError);
      setError("Unable to load friends.");
      return;
    }

    setFriends(profiles || []);
  }

  async function handleRequest(
    requestId: string,
    action: "accepted" | "rejected",
  ) {
    setActionLoading(requestId);
    setError("");

    const { error } = await supabase
      .from("friend_requests")
      .update({
        status: action,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      console.error("Error updating friend request:", error);
      setError("Unable to update friend request.");
      setActionLoading(null);
      return;
    }

    if (currentUserId) {
      await Promise.all([
        loadIncomingRequests(currentUserId),
        loadFriends(currentUserId),
      ]);
    }

    setActionLoading(null);

    if (action === "accepted") {
      setActiveTab("friends");
    }
  }

  async function searchUsers() {
    const query = userSearch.trim();

    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setError("");

    if (!currentUserId) {
      setSearchLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .neq("id", currentUserId)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    setSearchLoading(false);

    if (error) {
      console.error("Error searching users:", error);
      setError("Unable to search users.");
      return;
    }

    setSearchResults(data || []);
  }

  const filteredFriends = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return friends;
    }

    return friends.filter(
      (friend) =>
        friend.username.toLowerCase().includes(query) ||
        friend.display_name.toLowerCase().includes(query),
    );
  }, [friends, search]);

  function closePage() {
    router.push("/chat");
  }

  return (
    <main className="min-h-[100dvh] bg-[#080a14] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -right-32 top-32 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col px-4 py-5 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={closePage}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            ←
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl shadow-lg shadow-blue-500/20">
            👥
          </div>

          <div>
            <h1 className="text-lg font-bold">Friends</h1>
            <p className="text-xs text-zinc-500">
              Manage your friends and requests
            </p>
          </div>
        </header>

        {/* Tabs */}
        <div className="relative mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.035] p-1 backdrop-blur-xl">
          <div className="grid grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveTab("requests")}
              className={`relative rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === "requests"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {activeTab === "requests" && (
                <span className="absolute inset-0 rounded-xl bg-blue-500/10 shadow-inner shadow-blue-500/10" />
              )}

              <span className="relative">
                Requests
                {requests.length > 0 && (
                  <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">
                    {requests.length}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("friends")}
              className={`relative rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === "friends"
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {activeTab === "friends" && (
                <span className="absolute inset-0 rounded-xl bg-violet-500/10 shadow-inner shadow-violet-500/10" />
              )}

              <span className="relative">
                Friends
                <span className="ml-2 text-[10px] text-zinc-600">
                  {friends.length}
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Sliding content */}
        <div className="overflow-hidden">
          <div
            className={`flex w-[200%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              activeTab === "requests"
                ? "translate-x-0"
                : "-translate-x-1/2"
            }`}
          >
            {/* ================= REQUESTS ================= */}
            <section className="w-1/2 pr-2">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-white">
                  Friend Requests
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  People who want to connect with you.
                </p>
              </div>

              {loading ? (
                <LoadingState />
              ) : requests.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="No pending requests"
                  description="New friend requests will appear here."
                />
              ) : (
                <div className="space-y-3">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar profile={request.profile} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {request.profile.display_name}
                          </p>

                          <p className="truncate text-xs text-zinc-500">
                            @{request.profile.username}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRequest(request.id, "accepted")
                          }
                          disabled={actionLoading === request.id}
                          className="rounded-xl bg-blue-500/10 px-3 py-2.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                        >
                          {actionLoading === request.id
                            ? "..."
                            : "✓ Accept"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleRequest(request.id, "rejected")
                          }
                          disabled={actionLoading === request.id}
                          className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs font-semibold text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ================= FRIENDS ================= */}
            <section className="w-1/2 pl-2">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-white">
                  Your Friends
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  All your accepted friends.
                </p>
              </div>

              {/* Friend search */}
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 backdrop-blur-xl focus-within:border-blue-500/30">
                <span className="text-sm text-zinc-500">⌕</span>

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your friends..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                />
              </div>

              {/* All registered users search */}
              <div className="mb-5 rounded-2xl border border-blue-500/10 bg-blue-500/[0.03] p-4">
                <p className="mb-3 text-xs font-medium text-zinc-400">
                  Find registered users
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(event) =>
                      setUserSearch(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        searchUsers();
                      }
                    }}
                    placeholder="Search username..."
                    className="min-w-0 flex-1 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-blue-500/30"
                  />

                  <button
                    type="button"
                    onClick={searchUsers}
                    disabled={searchLoading}
                    className="rounded-xl bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    {searchLoading ? "..." : "Search"}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.025] p-3"
                      >
                        <Avatar profile={user} />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white">
                            {user.display_name}
                          </p>

                          <p className="truncate text-[11px] text-zinc-600">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accepted friends */}
              {loading ? (
                <LoadingState />
              ) : filteredFriends.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title={
                    search
                      ? "No matching friends"
                      : "No friends yet"
                  }
                  description={
                    search
                      ? "Try another name or username."
                      : "Accept a request to build your friends list."
                  }
                />
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map((friend) => (
                    <button
                      key={friend.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-500/20 hover:bg-white/[0.05]"
                    >
                      <Avatar profile={friend} />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">
                          {friend.display_name}
                        </p>

                        <p className="truncate text-xs text-zinc-500">
                          @{friend.username}
                        </p>
                      </div>

                      <span className="text-zinc-700">→</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-500/10 bg-red-500/[0.05] px-4 py-3 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-semibold">
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={profile.display_name}
          className="h-full w-full object-cover"
        />
      ) : (
        profile.display_name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.025] py-16">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
        <p className="text-xs text-zinc-600">Loading...</p>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.035] text-xl">
        {icon}
      </div>

      <h3 className="text-sm font-medium text-zinc-300">{title}</h3>

      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-zinc-600">
        {description}
      </p>
    </div>
  );
}