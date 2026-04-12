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

  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 140 }, (_, i) => {
      const base = i + 1;
      return {
        left: pseudoRandom(base * 1.91) * 100,
        top: pseudoRandom(base * 2.83) * 100,
        size: 0.5 + pseudoRandom(base * 3.37) * 2,
        opacity: 0.2 + pseudoRandom(base * 4.21) * 0.65,
        delay: pseudoRandom(base * 5.29) * 6,
        duration: 2.8 + pseudoRandom(base * 6.13) * 4,
        color: STAR_COLORS[Math.floor(pseudoRandom(base * 7.03) * STAR_COLORS.length)],
      };
    });
  }, []);

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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0f0f1e] to-[#010208]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(30,64,175,0.12)_0%,rgba(30,64,175,0)_40%),radial-gradient(circle_at_80%_15%,rgba(59,130,246,0.08)_0%,rgba(59,130,246,0)_45%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_72%,rgba(167,139,250,0.12)_0%,rgba(167,139,250,0)_38%),radial-gradient(circle_at_24%_78%,rgba(96,165,250,0.09)_0%,rgba(96,165,250,0)_40%)]" />

        <div className="absolute inset-0 opacity-45">
          <Aurora
            colorStops={["#8080ff", "#000080", "#ff0000"]}
            blend={0.5}
            amplitude={1.0}
            speed={1}
          />
        </div>

        <div className="absolute inset-0 opacity-82">
          <PixelBlast
            variant="square"
            pixelSize={4}
            color="#B19EEF"
            patternScale={2}
            patternDensity={1}
            pixelSizeJitter={0}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid={false}
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.5}
            edgeFade={0.25}
            transparent
          />
        </div>

        <div className="absolute inset-0 opacity-60 mix-blend-screen">
          <Grainient
            className="h-full w-full"
            color1="#060a1a"
            color2="#0a1c45"
            color3="#251048"
            timeSpeed={0.16}
            colorBalance={0}
            warpStrength={0.34}
            warpFrequency={7.1}
            warpSpeed={2.4}
            warpAmplitude={32}
            blendAngle={0}
            blendSoftness={0.14}
            rotationAmount={360}
            noiseScale={1.5}
            grainAmount={0.03}
            grainScale={2}
            grainAnimated={false}
            contrast={1.45}
            gamma={0.9}
            saturation={0.86}
            centerX={0}
            centerY={0}
            zoom={0.95}
          />
        </div>

        {stars.map((star, index) => (
          <span
            key={index}
            className="auth-star absolute rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
              backgroundColor: star.color,
              boxShadow: `0 0 ${7 + star.size}px ${star.color}66`,
            }}
          />
        ))}

        <div className="absolute inset-0 auth-vignette" />
      </div>

      <div
        className={cn(
          "relative z-10 flex w-full max-w-sm flex-col gap-6 auth-card-enter",
          className,
        )}
        {...props}
      >
        <Card className="border border-blue-500/20 bg-[#050811]/85 text-zinc-50 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md">
          <CardHeader className="space-y-1">
            <div className="mb-3 flex justify-center">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-cyan-300/35 shadow-[0_0_22px_rgba(96,165,250,0.35)]">
                <Image
                  src="/monkey-logo.jpeg"
                  alt="Club Monkey logo"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
            </div>

            <CardTitle className="text-center text-3xl font-bold tracking-tight text-white">
              ClubMonkey
            </CardTitle>
            <CardDescription className="text-center text-blue-100/70">
              Sign in to manage or explore clubs
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4">
            {error && (
              <div className="rounded-md border border-red-400/50 bg-red-500/10 p-3 text-center text-xs text-red-300 animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              <Button
                variant="outline"
                className="h-11 w-full border-blue-400/20 bg-[#0b1120]/85 text-blue-50 hover:bg-[#131c33]"
                onClick={() => handleGoogleAuth("user")}
                disabled={loading !== null}
              >
                {loading === "user" ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-blue-500/20" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#050811] px-2 font-medium tracking-widest text-blue-200/40">
                    Authorized Personnel Only
                  </span>
                </div>
              </div>

              <Button
                className="h-11 w-full bg-blue-50 text-[#0b1120] font-semibold transition-all duration-200 hover:bg-blue-100 active:scale-95"
                onClick={() => handleGoogleAuth("admin")}
                disabled={loading !== null}
              >
                {loading === "admin" ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
                    Verifying...
                  </span>
                ) : (
                  "Login as Club Admin"
                )}
              </Button>
            </div>

            <p className="px-8 text-center text-xs leading-relaxed text-blue-100/45">
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="underline underline-offset-4 transition-colors hover:text-blue-100/80"
              >
                Terms of Service
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
