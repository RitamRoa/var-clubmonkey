"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Aurora from "@/components/Aurora";

interface Project {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  status: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function CollabHub() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/allprojects`)
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (loading)
    return (
      <div className="p-10 text-white bg-black min-h-screen">
        Loading Hub...
      </div>
    );

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-[#D7DADC] p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(48,86,178,0.16),transparent_42%),radial-gradient(circle_at_90%_12%,rgba(86,64,146,0.11),transparent_38%),linear-gradient(180deg,#020207_0%,#070910_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-66 mix-blend-screen">
        <Aurora
          colorStops={["#1f2f59", "#070a18", "#1c1433"]}
          blend={0.46}
          amplitude={0.94}
          speed={0.68}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Collaboration Hub</h1>
            <p className="text-zinc-500 text-sm">
              Find teammates for your next big idea
            </p>
          </div>
          <Link
            href="/collab/new"
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full transition-all"
          >
            Post Project
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link href={`/project/${project.id}`} key={project.id}>
              <div className="bg-[#1A1A1B] border border-[#343536] p-6 rounded-lg hover:border-zinc-500 cursor-pointer transition-all h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-white line-clamp-1">
                    {project.title}
                  </h2>
                  <span className="text-[10px] bg-green-900/20 text-green-500 border border-green-500 px-2 py-0.5 rounded uppercase">
                    {project.status}
                  </span>
                </div>

                <p className="text-zinc-400 text-sm mb-6 flex-grow line-clamp-3">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {project.requirements.map((req: string) => (
                    <span
                      key={req}
                      className="text-[10px] bg-[#272729] text-zinc-400 px-2 py-1 rounded"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
