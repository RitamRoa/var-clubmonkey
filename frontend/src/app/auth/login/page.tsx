"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Login failed");
        setLoading(false);
        return;
      }

      // Store user session info
      localStorage.setItem("user", JSON.stringify(data));
      console.log("Login successful, redirecting to /main...");
      router.push("/main");
    } catch (err) {
      setError("Server is offline. Check your FastAPI terminal.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 w-full max-w-md shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center font-bold text-2xl text-white">
            M
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2 text-center">
          Welcome Back
        </h1>
        <p className="text-zinc-400 text-center mb-8 text-sm">
          Enter credentials to access the hub
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 ml-1">Email</label>
            <input
              type="email"
              placeholder="name@university.edu"
              className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-red-500 transition-all"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-red-500 transition-all"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 mt-4 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition-all ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800"></span>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">
              New to the hub?
            </span>
          </div>
        </div>

        <Link href="/auth/signup">
          <button className="w-full p-3 rounded border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-all">
            Create New Account
          </button>
        </Link>
      </div>
    </main>
  );
}
