"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function Onboarding() {
  const [selected, setSelected] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) router.push("/auth/login");
    setUserId(user.id);
  }, []);

  const toggleInterest = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  const handleFinish = async () => {
    if (selected.length === 0) return alert("Select at least one!");

    try {
      const res = await fetch("http://127.0.0.1:8000/users/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, interests: selected }),
      });

      if (res.ok) router.push("/recommended-clubs");
    } catch (err) {
      console.error("Failed to save preferences");
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] text-white p-10 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-4">What are you into?</h1>
      <p className="text-zinc-400 mb-10">
        Select your domains to personalize your hub.
      </p>

      <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
        {AVAILABLE_INTERESTS.map((interest) => (
          <button
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={`px-6 py-3 rounded-full border-2 transition-all ${
              selected.includes(interest)
                ? "bg-red-600 border-red-600"
                : "border-zinc-700 hover:border-zinc-500"
            }`}
          >
            {interest}
          </button>
        ))}
      </div>

      <button
        onClick={handleFinish}
        className="mt-12 px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors"
      >
        Done
      </button>
    </main>
  );
}
