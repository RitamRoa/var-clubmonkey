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
import { Input } from "./input";
import { Label } from "./label";

interface AuthResponse {
  detail?: string;
  preferences?: string[];
  [key: string]: any;
}

export default function AuthPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("http://127.0.0.1:8000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken }),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      localStorage.setItem("user", JSON.stringify(data));

      if (!data.preferences || data.preferences.length === 0) {
        router.push("/onboarding");
      } else {
        router.push("/main");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to authenticate with Google";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-black">
      <div
        className={cn("flex w-full max-w-sm flex-col gap-6", className)}
        {...props}
      >
        <Card className="border-zinc-800 bg-zinc-950 text-zinc-50">
          <CardHeader>
            <CardTitle className="text-2xl">Login to your account</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    className="bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-700"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-zinc-300">
                      Password
                    </Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-zinc-400"
                    >
                      Forgot your password??
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-zinc-700"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-zinc-800 bg-transparent text-zinc-50 hover:bg-zinc-900 hover:text-zinc-50"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                >
                  {loading ? "Connecting..." : "Login with Google"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm text-zinc-400">
                Don&apos;t have an account?{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 text-zinc-300 hover:text-white"
                >
                  Sign up
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
