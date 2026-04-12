"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Aurora from "@/components/Aurora";
import Carousel, { type CarouselItem } from "@/components/Carousel";
import TinyToast from "@/components/TinyToast";
import { FiAperture, FiHeart, FiPlusSquare, FiSmile, FiUsers } from "react-icons/fi";

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

interface SearchSuggestion {
  id: string;
  label: string;
  sublabel: string;
  type: "feed" | "club" | "user";
  href?: string;
}

const FEED_ITEMS = [
  {
    id: 1,
    title: "Getting Started with Coding",
    author: "TechGuru",
    category: "Tech",
  },
  {
    id: 2,
    title: "Design Tips for Beginners",
    author: "CreativeMinds",
    category: "Design",
  },
  {
    id: 3,
    title: "Project Management Hacks",
    author: "ProductPro",
    category: "Business",
  },
  {
    id: 4,
    title: "Advanced React Patterns",
    author: "CodeMaster",
    category: "Tech",
  },
  {
    id: 5,
    title: "UI/UX Best Practices",
    author: "DesignerLife",
    category: "Design",
  },
  {
    id: 6,
    title: "Leadership in Teams",
    author: "LeadOn",
    category: "Business",
  },
];

const ONBOARDING_ITEMS: CarouselItem[] = [
  {
    title: "Club Monkey",
    description: "collab create and monke",
    id: 1,
    icon: <FiAperture className="carousel-icon" />,
  },
  {
    title: "Collab",
    description: "collab with projejcts with your mates",
    id: 2,
    icon: <FiUsers className="carousel-icon" />,
  },
  {
    title: "Create",
    description: "create clubs and collabs (admin approved obvi)",
    id: 3,
    icon: <FiPlusSquare className="carousel-icon" />,
  },
  {
    title: "Meet",
    description: "say hi to the new people",
    id: 4,
    icon: <FiSmile className="carousel-icon" />,
  },
  {
    title: "BE NICE",
    description: "and monke obvi",
    id: 5,
    icon: <FiHeart className="carousel-icon" />,
  },
];

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [recommendedClubs, setRecommendedClubs] = useState<Club[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"info" | "success">("info");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [carouselWidth, setCarouselWidth] = useState(320);
  const [loading, setLoading] = useState(true);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const searchSuggestions = useMemo<SearchSuggestion[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const feedMatches = FEED_ITEMS
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query)
      )
      .slice(0, 4)
      .map((item) => ({
        id: `feed-${item.id}`,
        label: item.title,
        sublabel: `${item.category} • by ${item.author}`,
        type: "feed" as const,
      }));

    const clubMatches = allClubs
      .filter(
        (club) =>
          club.name.toLowerCase().includes(query) ||
          club.description?.toLowerCase().includes(query) ||
          club.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
      .slice(0, 4)
      .map((club) => ({
        id: `club-${club.id}`,
        label: `r/${club.name}`,
        sublabel: club.description || "Club",
        type: "club" as const,
        href: `/clubs/${club.id}`,
      }));

    const userMatches = users
      .filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
      .slice(0, 3)
      .map((user) => ({
        id: `user-${user.id}`,
        label: `u/${user.name}`,
        sublabel: user.email,
        type: "user" as const,
      }));

    return [...clubMatches, ...feedMatches, ...userMatches].slice(0, 8);
  }, [allClubs, searchQuery, users]);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.label);
    setIsSearchFocused(false);
    setActiveSuggestionIndex(-1);

    if (suggestion.href) {
      router.push(suggestion.href);
    }
  };

  useEffect(() => {
    const userSession = JSON.parse(localStorage.getItem("user") || "{}");
    if (!userSession.id) {
      router.push("/auth");
      return;
    }
    setCurrentUserId(userSession.id);
    const savedFollowState = localStorage.getItem(`clubmonkey:follows:${userSession.id}`);
    if (savedFollowState) {
      setFollowedUserIds(JSON.parse(savedFollowState));
    }

    const onboardingSeen =
      localStorage.getItem(`clubmonkey:onboardingSeen:${userSession.id}`) === "true";
    if (!onboardingSeen) {
      setShowOnboarding(true);
    }

    const fetchData = async () => {
      try {
        const [uRes, cRes, rRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users`),
          fetch(`${API_BASE_URL}/clubs`),
          fetch(`${API_BASE_URL}/clubs/recommended/${userSession.id}`),
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

  useEffect(() => {
    const updateWidth = () => {
      setCarouselWidth(Math.min(520, Math.max(280, window.innerWidth - 72)));
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (showOnboarding) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showOnboarding]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (activeSuggestionIndex >= searchSuggestions.length) {
      setActiveSuggestionIndex(searchSuggestions.length - 1);
    }
  }, [activeSuggestionIndex, searchSuggestions.length]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const closeOnboarding = () => {
    if (currentUserId) {
      localStorage.setItem(`clubmonkey:onboardingSeen:${currentUserId}`, "true");
    }
    setShowOnboarding(false);
  };

  const handleFollowToggle = (userId: string, userName: string) => {
    setFollowedUserIds((prev) => {
      const wasFollowing = prev.includes(userId);
      const next = prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId];

      if (currentUserId) {
        localStorage.setItem(`clubmonkey:follows:${currentUserId}`, JSON.stringify(next));
      }

      setToastTone(wasFollowing ? "info" : "success");
      setToastMessage(wasFollowing ? `Unfollowed u/${userName}` : `Following u/${userName}`);

      return next;
    });
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-black text-zinc-400">
        <div className="flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <span>Loading ClubMonkey...</span>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-zinc-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(48,86,178,0.2),transparent_42%),radial-gradient(circle_at_90%_12%,rgba(86,64,146,0.14),transparent_38%),linear-gradient(180deg,#020207_0%,#070910_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-72 mix-blend-screen aurora-layer">
        <Aurora
          colorStops={["#23386a", "#080b1c", "#21143a"]}
          blend={0.52}
          amplitude={1.02}
          speed={0.7}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/12 bg-black/82 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1320px] items-center gap-4 px-4 md:px-6">
          <div className="text-xl font-bold tracking-tight text-white">
            <span>Club</span>Monkey
          </div>

          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <div className="relative flex-1" ref={searchContainerRef}>
              <svg
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="text"
                placeholder="Search ClubMonkey"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveSuggestionIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (!searchSuggestions.length) return;

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) =>
                      prev < searchSuggestions.length - 1 ? prev + 1 : 0
                    );
                  }

                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiveSuggestionIndex((prev) =>
                      prev > 0 ? prev - 1 : searchSuggestions.length - 1
                    );
                  }

                  if (e.key === "Enter") {
                    e.preventDefault();
                    const chosenSuggestion =
                      activeSuggestionIndex >= 0
                        ? searchSuggestions[activeSuggestionIndex]
                        : searchSuggestions[0];

                    if (chosenSuggestion) {
                      handleSelectSuggestion(chosenSuggestion);
                    }
                  }

                  if (e.key === "Escape") {
                    setIsSearchFocused(false);
                    setActiveSuggestionIndex(-1);
                  }
                }}
                className="w-full rounded-full border border-white/12 bg-white/5 py-2 pl-9 pr-4 text-sm text-zinc-200 placeholder:text-zinc-500 focus:border-white/40 focus:outline-none"
              />

              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-white/14 bg-[#080a10]/96 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  {searchSuggestions.length > 0 ? (
                    <ul className="max-h-80 overflow-y-auto py-1">
                      {searchSuggestions.map((suggestion, index) => (
                        <li key={suggestion.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectSuggestion(suggestion)}
                            className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                              index === activeSuggestionIndex
                                ? "bg-white/12"
                                : "hover:bg-white/7"
                            }`}
                          >
                            <span className="mt-0.5 inline-block rounded border border-white/20 bg-white/6 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                              {suggestion.type}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-zinc-100">
                                {suggestion.label}
                              </span>
                              <span className="block truncate text-xs text-zinc-400">
                                {suggestion.sublabel}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3 py-2.5 text-xs text-zinc-400">
                      No suggestions found.
                    </p>
                  )}
                </div>
              )}
            </div>

            <Link href="/collab">
              <button className="hidden rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-semibold text-zinc-100 transition-colors hover:bg-white/14 md:block">
                Collab on Projects
              </button>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/7 text-sm font-semibold text-zinc-200 transition-colors hover:border-white/35"
              aria-label="Show onboarding"
              title="Show onboarding"
            >
              i
            </button>
            <Link href="/profile">
              <button className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/7 transition-colors hover:border-white/35">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5 text-zinc-300"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main
        className={`relative z-10 mx-auto grid max-w-[1320px] grid-cols-1 gap-6 p-4 transition-[filter] duration-300 md:p-6 lg:grid-cols-12 ${
          showOnboarding ? "blur-[3px]" : ""
        }`}
      >
        <section className="space-y-4 lg:col-span-3">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400/80">
            All Communities
          </h2>
          <div className="dashboard-card overflow-hidden">
            {allClubs.map((club, index) => (
              <Link key={club.id} href={`/clubs/${club.id}`}>
                <div
                  className="dashboard-item-enter flex cursor-pointer items-center gap-3 border-b border-white/8 p-3 transition-colors hover:bg-white/5 last:border-0"
                  style={{ animationDelay: `${80 + index * 26}ms` }}
                >
                  <div
                    className="h-8 w-8 rounded-full ring-1 ring-white/15 shadow-[0_0_12px_rgba(255,255,255,0.14)]"
                    style={{ backgroundColor: club.accent_color }}
                  />
                  <span className="text-sm font-medium text-zinc-200">r/{club.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-5">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400/80">
            Your Feed
          </h2>
          <div className="space-y-4">
            {FEED_ITEMS.map((item, index) => (
              <div
                key={item.id}
                className="dashboard-card dashboard-card-hover dashboard-item-enter cursor-pointer p-4"
                style={{ animationDelay: `${140 + index * 45}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="rounded border border-white/18 bg-white/10 px-2 py-1 text-[11px] font-bold text-white">
                    {item.category}
                  </span>
                </div>
                <h3 className="mb-2 line-clamp-2 text-sm font-bold text-white transition-colors hover:text-zinc-200">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400/85">by {item.author}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 lg:col-span-4">
          <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400/80">
            Recommended for You
          </h2>
          <div className="dashboard-card space-y-4 p-4">
            {recommendedClubs.length > 0 ? (
              recommendedClubs.map((club, index) => (
                <Link
                  key={club.id}
                  href={`/clubs/${club.id}`}
                  className="dashboard-item-enter group block border-b border-white/8 pb-4 last:border-0 last:pb-0"
                  style={{ animationDelay: `${180 + index * 42}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-2 rounded shadow-[0_0_14px_rgba(255,255,255,0.16)]"
                      style={{ backgroundColor: club.accent_color }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-100 transition-colors group-hover:text-zinc-200">
                        r/{club.name}
                      </p>
                      <p className="line-clamp-2 text-xs text-zinc-400/85">
                        {club.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {club.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-white/7 px-2 py-0.5 text-[9px] text-zinc-300/90"
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

          <h2 className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400/80">
            Active Members
          </h2>
          <div className="space-y-3">
            {users.map((user, index) => (
              <div
                key={user.id}
                className="dashboard-card dashboard-card-hover dashboard-item-enter flex items-center justify-between p-3"
                style={{ animationDelay: `${240 + index * 26}ms` }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <img
                    src={
                      user.image ||
                      `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.name}`
                    }
                    className="h-8 w-8 rounded bg-zinc-800 ring-1 ring-white/15"
                    alt="avatar"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">
                      u/{user.name}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFollowToggle(user.id, user.name)}
                  className={`ml-2 whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold transition-colors ${
                    followedUserIds.includes(user.id)
                      ? "bg-[#2a3b58] text-zinc-100 hover:bg-[#33486d]"
                      : "bg-white/10 text-zinc-100 hover:bg-white/16"
                  }`}
                >
                  {followedUserIds.includes(user.id) ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {showOnboarding && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-black/45 px-4 pt-16 md:pt-20"
          onClick={closeOnboarding}
        >
          <div
            className="w-full max-w-[540px] rounded-2xl border border-white/10 bg-[#07080b] p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                onboarding
              </p>
              <button
                type="button"
                onClick={closeOnboarding}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition-colors hover:bg-white/5"
              >
                close
              </button>
            </div>

            <div className="flex justify-center">
              <Carousel
                items={ONBOARDING_ITEMS}
                baseWidth={carouselWidth}
                autoplay
                autoplayDelay={3200}
                pauseOnHover
                loop
              />
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={closeOnboarding}
                className="rounded-full border border-white/12 bg-white/6 px-4 py-1.5 text-xs font-medium text-zinc-100 transition-colors hover:bg-white/10"
              >
                done
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-card {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: linear-gradient(180deg, rgba(14, 14, 14, 0.88), rgba(8, 8, 8, 0.95));
          border-radius: 14px;
          backdrop-filter: blur(6px);
          box-shadow:
            0 14px 40px rgba(0, 0, 0, 0.42),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
          animation: cardEnter 420ms ease both;
        }

        .dashboard-item-enter {
          opacity: 0;
          animation: itemRise 520ms cubic-bezier(0.2, 0.75, 0.2, 1) forwards;
        }

        .aurora-layer {
          animation: auroraBreath 8.5s ease-in-out infinite;
        }

        .dashboard-card-hover {
          transition: border-color 220ms ease, transform 220ms ease, background-color 220ms ease;
        }

        .dashboard-card-hover:hover {
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }

        @keyframes cardEnter {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes itemRise {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes auroraBreath {
          0%,
          100% {
            opacity: 0.62;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.02);
          }
        }
      `}</style>

      <TinyToast message={toastMessage} tone={toastTone} />
    </div>
  );
}
