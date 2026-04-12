"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TextType from "@/components/TextType";
import SpotlightCard from "@/components/SpotlightCard";

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
  const router = useRouter();

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
      <main className="relative min-h-screen overflow-hidden bg-black p-6 text-white md:p-10">
        <div
          className={`relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center transition-opacity duration-500 ${
            introFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="w-full rounded-[30px] border border-white/10 bg-black">
            <div className="min-h-[320px] px-6 py-14 text-left md:min-h-[360px] md:px-12">
              <TextType
                as="h1"
                className="max-w-5xl text-4xl font-bold leading-[1.15] text-white md:text-7xl"
                text={[
                  "welcome to club monkey",
                  "what you like.. you choose...<3",
                  "no judgement from anyone ;)",
                ]}
                typingSpeed={56}
                pauseDuration={1350}
                deletingSpeed={36}
                showCursor
                cursorCharacter="|"
                cursorBlinkDuration={0.55}
                loop={false}
                onComplete={handleIntroComplete}
              />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-[#04060f] p-6 text-white transition-opacity duration-700 md:p-10 ${
        onboardingVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(114,156,255,0.22),transparent_45%),radial-gradient(circle_at_88%_10%,rgba(255,68,68,0.16),transparent_42%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center justify-center">
        <SpotlightCard
          className="w-full max-w-[1120px]"
          spotlightColor="rgba(0, 229, 255, 0.17)"
        >
          <div className="px-5 py-12 text-center md:px-16 md:py-16">
            <h1 className="text-5xl font-bold tracking-tight md:text-7xl">What are you into?</h1>
            <p className="mb-10 mt-5 text-zinc-300/70 md:text-lg">
              Select your domains to personalize your hub.
            </p>

            <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3.5 md:gap-4">
              {AVAILABLE_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-7 py-3 text-lg tracking-[0.01em] transition-all duration-200 md:text-[1.03rem] ${
                    selected.includes(interest)
                      ? "!border-blue-200/70 !bg-[linear-gradient(180deg,rgba(114,156,255,0.3),rgba(88,128,240,0.22))] !text-white shadow-[0_0_28px_rgba(125,170,255,0.42)]"
                      : "border-slate-300/25 bg-[#18243f]/58 text-zinc-100 shadow-[0_0_22px_rgba(97,140,255,0.26)] hover:border-slate-300/45 hover:bg-[#1d2d4d]/72"
                  }`}
                  aria-pressed={selected.includes(interest)}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`text-sm ${selected.includes(interest) ? "text-blue-50" : "text-blue-200/80"}`}
                    >
                      {"\u2726"}
                    </span>
                    <span className="text-sm text-blue-200/65">{"\u2726"}</span>
                    {interest}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleFinish}
              disabled={selected.length === 0 || saving}
              className="mt-14 rounded-full border border-slate-200/35 bg-[#2f3d5f]/58 px-14 py-4 text-[2.15rem] font-semibold text-white shadow-[0_0_20px_rgba(114,156,255,0.3)] transition-all duration-200 hover:bg-[#394a73]/72 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="mr-2 text-blue-200/70">{"\u2726"}</span>
              {saving ? "Saving..." : "Done"}
            </button>
          </div>
        </SpotlightCard>
      </div>
    </main>
  );
}
