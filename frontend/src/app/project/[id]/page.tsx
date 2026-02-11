"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
export default function ProjectDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/projects/${id}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      });
  }, [id]);

  const handleJoin = async () => {
    const userSession = JSON.parse(localStorage.getItem("user") || "{}");
    if (!userSession.id) return router.push("/auth/login");

    setJoining(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/projects/join?user_id=${userSession.id}&project_id=${id}`,
        {
          method: "POST",
        },
      );
      const result = await res.json();

      if (res.ok) {
        alert("You've successfully joined the team!");
      } else {
        alert(result.detail || "Failed to join");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setJoining(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen bg-black text-white p-10">
        Loading Project...
      </div>
    );

  const { project, author_name } = data;

  return (
    <main className="min-h-screen bg-[#030303] text-[#D7DADC] p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-zinc-500 hover:text-white mb-6 flex items-center gap-2"
        >
          ← Back to Hub
        </button>

        <div className="bg-[#1A1A1B] border border-[#343536] rounded-xl p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {project.title}
              </h1>
              <p className="text-zinc-500">
                Posted by{" "}
                <span className="text-red-500 font-medium">
                  u/{author_name}
                </span>
              </p>
            </div>
            <div className="px-4 py-1 bg-green-900/20 text-green-500 border border-green-500 rounded text-xs font-bold uppercase">
              {project.status}
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold text-white mb-3 border-b border-[#343536] pb-2">
                Description
              </h3>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-bold text-white mb-3 border-b border-[#343536] pb-2">
                Requirements
              </h3>
              <div className="flex flex-wrap gap-3">
                {project.requirements.map((req: string) => (
                  <span
                    key={req}
                    className="bg-[#272729] px-4 py-2 rounded-lg text-sm border border-[#343536]"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </section>

            <Link
              href={`/collab/join?projectId=${project.id}&title=${encodeURIComponent(project.title)}`}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center"
            >
              Collaborate on Project
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
