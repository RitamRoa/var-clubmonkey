"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TinyToast from "@/components/TinyToast";

interface Club {
  id: number;
  name: string;
  description: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  tags: string[];
  created_at: string;
}

interface Post {
  id: number;
  content: string;
  image_url?: string;
  created_at: string;
}

interface ClubPageData {
  club: Club;
  posts: Post[];
}

interface JoinedClub {
  id: number;
  name: string;
  accent_color: string;
  description: string;
  tags: string[];
}

function normalizeHexColor(
  value: string | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  const cleaned = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned;
  return fallback;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${clamp(r).toString(16).padStart(2, "0")}${clamp(g)
    .toString(16)
    .padStart(2, "0")}${clamp(b).toString(16).padStart(2, "0")}`;
}

function mixHex(colorA: string, colorB: string, amount: number): string {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const t = Math.max(0, Math.min(1, amount));
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t,
  );
}

export default function ClubProfile() {
  const { id } = useParams();
  const [data, setData] = useState<ClubPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [upvotes, setUpvotes] = useState<Record<string, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"info" | "success">("info");
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hoveringFollow, setHoveringFollow] = useState(false);

  useEffect(() => {
    const rawSession = localStorage.getItem("user");
    if (!rawSession) return;
    const userSession = JSON.parse(rawSession);
    if (!userSession?.id) return;

    setCurrentUserId(userSession.id);

    const joinedRaw = localStorage.getItem(
      `clubmonkey:joinedClubs:${userSession.id}`,
    );
    if (joinedRaw) {
      const joinedList = JSON.parse(joinedRaw) as Array<{ id: number }>;
      setIsJoined(joinedList.some((clubItem) => clubItem.id === Number(id)));
    }

    const upvoteRaw = localStorage.getItem(
      `clubmonkey:postUpvotes:${userSession.id}`,
    );
    if (upvoteRaw) {
      setUpvotes(JSON.parse(upvoteRaw));
    }

    const followsRaw = localStorage.getItem(
      `clubmonkey:follows:${userSession.id}`,
    );
    if (followsRaw) {
      const followsList = JSON.parse(followsRaw) as number[];
      setIsFollowing(followsList.includes(Number(id)));
    }
  }, [id]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/clubs/${id}`);
        const result = await res.json();
        setData(result);
        setFollowerCount(result.follower_count || 0);
      } catch (error) {
        console.error("Error fetching club details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!currentUserId) return;

    const res = await fetch(`http://127.0.0.1:8000/clubs/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUserId, club_id: Number(id) }),
    });

    const result = await res.json();
    setIsFollowing(result.following);
    setFollowerCount((prev) => (result.following ? prev + 1 : prev - 1));
    setToastMessage(result.following ? "Following!" : "Unfollowed");

    const followsRaw = localStorage.getItem(`clubmonkey:follows:${currentUserId}`);
    let followsList = followsRaw ? (JSON.parse(followsRaw) as number[]) : [];
    if (result.following) {
      if (!followsList.includes(Number(id))) followsList.push(Number(id));
    } else {
      followsList = followsList.filter((fid) => fid !== Number(id));
    }
    localStorage.setItem(`clubmonkey:follows:${currentUserId}`, JSON.stringify(followsList));
  };

  if (loading)
    return (
      <div className="h-screen bg-black flex items-center justify-center text-white">
        Loading Club Page...
      </div>
    );
  if (!data?.club)
    return <div className="text-white text-center mt-20">Club not found.</div>;

  const { club, posts } = data;
  const clubName = String(club.name || "").toLowerCase();
  const primaryHex = normalizeHexColor(club.primary_color, "#07090f");
  const accentHex = normalizeHexColor(club.accent_color, "#3b4f8f");
  const isRudra = clubName === "rudra";

  const darkAccent = mixHex(accentHex, "#05070c", 0.64);
  const matchingTail = mixHex(accentHex, "#101522", 0.52);
  const softGlow = mixHex(accentHex, "#24314d", 0.68);

  const auroraMid = isRudra ? "#b9111a" : darkAccent;
  const auroraTail = isRudra ? "#d97706" : matchingTail;
  const auroraGlow = isRudra ? mixHex(auroraTail, "#f59e0b", 0.24) : softGlow;

  const pageStyle = {
    backgroundColor: primaryHex,
    minHeight: "100vh",
  };

  const buttonStyle = {
    backgroundColor: club.accent_color,
  };

  const handleJoinToggle = () => {
    if (!currentUserId) return;

    const joinedRaw = localStorage.getItem(
      `clubmonkey:joinedClubs:${currentUserId}`,
    );
    const joinedList = joinedRaw ? (JSON.parse(joinedRaw) as JoinedClub[]) : [];

    let next: JoinedClub[];
    if (isJoined) {
      next = joinedList.filter((clubItem) => clubItem.id !== club.id);
    } else {
      next = [
        ...joinedList,
        {
          id: club.id,
          name: club.name,
          accent_color: club.accent_color || "#7c3aed",
          description: club.description || "",
          tags: club.tags || [],
        },
      ];
    }

    localStorage.setItem(
      `clubmonkey:joinedClubs:${currentUserId}`,
      JSON.stringify(next),
    );
    setToastTone(isJoined ? "info" : "success");
    setToastMessage(isJoined ? `Left r/${club.name}` : `Joined r/${club.name}`);
    setIsJoined(!isJoined);
  };

  const handleUpvoteToggle = (postId: number) => {
    if (!currentUserId) return;

    const key = `${club.id}:${postId}`;
    setUpvotes((prev) => {
      const wasUpvoted = Boolean(prev[key]);
      const next = { ...prev, [key]: wasUpvoted ? 0 : 1 };
      localStorage.setItem(
        `clubmonkey:postUpvotes:${currentUserId}`,
        JSON.stringify(next),
      );
      setToastTone(wasUpvoted ? "info" : "success");
      setToastMessage(wasUpvoted ? "Upvote removed" : "Post upvoted");
      return next;
    });
  };

  return (
    <main
      style={pageStyle}
      className="relative text-[#D7DADC] min-h-screen overflow-hidden"
    >
      <div
        className="relative z-20 h-48 w-full"
        style={{ backgroundColor: club.accent_color, opacity: 0.86 }}
      >
        <div className="absolute -bottom-10 left-10 z-30 flex items-end gap-6">
          <img
            src={club.logo_url || "https://via.placeholder.com/150"}
            className="h-32 w-32 rounded-full border-4 shadow-xl"
            style={{ borderColor: club.primary_color }}
            alt="logo"
          />
          <div className="mb-2">
            <h1 className="text-4xl font-bold text-white drop-shadow-md">
              r/{club.name}
            </h1>
            <p className="text-zinc-200 text-sm">
              Created: {new Date(club.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-48 z-0"
        style={{
          background: `
            radial-gradient(circle at 22% 12%, ${auroraGlow}24 0%, transparent 44%),
            radial-gradient(circle at 80% 20%, ${auroraTail}20 0%, transparent 40%),
            linear-gradient(180deg, #020204 0%, ${auroraMid}16 36%, ${auroraTail}12 74%, #05070c 100%)
          `,
          opacity: 0.62,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 mt-16 p-6">
        <section className="md:col-span-8 space-y-6">
          <h2
            className="text-xl font-bold border-b pb-2"
            style={{ borderColor: club.accent_color }}
          >
            Latest Posts
          </h2>

          {posts.length > 0 ? (
            posts.map((post: Post) => (
              <div
                key={post.id}
                className="bg-[#1A1A1B] border border-[#343536] rounded-md p-4 hover:border-zinc-500 transition-all"
              >
                <p className="text-sm text-zinc-400 mb-2">
                  u/admin • {new Date(post.created_at).toLocaleDateString()}
                </p>
                <div className="text-lg font-medium mb-3">{post.content}</div>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    className="rounded-lg w-full object-cover max-h-96"
                    alt="post"
                  />
                )}
                <div className="mt-4 flex gap-4 text-xs font-bold text-zinc-500">
                  <span
                    onClick={() => handleUpvoteToggle(post.id)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      upvotes[`${club.id}:${post.id}`]
                        ? "bg-red-900/20 text-red-400"
                        : "hover:bg-zinc-800"
                    }`}
                  >
                    ▲ UPVOTE {upvotes[`${club.id}:${post.id}`] || 0}
                  </span>
                  <span className="hover:bg-zinc-800 p-1 rounded cursor-pointer">
                    ● COMMENTS
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-zinc-500 py-10 text-center bg-[#1A1A1B] rounded">
              No posts yet from this community.
            </div>
          )}
        </section>

        <section className="md:col-span-4 space-y-4">
          <div className="bg-[#1A1A1B] rounded-md border border-[#343536] overflow-hidden">
            <div
              className="p-3 font-bold text-xs uppercase tracking-tighter"
              style={buttonStyle}
            >
              About Community
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm">{club.description}</p>

              <div className="flex flex-wrap gap-2">
                {club.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-1 rounded-full border"
                    style={{
                      borderColor: club.accent_color,
                      color: club.accent_color,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-400">
                  {followerCount} Followers
                </p>
                <button
                  onMouseEnter={() => setHoveringFollow(true)}
                  onMouseLeave={() => setHoveringFollow(false)}
                  onClick={handleFollowToggle}
                  className={`border rounded-full px-4 py-1 text-xs transition-colors ${
                    isFollowing
                      ? "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-red-900/50 hover:bg-red-900/20 hover:text-red-400"
                      : "border-white/20 hover:bg-white/10 text-white cursor-pointer"
                  }`}
                >
                  {isFollowing ? (hoveringFollow ? "Unfollow" : "Following") : "Follow"}
                </button>
              </div>
              <button
                className={`w-full py-2 rounded-full font-bold transition-transform hover:scale-105 ${
                  isJoined ? "text-zinc-100 bg-zinc-700" : "text-black"
                }`}
                style={isJoined ? undefined : buttonStyle}
                onClick={handleJoinToggle}
              >
                {isJoined ? "Joined" : "Join Club"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <TinyToast message={toastMessage} tone={toastTone} />
    </main>
  );
}
