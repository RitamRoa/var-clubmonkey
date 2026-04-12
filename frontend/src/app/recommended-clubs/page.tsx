"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TiltedCard from "@/components/TiltedCard";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function RecommendedClubs() {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
      router.push("/auth");
      return;
    }

    fetch(`${API_BASE_URL}/clubs/recommended/${user.id}`)
      .then((res) => res.json())
      .then((data: Club[]) => {
        setClubs(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load recommendations right now.");
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div className="p-10 text-white">Finding matches...</div>;
  if (error) return <div className="p-10 text-red-300">{error}</div>;

  return (
    <main className="min-h-screen bg-[#04060d] p-8 text-white md:p-10">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Clubs For You</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
        {clubs.map((club) => (
          <div key={club.id} className="space-y-3">
            <TiltedCard
              imageSrc={getClubVisual(club)}
              altText={`${club.name} card`}
              captionText={club.name}
              captionStyle={getTooltipPillStyle(club)}
              containerHeight="330px"
              containerWidth="100%"
              imageHeight="330px"
              imageWidth="100%"
              rotateAmplitude={12}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip
              displayOverlayContent
              overlayContent={
                <p className="tilted-card-demo-text" style={getTitlePillStyle(club)}>
                  {club.name}
                </p>
              }
            />

            <div className="space-y-3 px-1">
              <p className="text-sm text-zinc-300/85">
                {club.description || "A great community to build and learn with."}
              </p>
              <div className="flex flex-wrap gap-2">
                {club.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-zinc-800/80 px-2 py-1 text-[10px] uppercase tracking-wide text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 flex items-center justify-center">
        <Link
          href="/main"
          className="rounded-full border border-zinc-400/35 bg-white/8 px-6 py-2.5 text-sm font-semibold text-zinc-100 transition-colors hover:bg-white/14"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}

interface Club {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  tags: string[];
}

function getClubVisual(club: Club): string {
  const p = normalizeColor(club.primary_color, "#1d3557");
  const a = normalizeColor(club.accent_color, "#e11d48");
  const text = getFirstTwoWords(club.name || "Club").slice(0, 24);

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='900' viewBox='0 0 1200 900'>
    <defs>
      <linearGradient id='line' x1='0' y1='0' x2='1' y2='0'>
        <stop offset='0%' stop-color='${p}'/>
        <stop offset='100%' stop-color='${a}'/>
      </linearGradient>
    </defs>
    <rect width='1200' height='900' fill='#020308'/>
    <rect x='120' y='755' width='960' height='6' rx='3' fill='url(#line)' opacity='0.9'/>
    <text x='600' y='468' text-anchor='middle' fill='rgba(244,246,255,0.98)' font-size='118' font-family='Arial, sans-serif' font-weight='800' letter-spacing='1.2'>${escapeXml(text)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getFirstTwoWords(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).join(" ") || name;
}

function normalizeColor(value: string | undefined, fallback: string): string {
  if (!value || !value.trim()) return fallback;
  return value;
}

function getTitlePillStyle(club: Club): React.CSSProperties {
  const primary = normalizeColor(club.primary_color, "#1d3557");
  const accent = normalizeColor(club.accent_color, "#e11d48");

  return {
    background: `linear-gradient(180deg, rgba(7,10,18,0.24), rgba(7,10,18,0.24)), linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
    borderColor: "rgba(255,255,255,0.24)",
    color: "#f8fafc",
    textShadow: "0 1px 10px rgba(0,0,0,0.35)",
  };
}

function getTooltipPillStyle(club: Club): React.CSSProperties {
  const primary = normalizeColor(club.primary_color, "#1d3557");
  const accent = normalizeColor(club.accent_color, "#e11d48");

  return {
    background: `linear-gradient(180deg, rgba(7,10,18,0.2), rgba(7,10,18,0.2)), linear-gradient(90deg, ${primary} 0%, ${accent} 100%)`,
    borderColor: "rgba(255,255,255,0.28)",
    color: "#f8fafc",
    textShadow: "0 1px 8px rgba(0,0,0,0.4)",
  };
}

function escapeXml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
