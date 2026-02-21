import React from "react";
import Link from "next/link";
const page = () => {
  return (
    <div className="min-h-screen bg-[#121212] flex flex-col justify-center items-center gap-4">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">ClubMonkey</h1>
        <p className="text-zinc-400">Connect. Collaborate. Create.</p>
      </div>
      <Link
        href="/auth"
        className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all"
      >
        Get Started
      </Link>
    </div>
  );
};

export default page;
