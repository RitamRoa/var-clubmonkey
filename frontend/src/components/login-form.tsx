"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { cn } from "@/lib/utils";
import Grainient from "@/app/Grainient";
import PixelBlast from "@/components/PixelBlast";
import Aurora from "@/components/Aurora";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";

interface AuthResponse {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  preferences?: string[];
  detail?: string;
  [key: string]: unknown;
}

type Star = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
  color: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

const STAR_COLORS = ["#93c5fd", "#60a5fa", "#a78bfa", "#ffffff"];

const pseudoRandom = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
};

export default function AuthPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<"user" | "admin" | null>(null);
  const [showTransitionOverlay, setShowTransitionOverlay] = useState(false);

  const stars = useMemo<Star[]>(() => [], []);

  useEffect(() => {
    if (sessionStorage.getItem("cm-auth-transition") === "1") {
      setShowTransitionOverlay(true);
      sessionStorage.removeItem("cm-auth-transition");
    }
  }, []);

  useEffect(() => {
    if (!showTransitionOverlay) return;

      const timeoutId = window.setTimeout(() => {
        setShowTransitionOverlay(false);
      }, 420);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showTransitionOverlay]);

  const handleGoogleAuth = async (loginType: "user" | "admin") => {
    setError("");
    setLoading(loginType);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true);

      const res = await fetch(`${API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (loginType === "admin" && !data.is_admin) {
        setError(
          "No, you aren't registered as a club admin, please use the admin email",
        );
        setLoading(null);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));

      if (data.is_admin && loginType === "admin") {
        router.push("/main");
      } else if (!data.preferences || data.preferences.length === 0) {
        router.push("/onboarding");
      } else {
        router.push("/main");
      }
    } catch (err: unknown) {
      console.error("Auth Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#010208] p-6 text-white md:p-10">
      <div
        className={`pointer-events-none absolute inset-0 z-[60] bg-[#010208] transition-opacity duration-500 ${
          showTransitionOverlay ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020410] via-[#010208] to-[#010208]" />
        
        {/* Enhanced Aurora (Re-added and popped with colors) */}
        <div className="absolute inset-0 opacity-70 mix-blend-screen overflow-hidden">
          <Aurora
            colorStops={["#3b82f6", "#8b5cf6", "#ec4899"]} // Vibrant Blue, Purple, Pink
            blend={0.6}
            amplitude={1.2}
            speed={1.2}
          />
        </div>

        {/* Simplified Background Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(30,64,175,0.12)_0%,rgba(30,64,175,0)_50%),radial-gradient(circle_at_80%_15%,rgba(59,130,246,0.08)_0%,rgba(59,130,246,0)_50%)]" />

        {/* Stars removed for Aurora to pop */}

        <div className="absolute inset-0 auth-vignette" />
      </div>

      <div
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col gap-6",
          className,
        )}
        {...props}
      >
        <Card className="border border-white/5 bg-black/40 text-zinc-50 backdrop-blur-sm transition-all duration-300">
          <CardHeader className="space-y-1">
            <div className="mb-3 flex justify-center">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 shadow-lg">
                <Image
                  src="/monkey-logo.jpeg"
                  alt="Club Monkey logo"
                  fill
                  priority
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            </div>

            <CardTitle className="text-center text-2xl font-semibold tracking-tight text-white">
              ClubMonkey
            </CardTitle>
            <CardDescription className="text-center text-zinc-400">
              Sign in to manage or explore clubs
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {error && (
              <div className="rounded-md border border-red-400/20 bg-red-500/5 p-3 text-center text-[11px] text-red-400/90">
                {error}
              </div>
            )}

            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-12 w-full border-white/5 bg-white/5 text-zinc-100 transition-all hover:bg-white/10 active:scale-[0.98]"
                onClick={() => handleGoogleAuth("user")}
                disabled={loading !== null}
              >
                {loading === "user" ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 font-medium">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Login as Student
                  </span>
                )}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/5" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
                  <span className="bg-transparent px-2 text-zinc-600">
                    Personnel Only
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                className="h-11 w-full border border-white/5 bg-transparent text-zinc-400 transition-all hover:bg-white/5 hover:text-white active:scale-[0.98]"
                onClick={() => handleGoogleAuth("admin")}
                disabled={loading !== null}
              >
                {loading === "admin" ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Verifying...
                  </span>
                ) : (
                  "Login as Club Admin"
                )}
              </Button>
            </div>

            <p className="px-8 text-center text-[10px] uppercase tracking-wide text-zinc-600">
              By continuing, you agree to our{" "}
              <a href="#" className="underline underline-offset-4 hover:text-zinc-400">
                Terms
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .auth-card-enter {
          animation: authCardIn 680ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }

        .auth-star {
          animation: authTwinkle ease-in-out infinite;
        }

        .auth-vignette {
          background: radial-gradient(circle at center, rgba(1, 2, 8, 0) 42%, rgba(1, 2, 8, 0.28) 80%, rgba(1, 2, 8, 0.54) 100%);
        }

        @keyframes authCardIn {
          0% {
            opacity: 0;
            transform: translateY(12px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes authTwinkle {
          0%,
          100% {
            opacity: 0.35;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
      `}</style>
    </div>
  );
}
