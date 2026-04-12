"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TextType from "@/components/TextType";
import SpotlightCard from "@/components/SpotlightCard";
import Aurora from "@/components/Aurora";

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

export default function Onboarding() {
  const [selected, setSelected] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introFading, setIntroFading] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [displayedIntroText, setDisplayedIntroText] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!showIntro) return;

    const messages = [
      "welcome to club monkey",
      "what you like.. you choose...<3",
      "no judgement from anyone ;)",
    ];
    let msgIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const type = () => {
      const currentMsg = messages[msgIndex];
      if (isDeleting) {
        setDisplayedIntroText(currentMsg.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setDisplayedIntroText(currentMsg.substring(0, charIndex + 1));
        charIndex++;
      }

      let speed = isDeleting ? 40 : 80;

      if (!isDeleting && charIndex === currentMsg.length) {
        if (msgIndex === messages.length - 1) {
          setTimeout(handleIntroComplete, 1200);
          return;
        }
        speed = 1500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        msgIndex++;
        speed = 500;
      }

      timer = setTimeout(type, speed);
    };

    timer = setTimeout(type, 1000);
    return () => clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth");
      return;
    }
    setUserId(user.id);
    if (Array.isArray(user.preferences) && user.preferences.length > 0) {
      setSelected(user.preferences);
    }
  }, [router]);

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleFinish = async () => {
    if (!userId || selected.length === 0 || saving) return;

    try {
      setSaving(true);
      const res = await fetch(`${API_BASE_URL}/users/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, interests: selected }),
      });

      if (!res.ok) {
        throw new Error("Failed to save preferences");
      }

      const updatedUser = await res.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));
      router.push("/recommended-clubs");
    } catch (err) {
      console.error("Failed to save preferences");
      alert("Could not save your selections. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleIntroComplete = () => {
    setIntroFading(true);
    window.setTimeout(() => {
      setShowIntro(false);
      setOnboardingVisible(false);
      window.setTimeout(() => {
        setOnboardingVisible(true);
      }, 40);
    }, 460);
  };

  if (showIntro) {
    return (
      <main className="relative min-h-screen flex items-center justify-center bg-[#010208] p-6 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <Aurora
            colorStops={["#00f2ff", "#7000ff", "#ff0080"]} // Cyan, Deep Purple, Hot Pink
            blend={0.5}
            amplitude={1.0}
            speed={0.8}
          />
        </div>
        <div
          className={`relative z-10 w-full max-w-4xl transition-opacity duration-700 ${
            introFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="min-h-[280px] flex items-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              <span className="inline-block min-h-[1.2em]">
                {displayedIntroText}
              </span>
              <span className="inline-block ml-1 animate-pulse font-light text-zinc-500">|</span>
            </h1>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen relative bg-[#010208] text-white p-6 md:p-12 font-sans selection:bg-cyan-500/30 overflow-x-hidden"
    >
      {/* Background Aurora */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none grayscale">
        <Aurora
          colorStops={["#ffffff", "#27272a", "#000000"]} 
          blend={0.9}
          amplitude={0.5}
          speed={0.3}
        />
      </div>

      <div className="max-w-4xl mx-auto pt-10 md:pt-20 relative z-10">
        <header className="mb-14 space-y-1">
          <h1 className="text-2xl font-medium tracking-tight">
            Select Interests
          </h1>
          <p className="text-zinc-600 text-xs uppercase tracking-widest">
            {selected.length} Selected
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {AVAILABLE_INTERESTS.map((interest) => {
            const isActive = selected.includes(interest);
            return (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`
                  group relative px-5 py-4 rounded-lg text-left transition-all duration-300
                  active:scale-[0.98]
                  ${isActive 
                    ? "bg-white text-black" 
                    : "bg-transparent text-zinc-600 hover:text-zinc-300"
                  }
                `}
              >
                <span className="text-sm font-medium tracking-tight">
                  {interest}
                </span>
                {isActive && (
                  <div className="absolute top-1 right-2 text-[10px] font-bold">✓</div>
                )}
              </button>
            );
          })}
        </div>

        <footer className="mt-16 flex flex-col items-center">
          <button
            onClick={handleFinish}
            disabled={selected.length === 0 || saving}
            className={`
              px-12 py-3 rounded-md text-xs font-semibold uppercase tracking-widest transition-all duration-500
              ${selected.length > 0 
                ? "bg-white text-black hover:bg-zinc-200" 
                : "text-zinc-700 cursor-not-allowed"
              }
            `}
          >
            {saving ? "..." : "Next"}
          </button>
        </footer>
      </div>
    </main>
  );
}
