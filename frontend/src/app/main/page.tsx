"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Club {
  id: number;
  name: string;
  description: string;
  accent_color: string;
  tags: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [recommendedClubs, setRecommendedClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Mock feed data
  const mockFeedItems = [
    { id: 1, title: "Getting Started with Coding", author: "TechGuru", category: "Tech" },
    { id: 2, title: "Design Tips for Beginners", author: "CreativeMinds", category: "Design" },
    { id: 3, title: "Project Management Hacks", author: "ProductPro", category: "Business" },
    { id: 4, title: "Advanced React Patterns", author: "CodeMaster", category: "Tech" },
    { id: 5, title: "UI/UX Best Practices", author: "DesignerLife", category: "Design" },
    { id: 6, title: "Leadership in Teams", author: "LeadOn", category: "Business" },
  ];

  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem("user") || "{}");
    if (!userSession.id) {
      router.push("/auth/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [uRes, cRes, rRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/users"),
          fetch("http://127.0.0.1:8000/clubs"),
          fetch(`http://127.0.0.1:8000/clubs/recommended/${userSession.id}`),
        ]);

        const uData = await uRes.json();
        const cData = await cRes.json();
        const rData = await rRes.json();

        setUsers(uData);
        setAllClubs(cData);
        setRecommendedClubs(rData);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading)
    return (
      <div className="h-screen bg-[#030303] flex items-center justify-center text-zinc-500">
        Loading ClubMonkey...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#030303] text-[#D7DADC]">
      {/* REDDIT SEARCH BAR HEADER */}
      <header className="sticky top-0 z-50 h-12 bg-[#1A1A1B] border-b border-[#343536] px-4 flex items-center gap-4">
        <div className="text-red-500 font-bold text-xl">ClubMonkey</div>

        <div className="flex-1 max-w-2xl mx-auto flex items-center gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search ClubMonkey"
              className="w-full bg-[#272729] border border-[#343536] rounded-full py-1.5 px-10 text-sm focus:outline-none focus:bg-[#1A1A1B] focus:border-[#D7DADC]"
            />
            <svg
              className="absolute left-3 top-2 w-4 h-4 text-zinc-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* COLLAB BUTTON */}
          <Link href="/collab">
            <button className="hidden md:block text-xs font-bold border border-[#343536] px-4 py-1.5 rounded-full hover:bg-[#272729] transition-colors whitespace-nowrap">
              Collab on Projects
            </button>
          </Link>
        </div>

        {/* PROFILE CIRCULAR BUTTON */}
        <Link href="/profile">
          <button className="w-8 h-8 rounded-full bg-zinc-700 border border-[#343536] flex items-center justify-center hover:border-zinc-500 transition-colors overflow-hidden">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 text-zinc-400"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </Link>
      </header>

      {/* THREE COLUMN LAYOUT */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 p-4">
        {/* LEFT COLUMN: ALL COMMUNITIES */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">
            All Communities
          </h2>
          <div className="bg-[#1A1A1B] rounded border border-[#343536] overflow-hidden">
            {allClubs.map((club) => (
              <Link key={club.id} href={`/clubs/${club.id}`}>
                <div className="flex items-center gap-3 p-3 hover:bg-[#272729] cursor-pointer border-b border-[#343536] last:border-0">
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ backgroundColor: club.accent_color }}
                  ></div>
                  <span className="text-sm font-medium">r/{club.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* MIDDLE COLUMN: YOUR FEED */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">
            Your Feed
          </h2>
          <div className="space-y-4">
            {mockFeedItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#1A1A1B] border border-[#343536] rounded p-4 hover:border-zinc-500 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[11px] font-bold bg-red-600 text-white px-2 py-1 rounded">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 hover:text-red-500 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400">by {item.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* RIGHT COLUMN: RECOMMENDED FOR YOU + ACTIVE MEMBERS */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">
            Recommended for You
          </h2>
          <div className="bg-[#1A1A1B] border border-[#343536] rounded p-4 space-y-4">
            {recommendedClubs.length > 0 ? (
              recommendedClubs.map((club) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="group block border-b border-[#343536] pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-10 rounded"
                      style={{ backgroundColor: club.accent_color }}
                    ></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold group-hover:text-red-500 transition-colors">
                        r/{club.name}
                      </p>
                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {club.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {club.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] bg-[#272729] text-zinc-400 px-2 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No matches found.</p>
            )}
          </div>

          {/* ACTIVE MEMBERS */}
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-2">
            Active Members
          </h2>
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-[#1A1A1B] border border-[#343536] rounded p-3 flex items-center justify-between hover:border-zinc-500 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  <img
                    src={
                      user.image ||
                      `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`
                    }
                    className="w-8 h-8 rounded bg-zinc-800"
                    alt="avatar"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      u/{user.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded whitespace-nowrap ml-2">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
