"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Grainient from "./Grainient";
import ScrollVelocity from "@/components/ScrollVelocity";

type Star = {
  left: number;
  top: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
  color: string;
};

type ShootingStar = {
  id: number;
  left: number;
  top: number;
  duration: number;
  length: number;
  dx: number;
  dy: number;
  brightness: number;
  angle: number;
  tint: string;
};

type Particle = {
  id: number;
  left: number;
  top: number;
  size: number;
  duration: number;
  opacity: number;
  delay: number;
};

const pseudoRandom = (seed: number) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
};

const STAR_COLORS = ['#93c5fd', '#60a5fa', '#a78bfa', '#f472b6', '#ffffff', '#3b82f6'];
const METEOR_TINTS = ['147, 197, 253', '96, 165, 250', '167, 139, 250', '244, 114, 182'];

const Page = () => {
  const router = useRouter();
  const [shootingStar, setShootingStar] = useState<ShootingStar | null>(null);
  const [isNavigatingToAuth, setIsNavigatingToAuth] = useState(false);
  const tickerSectionRef = useRef<HTMLElement | null>(null);
  const tickerTrackRef = useRef<HTMLDivElement | null>(null);

  const handleAuthNavigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (isNavigatingToAuth) return;

    setIsNavigatingToAuth(true);
    sessionStorage.setItem("cm-auth-transition", "1");

    window.setTimeout(() => {
      router.push("/auth");
    }, 320);
  };

  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 350 }, (_, i) => {
      const base = i + 1;
      return {
        left: pseudoRandom(base * 1.37) * 100,
        top: pseudoRandom(base * 2.11) * 100,
        size: 0.4 + pseudoRandom(base * 3.07) * 2.8,
        opacity: 0.2 + pseudoRandom(base * 4.21) * 0.8,
        delay: pseudoRandom(base * 5.29) * 10,
        duration: 3 + pseudoRandom(base * 6.13) * 6,
        color: STAR_COLORS[Math.floor(pseudoRandom(base * 7.41) * STAR_COLORS.length)],
      };
    });
  }, []);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: pseudoRandom((i + 1) * 8.11) * 100,
      top: pseudoRandom((i + 1) * 9.07) * 100,
      size: 0.5 + pseudoRandom((i + 1) * 10.13) * 2.5,
      duration: 18 + pseudoRandom((i + 1) * 11.19) * 12,
      opacity: 0.08 + pseudoRandom((i + 1) * 12.23) * 0.25,
      delay: pseudoRandom((i + 1) * 13.31) * 5,
    }));
  }, []);

  useEffect(() => {
    let timeoutId: number;

    const spawnShootingStar = () => {
      const now = Date.now();
      const left = 15 + Math.random() * 70;
      const top = 2 + Math.random() * 35;
      const dx = 280 + Math.random() * 360;
      const dy = 120 + Math.random() * 230;
      const duration = 1.2 + Math.random() * 1.4;
      const length = 130 + Math.random() * 130;
      const brightness = 0.7 + Math.random() * 0.3;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const tint = METEOR_TINTS[Math.floor(Math.random() * METEOR_TINTS.length)];

      setShootingStar({
        id: now,
        left,
        top,
        duration,
        length,
        dx,
        dy,
        brightness,
        angle,
        tint,
      });

      const nextDelay = 2000 + Math.random() * 5000;
      timeoutId = window.setTimeout(spawnShootingStar, nextDelay);
    };

    spawnShootingStar();

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!shootingStar) return;

    const timeoutId = window.setTimeout(() => {
      setShootingStar((current) => (current?.id === shootingStar.id ? null : current));
    }, shootingStar.duration * 1000 + 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shootingStar]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = tickerSectionRef.current;
    const track = tickerTrackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 180);

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getDistance() + window.innerHeight * 0.75}`,
            scrub: 1,
            pin: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        },
      );
    }, section);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div className="w-full bg-[#010208] text-white">
      <div
        className={`pointer-events-none fixed inset-0 z-[100] bg-[#010208] transition-opacity duration-300 ${
          isNavigatingToAuth ? "opacity-100" : "opacity-0"
        }`}
      />

      <section ref={tickerSectionRef} className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#020410] via-[#010208] to-[#020410]" />
        <div className="absolute inset-0 opacity-55 mix-blend-screen">
          <Grainient
            className="h-full w-full"
            color1="#050b1d"
            color2="#0c1f4e"
            color3="#220f4a"
            timeSpeed={0.16}
            colorBalance={0}
            warpStrength={0.33}
            warpFrequency={7.2}
            warpSpeed={2.4}
            warpAmplitude={34}
            blendAngle={0}
            blendSoftness={0.16}
            rotationAmount={370}
            noiseScale={1.6}
            grainAmount={0.03}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={0.9}
            saturation={0.85}
            centerX={0}
            centerY={0}
            zoom={0.96}
          />
        </div>

        <div className="absolute inset-0 flex items-center">
          <div ref={tickerTrackRef} className="w-full px-2 md:px-0">
            <ScrollVelocity
              texts={[
                <span className="ticker-line">Club Monkey ~ club ✦ collab ~ and ✺ monke</span>,
                <span className="ticker-line ticker-line-secondary">Scroll Down · Club Monkey · Scroll Down · Club Monkey</span>,
              ]}
              velocity={88}
              damping={58}
              stiffness={360}
              numCopies={7}
              className="velocity-copy"
              parallaxClassName="parallax"
              scrollerClassName="scroller"
            />
          </div>
        </div>
      </section>

      <section className="relative min-h-screen w-full overflow-hidden bg-[#010208]">
        {/* Nebula Background Layers */}
        <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[60%] rounded-full bg-blue-900/25 pointer-events-none z-0 nebula-glow" />
        <div className="absolute bottom-[-5%] right-[-5%] h-[40%] w-[50%] rounded-full bg-indigo-900/20 pointer-events-none z-0 nebula-glow" />
        <div className="absolute bottom-[-20%] left-[20%] h-[60%] w-[70%] rounded-full bg-blue-600/15 pointer-events-none z-0 nebula-glow-deep" />
        <div className="absolute top-[-15%] right-[10%] h-[45%] w-[40%] rounded-full bg-purple-900/15 pointer-events-none z-0 nebula-glow" />

        {/* Starfield Background */}
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#0f0f1e] to-[#010208]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(30,64,175,0.12)_0%,rgba(30,64,175,0)_40%),radial-gradient(circle_at_80%_15%,rgba(59,130,246,0.08)_0%,rgba(59,130,246,0)_45%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_72%,rgba(167,139,250,0.12)_0%,rgba(167,139,250,0)_38%),radial-gradient(circle_at_24%_78%,rgba(96,165,250,0.09)_0%,rgba(96,165,250,0)_40%),radial-gradient(circle_at_74%_44%,rgba(244,114,182,0.08)_0%,rgba(244,114,182,0)_36%)]" />
          <div className="absolute inset-0 opacity-72 mix-blend-screen">
            <Grainient
              className="h-full w-full"
              color1="#060a1a"
              color2="#0a1c45"
              color3="#251048"
              timeSpeed={0.2}
              colorBalance={0}
              warpStrength={0.4}
              warpFrequency={7}
              warpSpeed={2.9}
              warpAmplitude={28}
              blendAngle={0}
              blendSoftness={0.1}
              rotationAmount={420}
              noiseScale={1.6}
              grainAmount={0.04}
              grainScale={2}
              grainAnimated={false}
              contrast={1.82}
              gamma={0.78}
              saturation={0.9}
              centerX={0}
              centerY={0}
              zoom={0.9}
            />
          </div>
          <div className="absolute inset-0 cosmic-vignette" />

          {stars.map((star, index) => (
            <span
              key={index}
              className="star-twinkle absolute rounded-full"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                ["--star-opacity" as string]: star.opacity,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
                backgroundColor: star.color,
                boxShadow: `0 0 ${8 + star.size}px ${star.color}80`,
              }}
            />
          ))}

          {particles.map((particle) => (
            <span
              key={particle.id}
              className="floating-particle absolute rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                opacity: particle.opacity,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`,
                backgroundColor: "#60a5fa",
                boxShadow: "0 0 6px rgba(96, 165, 250, 0.4)",
              }}
            />
          ))}

          {shootingStar && (
            <span
              key={shootingStar.id}
              className="shooting-star absolute"
              style={{
                left: `${shootingStar.left}%`,
                top: `${shootingStar.top}%`,
                width: `${shootingStar.length}px`,
                animationDuration: `${shootingStar.duration}s`,
                ["--dx" as string]: `${shootingStar.dx}px`,
                ["--dy" as string]: `${shootingStar.dy}px`,
                ["--brightness" as string]: shootingStar.brightness,
                ["--angle" as string]: `${shootingStar.angle}deg`,
                ["--meteor-rgb" as string]: shootingStar.tint,
              }}
            />
          )}
        </div>

        <div className="relative z-[10] flex h-screen items-center px-16">
          <div className="flex max-w-2xl flex-col justify-center">
            <h1 className="mb-6 text-[80px] font-light leading-none tracking-[0.1em] text-white">
              Club Monkey
            </h1>

            <div className="mb-8 h-[1.5px] w-32 bg-gradient-to-r from-blue-400/80 to-transparent" />

            <p className="mb-12 text-lg font-light tracking-[0.08em] text-blue-100/90">
              Collab, Create and Monke
            </p>

            <Link
              href="/auth"
              onClick={handleAuthNavigate}
              className="group relative w-fit overflow-hidden px-8 py-3 transition-all duration-300 hover:shadow-lg"
            >
              <div className="absolute inset-0 border border-blue-500/40 transition-all duration-300 group-hover:border-blue-400/80" />
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative text-xs font-medium uppercase tracking-[0.15em] text-blue-100 transition-colors duration-300 group-hover:text-white">
                Login/Signup
              </span>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 z-[15] h-[60vh] w-[45%]">
          <Image
            src="/upscalemedia-transformed.png"
            alt="Club Monkey"
            fill
            sizes="(max-width: 768px) 75vw, 45vw"
            className="object-contain object-bottom-right opacity-95"
            priority
          />
        </div>
      </section>

      <style jsx global>{`
        .star-twinkle {
          animation-name: twinkle;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          box-shadow: 0 0 6px rgba(196, 225, 255, 0.32);
        }

        .floating-particle {
          animation-name: drift;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .shooting-star {
          height: 1.6px;
          border-radius: 999px;
          transform-origin: left center;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(var(--meteor-rgb), calc(0.2 * var(--brightness))) 35%, rgba(248, 252, 255, calc(0.9 * var(--brightness))) 100%);
          filter: drop-shadow(0 0 4px rgba(var(--meteor-rgb), calc(0.65 * var(--brightness)))) drop-shadow(0 0 14px rgba(198, 228, 255, calc(0.3 * var(--brightness))));
          animation-name: shoot;
          animation-timing-function: cubic-bezier(0.22, 0.58, 0.2, 1);
          animation-fill-mode: forwards;
          will-change: transform, opacity;
        }

        .ticker-line {
          font-size: clamp(60px, 9vw, 148px);
          font-weight: 300;
          letter-spacing: 0.04em;
          color: rgba(236, 244, 255, 0.9);
          text-shadow: 0 0 20px rgba(96, 165, 250, 0.2);
        }

        .ticker-line-secondary {
          font-size: clamp(54px, 8.2vw, 134px);
          color: rgba(174, 206, 255, 0.86);
        }

        .cosmic-vignette {
          background: radial-gradient(circle at center, rgba(1, 2, 8, 0) 38%, rgba(1, 2, 8, 0.3) 80%, rgba(1, 2, 8, 0.58) 100%);
        }

        .shooting-star::after {
          content: "";
          position: absolute;
          top: 50%;
          right: -1px;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          transform: translate(45%, -50%);
          background: rgba(252, 253, 255, calc(0.95 * var(--brightness)));
          box-shadow: 0 0 16px rgba(var(--meteor-rgb), calc(0.8 * var(--brightness)));
        }

        .shooting-star::before {
          content: "";
          position: absolute;
          inset: -1px 0 -1px 12%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(var(--meteor-rgb), 0), rgba(var(--meteor-rgb), calc(0.24 * var(--brightness))) 45%, rgba(255, 255, 255, calc(0.5 * var(--brightness))) 100%);
          filter: blur(1.5px);
        }

        .nebula-glow {
          filter: blur(80px);
          mix-blend-mode: screen;
          opacity: 0.4;
        }

        .nebula-glow-deep {
          filter: blur(120px);
          mix-blend-mode: screen;
          opacity: 0.25;
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: calc(var(--star-opacity) * 0.45);
            transform: scale(0.95);
          }
          35% {
            opacity: calc(var(--star-opacity) * 0.72);
            transform: scale(1.02);
          }
          50% {
            opacity: var(--star-opacity);
            transform: scale(1.15);
          }
          72% {
            opacity: calc(var(--star-opacity) * 0.62);
            transform: scale(0.98);
          }
        }

        @keyframes drift {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: var(--opacity);
          }
          90% {
            opacity: var(--opacity);
          }
          100% {
            transform: translate(100px, 150px) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes shoot {
          0% {
            opacity: 0;
            transform: translate3d(0, 0, 0) rotate(var(--angle)) scaleX(0.65);
          }
          10% {
            opacity: calc(0.62 * var(--brightness));
            transform: translate3d(calc(0.08 * var(--dx)), calc(0.08 * var(--dy)), 0) rotate(var(--angle)) scaleX(0.9);
          }
          32% {
            opacity: var(--brightness);
            transform: translate3d(calc(0.34 * var(--dx)), calc(0.34 * var(--dy)), 0) rotate(var(--angle)) scaleX(1.04);
          }
          68% {
            opacity: var(--brightness);
            transform: translate3d(calc(0.72 * var(--dx)), calc(0.72 * var(--dy)), 0) rotate(var(--angle)) scaleX(1.01);
          }
          88% {
            opacity: calc(0.5 * var(--brightness));
            transform: translate3d(calc(0.9 * var(--dx)), calc(0.9 * var(--dy)), 0) rotate(var(--angle)) scaleX(0.96);
          }
          100% {
            opacity: 0;
            transform: translate3d(var(--dx), var(--dy), 0) rotate(var(--angle)) scaleX(0.85);
          }
        }

        @media (max-width: 768px) {
          .shooting-star {
            height: 1.5px;
          }
        }
      `}</style>
    </div>
  );
};

export default Page;
