"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { cn } from "@/lib/utils";
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
  is_admin: boolean; // Matches your updated UserSchema
  preferences?: string[];
  detail?: string;
  [key: string]: any;
}

export default function AuthPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<"user" | "admin" | null>(null);

  const handleGoogleAuth = async (loginType: "user" | "admin") => {
    setError("");
    setLoading(loginType);
    const provider = new GoogleAuthProvider();

    try {
      // 1. Firebase Popup
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken(true); // Force refresh to avoid 401s

      // 2. Send to FastAPI Backend
      const res = await fetch("http://127.0.0.1:8000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      // 3. Logic: If they tried to login as Admin but backend says is_admin is false
      if (loginType === "admin" && !data.is_admin) {
        setError(
          "No, you aren't registered as a club admin, please use the admin email",
        );
        setLoading(null);
        return;
      }

      // 4. Success: Save user data
      localStorage.setItem("user", JSON.stringify(data));

      // 5. Route Redirection
      if (data.is_admin && loginType === "admin") {
        router.push("/main");
      } else if (!data.preferences || data.preferences.length === 0) {
        router.push("/onboarding");
      } else {
        router.push("/main");
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black text-white">
      <div
        className={cn("flex w-full max-w-sm flex-col gap-6", className)}
        {...props}
      >
        <Card className="border-zinc-800 bg-zinc-950 text-zinc-50 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center tracking-tight">
              ClubMonkey
            </CardTitle>
            <CardDescription className="text-zinc-400 text-center">
              Sign in to manage or explore clubs
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-md text-center animate-in fade-in zoom-in duration-300">
                {error}
              </div>
            )}

            <div className="grid gap-4">
              {/* Student Login Button */}
              <Button
                variant="outline"
                className="w-full border-zinc-800 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 h-11"
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

              {/* Decorative Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-zinc-950 px-2 text-zinc-500 font-medium tracking-widest">
                    Authorized Personnel Only
                  </span>
                </div>
              </div>

              {/* Admin Login Button */}
              <Button
                className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200 h-11 font-semibold transition-all duration-200 active:scale-95"
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

            <p className="px-8 text-center text-xs text-zinc-500 leading-relaxed">
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="underline underline-offset-4 hover:text-zinc-300 transition-colors"
              >
                Terms of Service
              </a>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
