"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProject() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "", // Will be split into an array
  });

  useEffect(() => {
    // Ensure user is logged in
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth/login");
    } else {
      setUserId(user.id);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Preparing the payload to match FastAPI ProjectCreate schema
    const payload = {
      author_id: userId,
      title: formData.title,
      description: formData.description,
      // Convert "React, Python, Tailwind" -> ["React", "Python", "Tailwind"]
      requirements: formData.requirements
        .split(",")
        .map((req) => req.trim())
        .filter((req) => req !== ""),
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to create project");
      }

      // Success! Redirect back to the Hub
      router.push("/collab");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030303] text-[#D7DADC] p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-white mb-6 transition-colors"
        >
          ← Cancel
        </button>

        <div className="bg-[#1A1A1B] border border-[#343536] rounded-xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2">
            Create a Project
          </h1>
          <p className="text-zinc-500 mb-8 text-sm">
            List your project details and find the best collaborators in the
            university.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Project Title
              </label>
              <input
                type="text"
                placeholder="e.g. AI-Powered Campus Map"
                className="w-full bg-[#272729] border border-[#343536] rounded-lg py-3 px-4 text-white outline-none focus:border-red-500 transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Detailed Description
              </label>
              <textarea
                placeholder="Explain the goals, current progress, and why people should join..."
                rows={6}
                className="w-full bg-[#272729] border border-[#343536] rounded-lg py-3 px-4 text-white outline-none focus:border-red-500 transition-all resize-none"
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Requirements
              </label>
              <input
                type="text"
                placeholder="React, FastAPI, Python, UI/UX (comma separated)"
                className="w-full bg-[#272729] border border-[#343536] rounded-lg py-3 px-4 text-white outline-none focus:border-red-500 transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                required
              />
              <p className="text-[10px] text-zinc-600 italic">
                Separate each skill or tool with a comma.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all mt-4 ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Publishing..." : "Post Project to Hub"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
