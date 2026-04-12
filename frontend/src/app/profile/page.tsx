"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TinyToast from "@/components/TinyToast";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  preferences: string[];
}

interface Club {
  id: number;
  name: string;
  description: string;
  accent_color: string;
  tags: string[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  author_id: string;
}

interface ProfileData {
  user: User;
  clubs: Club[];
  recommended_clubs: Club[];
  posted_projects: Project[];
  collaborating_projects: Project[];
}

const AVAILABLE_INTERESTS = [
  "AI",
  "Data",
  "Research",
  "Coding",
  "OS",
  "Design",
  "Art",
  "Creative",
  "Humor",
  "Security",
  "Linux",
  "Python",
  "UI/UX",
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [mockJoinedClubs, setMockJoinedClubs] = useState<Club[]>([]);
  const [mockUpvoteCount, setMockUpvoteCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editingInterests, setEditingInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [savingInterests, setSavingInterests] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"info" | "success">("info");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const rawSession = localStorage.getItem("user");
        if (!rawSession) {
          router.push("/auth");
          return;
        }

        const userSession = JSON.parse(rawSession);
        setCurrentUserId(userSession.id);

        const joinedRaw = localStorage.getItem(`clubmonkey:joinedClubs:${userSession.id}`);
        if (joinedRaw) {
          setMockJoinedClubs(JSON.parse(joinedRaw));
        }

        const upvoteRaw = localStorage.getItem(`clubmonkey:postUpvotes:${userSession.id}`);
        if (upvoteRaw) {
          const upvoteMap = JSON.parse(upvoteRaw) as Record<string, number>;
          const total = Object.values(upvoteMap).reduce((sum, value) => sum + value, 0);
          setMockUpvoteCount(total);
        }

        const followsRaw = localStorage.getItem(`clubmonkey:follows:${userSession.id}`);
        if (followsRaw) {
          setFollowingCount((JSON.parse(followsRaw) as string[]).length);
        }

        const res = await fetch(`${API_BASE_URL}/profile/${userSession.id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = (await res.json()) as ProfileData;
        setProfile(data);
        setSelectedInterests(data.user.preferences || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  if (loading) {
    return (
      <div className="h-screen bg-[#030303] flex items-center justify-center text-zinc-500 font-mono">
        Loading Profile...
      </div>
    );
  }

  if (!profile || !profile.user) {
    return (
      <div className="h-screen bg-[#030303] flex flex-col items-center justify-center text-white p-4">
        <p className="mb-4 text-zinc-500">Profile data unavailable.</p>
        <button onClick={() => router.push("/main")} className="text-red-500 underline">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { user, clubs, recommended_clubs, posted_projects, collaborating_projects } = profile;

  const mergedClubs = [
    ...clubs,
    ...mockJoinedClubs.filter(
      (mockClub) => !clubs.some((existingClub) => existingClub.id === mockClub.id),
    ),
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((entry) => entry !== interest)
        : [...prev, interest],
    );
  };

  const handleSaveInterests = async () => {
    if (!currentUserId) return;

    setSavingInterests(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUserId, interests: selectedInterests }),
      });

      if (!res.ok) {
        throw new Error("Failed to update interests");
      }

      const updatedUser = (await res.json()) as User;
      setProfile((prev) => (prev ? { ...prev, user: updatedUser } : prev));

      const rawSession = localStorage.getItem("user");
      if (rawSession) {
        const sessionUser = JSON.parse(rawSession);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...sessionUser, preferences: selectedInterests }),
        );
      }

      setEditingInterests(false);
      setToastTone("success");
      setToastMessage("Interests updated");
    } catch (error) {
      console.error("Failed to update interests:", error);
      setToastTone("info");
      setToastMessage("Could not save interests");
    } finally {
      setSavingInterests(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030303] text-[#D7DADC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <section className="bg-[#1A1A1B] border border-[#343536] rounded-xl p-6 flex items-start gap-6">
          <img
            src={user.image || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`}
            className="w-24 h-24 rounded-full border-4 border-red-600 bg-zinc-800"
            alt="avatar"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <p className="text-zinc-500">u/{user.id} • {user.email}</p>

            <div className="flex flex-wrap gap-2 mt-3">
              {selectedInterests.map((pref) => (
                <span
                  key={pref}
                  className="text-[10px] bg-red-900/20 text-red-500 border border-red-900/50 px-2 py-0.5 rounded uppercase font-bold"
                >
                  {pref}
                </span>
              ))}
            </div>

            {editingInterests && (
              <div className="mt-4 flex flex-wrap gap-2">
                {AVAILABLE_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-2 py-1 text-[10px] uppercase transition-colors ${
                      selectedInterests.includes(interest)
                        ? "border-red-500 bg-red-500/20 text-red-300"
                        : "border-zinc-600 text-zinc-400"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {editingInterests ? (
              <>
                <button
                  onClick={handleSaveInterests}
                  disabled={savingInterests}
                  className="rounded-full bg-red-600 px-4 py-1 text-xs font-bold text-white disabled:opacity-60"
                >
                  {savingInterests ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setSelectedInterests(user.preferences || []);
                    setEditingInterests(false);
                    setToastTone("info");
                    setToastMessage("Interest edit cancelled");
                  }}
                  className="rounded-full border border-zinc-600 px-4 py-1 text-xs font-bold text-zinc-300"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditingInterests(true);
                  setToastTone("info");
                  setToastMessage("Select interests to update");
                }}
                className="rounded-full border border-zinc-600 px-4 py-1 text-xs font-bold text-zinc-300 hover:border-zinc-500"
              >
                Update Interests
              </button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1A1A1B] border border-[#343536] rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Joined Clubs</p>
            <p className="mt-1 text-2xl font-bold text-white">{mergedClubs.length}</p>
          </div>
          <div className="bg-[#1A1A1B] border border-[#343536] rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Upvotes</p>
            <p className="mt-1 text-2xl font-bold text-white">{mockUpvoteCount}</p>
          </div>
          <div className="bg-[#1A1A1B] border border-[#343536] rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Following</p>
            <p className="mt-1 text-2xl font-bold text-white">{followingCount}</p>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-red-600 rounded"></span>
                My Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posted_projects.length > 0 ? (
                  posted_projects.map((p) => (
                    <Link href={`/project/${p.id}`} key={p.id}>
                      <div className="bg-[#1A1A1B] border border-[#343536] p-4 rounded-lg hover:border-zinc-500 transition-all">
                        <h3 className="font-bold text-white">{p.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{p.description}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="bg-[#1A1A1B] border border-[#343536] border-dashed p-8 rounded-lg text-center text-zinc-600 w-full col-span-2">
                    No projects posted yet.
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-600 rounded"></span>
                Collaborations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {collaborating_projects.length > 0 ? (
                  collaborating_projects.map((p) => (
                    <Link href={`/project/${p.id}`} key={p.id}>
                      <div className="bg-[#1A1A1B] border border-[#343536] p-4 rounded-lg hover:border-zinc-500 transition-all">
                        <h3 className="font-bold text-white">{p.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1">Author ID: {p.author_id}</p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="bg-[#1A1A1B] border border-[#343536] border-dashed p-8 rounded-lg text-center text-zinc-600 w-full col-span-2">
                    You have not joined any teams yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <section className="bg-[#1A1A1B] border border-[#343536] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#343536] bg-[#272729] flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-widest">My Communities</h2>
                {mergedClubs.length === 0 && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-1 rounded uppercase font-bold">
                    Not in any clubs rn
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#343536]">
                {mergedClubs.length > 0 ? (
                  mergedClubs.map((club) => (
                    <Link
                      href={`/clubs/${club.id}`}
                      key={club.id}
                      className="flex items-center gap-3 p-4 hover:bg-[#272729] transition-all"
                    >
                      <div className="w-8 h-8 rounded-full" style={{ backgroundColor: club.accent_color }} />
                      <span className="text-sm font-medium">r/{club.name}</span>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs text-zinc-600 italic">No memberships found</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-[#1A1A1B] border border-[#343536] rounded-xl overflow-hidden shadow-lg shadow-red-900/5">
              <div className="p-4 border-b border-[#343536] bg-red-900/10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-red-500">Recommended For You</h2>
              </div>
              <div className="divide-y divide-[#343536]">
                {recommended_clubs.length > 0 ? (
                  recommended_clubs.map((club) => (
                    <Link
                      href={`/clubs/${club.id}`}
                      key={club.id}
                      className="group flex flex-col p-4 hover:bg-[#272729] transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-6 h-6 rounded-full" style={{ backgroundColor: club.accent_color }} />
                        <span className="text-sm font-bold group-hover:text-red-500 transition-colors">
                          r/{club.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2">{club.description}</p>
                      <div className="flex gap-1 mt-2">
                        {club.tags?.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-xs text-zinc-600">No matching clubs found based on your interests.</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-[#1A1A1B] text-center">
                <button
                  onClick={() => setEditingInterests(true)}
                  className="text-[10px] text-zinc-500 hover:text-white underline transition-colors"
                >
                  Update My Interests
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      <TinyToast message={toastMessage} tone={toastTone} />
    </main>
  );
}
