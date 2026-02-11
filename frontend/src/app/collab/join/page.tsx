"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId");
  const projectTitle = searchParams.get("title");

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth/login");
    } else {
      setUserId(user.id);
    }

    if (!projectId) {
      router.push("/collab");
    }
  }, [router, projectId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevents any weird browser refreshes
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/projects/join?user_id=${userId}&project_id=${projectId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to join project");
      }

      setStatusMsg({ type: "success", text: "Successfully joined the team!" });

      // Keep the UI visible for 2 seconds so they can see the success state
      setTimeout(() => {
        router.push("/collab");
      }, 2000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#1A1A1B] border border-[#343536] rounded-xl p-8 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-4">
        Confirm Collaboration
      </h1>

      <div className="bg-[#272729] p-4 rounded-lg mb-6 border-l-4 border-red-600">
        <p className="text-xs text-zinc-500 uppercase font-bold mb-1">
          Project
        </p>
        <p className="text-lg font-semibold text-white">
          {projectTitle || "Loading..."}
        </p>
      </div>

      {statusMsg.text ? (
        <div
          className={`p-4 rounded-lg mb-6 text-center border ${
            statusMsg.type === "success"
              ? "bg-green-900/20 border-green-500 text-green-500"
              : "bg-red-500/10 border-red-500 text-red-500"
          }`}
        >
          {statusMsg.text}
        </div>
      ) : (
        <p className="text-sm text-zinc-400 mb-8">
          You are about to join this project as a collaborator. u/{userId} will
          be able to see your contact info.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={handleJoin}
          disabled={loading || statusMsg.type === "success"}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full disabled:opacity-50"
        >
          {loading ? "Joining..." : "Confirm Join"}
        </button>
        <button
          onClick={() => router.back()}
          className="text-zinc-500 text-sm hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function JoinProjectPage() {
  return (
    <main className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <JoinContent />
      </Suspense>
    </main>
  );
}
