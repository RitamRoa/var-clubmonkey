"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // 1. Get the session INSIDE the function to ensure it exists
        const rawSession = localStorage.getItem("user");
        if (!rawSession) {
          router.push("/auth/login");
          return;
        }

        const userSession = JSON.parse(rawSession);
        const url = `http://127.0.0.1:8000/profile/${userSession.id}`;

        console.log("Fetching from:", url);

        const res = await fetch(url);

        if (!res.ok) {
          const errorData = await res.json();
          console.error("Server Error Detail:", errorData);
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (loading)
    return (
      <div className="h-screen bg-[#030303] flex items-center justify-center text-zinc-500 font-mono">
        Loading Profile...
      </div>
    );

  // Guard clause: If profile or profile.user is missing, show error instead of crashing
  if (!profile || !profile.user) {
    return (
      <div className="h-screen bg-[#030303] flex flex-col items-center justify-center text-white p-4">
        <p className="mb-4 text-zinc-500">Profile data unavailable.</p>
        <button
          onClick={() => router.push("/main")}
          className="text-red-500 underline"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const {
    user,
    clubs,
    recommended_clubs,
    posted_projects,
    collaborating_projects,
  } = profile;

  return (
    <main className="min-h-screen bg-[#030303] text-[#D7DADC] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* --- 1. USER HEADER --- */}
        <section className="bg-[#1A1A1B] border border-[#343536] rounded-xl p-6 flex items-center gap-6">
          <img
            // Optional chaining added here as a second layer of safety
            src={
              user?.image ||
              `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.name}`
            }
            className="w-24 h-24 rounded-full border-4 border-red-600 bg-zinc-800"
            alt="avatar"
          />
          <div>
            <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
            <p className="text-zinc-500">
              u/{user?.id} • {user?.email}
            </p>
            <div className="flex gap-2 mt-3">
              {user?.preferences?.map((pref: string) => (
                <span
                  key={pref}
                  className="text-[10px] bg-red-900/20 text-red-500 border border-red-900/50 px-2 py-0.5 rounded uppercase font-bold"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN: PROJECTS */}
          <div className="lg:col-span-8 space-y-8">
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-red-600 rounded"></span>
                My Projects
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posted_projects?.length > 0 ? (
                  posted_projects.map((p: any) => (
                    <Link href={`/project/${p.id}`} key={p.id}>
                      <div className="bg-[#1A1A1B] border border-[#343536] p-4 rounded-lg hover:border-zinc-500 transition-all">
                        <h3 className="font-bold text-white">{p.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                          {p.description}
                        </p>
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
                {collaborating_projects?.length > 0 ? (
                  collaborating_projects.map((p: any) => (
                    <Link href={`/project/${p.id}`} key={p.id}>
                      <div className="bg-[#1A1A1B] border border-[#343536] p-4 rounded-lg hover:border-zinc-500 transition-all">
                        <h3 className="font-bold text-white">{p.title}</h3>
                        <p className="text-xs text-zinc-500 mt-1">
                          Author ID: {p.author_id}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="bg-[#1A1A1B] border border-[#343536] border-dashed p-8 rounded-lg text-center text-zinc-600 w-full col-span-2">
                    You haven't joined any teams yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: CLUBS */}
          {/* RIGHT COLUMN: CLUBS & RECOMMENDATIONS */}
          <div className="lg:col-span-4 space-y-8">
            {/* MY COMMUNITIES SECTION */}
            <section className="bg-[#1A1A1B] border border-[#343536] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#343536] bg-[#272729] flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-widest">
                  My Communities
                </h2>
                {/* BADGE LOGIC: Show if clubs list is empty */}
                {clubs?.length === 0 && (
                  <span className="text-[10px] bg-zinc-800 text-zinc-500 border border-zinc-700 px-2 py-1 rounded uppercase font-bold">
                    Not in any clubs rn
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#343536]">
                {clubs?.length > 0 ? (
                  clubs.map((club: any) => (
                    <Link
                      href={`/clubs/${club.id}`}
                      key={club.id}
                      className="flex items-center gap-3 p-4 hover:bg-[#272729] transition-all"
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: club.accent_color }}
                      ></div>
                      <span className="text-sm font-medium">r/{club.name}</span>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs text-zinc-600 italic">
                      No memberships found
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* RECOMMENDED CLUBS SECTION */}
            <section className="bg-[#1A1A1B] border border-[#343536] rounded-xl overflow-hidden shadow-lg shadow-red-900/5">
              <div className="p-4 border-b border-[#343536] bg-red-900/10">
                <h2 className="text-sm font-bold uppercase tracking-widest text-red-500">
                  Recommended For You
                </h2>
              </div>
              <div className="divide-y divide-[#343536]">
                {recommended_clubs?.length > 0 ? (
                  recommended_clubs.map((club: any) => (
                    <Link
                      href={`/clubs/${club.id}`}
                      key={club.id}
                      className="group flex flex-col p-4 hover:bg-[#272729] transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: club.accent_color }}
                        ></div>
                        <span className="text-sm font-bold group-hover:text-red-500 transition-colors">
                          r/{club.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2">
                        {club.description}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {club.tags?.slice(0, 2).map((tag: string) => (
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
                    <p className="text-xs text-zinc-600">
                      No matching clubs found based on your interests.
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-[#1A1A1B] text-center">
                <button
                  onClick={() => router.push("/onboarding")}
                  className="text-[10px] text-zinc-500 hover:text-white underline transition-colors"
                >
                  Update My Interests
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
