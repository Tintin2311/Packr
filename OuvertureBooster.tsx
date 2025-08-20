// Dating Cards — React + TypeScript + Tailwind + Framer Motion
// -----------------------------------------------------------
// What you get:
// - <ProfileCard />: reusable component with rarity styles (bronze, argent, or, diamant, legend)
// - Flip + glow + sparkle reveal animation for first mount / when `revealKey` changes
// - <BoosterRevealDemo />: simple demo showing a 5-card booster and a reveal button
//
// Requirements:
// - Tailwind CSS (https://tailwindcss.com/docs/guides/vite or Next.js setup)
// - Framer Motion: `npm i framer-motion`
//
// Tips:
// - Replace placeholder images with your user photos
// - You can control when the reveal animation plays by changing the `revealKey` prop
// - Rarity keys: "bronze" | "argent" | "or" | "diamant" | "legend"

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Types ----------
export type Rarity = "bronze" | "argent" | "or" | "diamant" | "legend";

export type Profile = {
  name: string;
  age: number;
  element: "Feu" | "Eau" | "Électricité" | "Plante" | "Glace" | "Pierre" | "Sol" | "Ténèbres" | "Lumière" | string;
  rarity: Rarity;
  photoUrl: string;
};

// ---------- Rarity style map ----------
const rarityMap: Record<
  Rarity,
  {
    label: string;
    border: string; // CSS gradient for the outer border
    bg: string; // inner card background gradient
    glow: string; // box-shadow string
    accent: string; // small emoji/accent
  }
> = {
  bronze: {
    label: "BRONZE",
    border: "linear-gradient(135deg,#7c4a1f,#b0793a,#7c4a1f)",
    bg: "linear-gradient(180deg,#1a1410,#14110d)",
    glow: "0 0 0 1px rgba(176,121,58,.35), 0 10px 40px rgba(176,121,58,.25)",
    accent: "🟤",
  },
  argent: {
    label: "ARGENT",
    border: "linear-gradient(135deg,#9aa4b2,#e4ecf7,#b5c2d1)",
    bg: "linear-gradient(180deg,#111318,#0e1014)",
    glow: "0 0 0 1px rgba(204,220,236,.45), 0 10px 50px rgba(180,200,225,.35)",
    accent: "⚪",
  },
  or: {
    label: "OR",
    border: "linear-gradient(135deg,#f6c76f,#ffe9a4,#f0b33a)",
    bg: "linear-gradient(180deg,#161108,#0f0b05)",
    glow: "0 0 0 1px rgba(255,216,109,.45), 0 12px 60px rgba(255,208,80,.45)",
    accent: "🟡",
  },
  diamant: {
    label: "DIAMANT",
    border: "conic-gradient(from 0deg, #a8e4ff, #e6fbff, #9ad1ff, #bff3ff, #a8e4ff)",
    bg: "radial-gradient(120% 120% at 30% 20%, #0a1a27, #071018 60%, #050a10)",
    glow: "0 0 0 1px rgba(168,228,255,.6), 0 15px 80px rgba(120,210,255,.55)",
    accent: "💎",
  },
  legend: {
    label: "LÉGENDAIRE",
    border: "linear-gradient(135deg,#ff1f3a,#ff7648,#ff1f3a)",
    bg: "radial-gradient(100% 120% at 50% 20%, #200, #120004 60%, #0b0003)",
    glow: "0 0 0 1px rgba(255,60,90,.55), 0 18px 100px rgba(255,40,60,.6)",
    accent: "🔴",
  },
};

// ---------- Utility: elemental emoji ----------
const elementEmoji = (el: string) => {
  const map: Record<string, string> = {
    Feu: "🔥",
    Eau: "💧",
    Électricité: "⚡",
    Plante: "🌿",
    Glace: "❄️",
    Pierre: "🪨",
    Sol: "🌋",
    Ténèbres: "🌑",
    Lumière: "✨",
  };
  return map[el] ?? "⭐";
};

// ---------- Sparkles (for Diamant & Legend) ----------
const Sparkles: React.FC<{ count?: number; color?: string }> = ({ count = 18, color = "rgba(255,255,255,.9)" }) => {
  const arr = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {arr.map((i) => {
        const delay = Math.random() * 2;
        const duration = 1.6 + Math.random() * 1.2;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const size = 2 + Math.random() * 3;
        return (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
            transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
            style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, backgroundColor: color }}
            className="absolute rounded-full shadow-[0_0_12px_rgba(255,255,255,.7)]"
          />
        );
      })}
    </div>
  );
};

// ---------- Shine overlay ----------
const Shine: React.FC = () => (
  <motion.div
    className="pointer-events-none absolute inset-0"
    initial={{ x: "-140%" }}
    animate={{ x: ["-140%", "140%"] }}
    transition={{ duration: 1.1, ease: "easeInOut" }}
    style={{
      background:
        "linear-gradient(70deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.38) 50%, rgba(255,255,255,0) 65%)",
      mixBlendMode: "screen",
    }}
  />
);

// ---------- Card component ----------
export const ProfileCard: React.FC<{
  profile: Profile;
  revealKey?: string | number; // change to replay animation
  className?: string;
}> = ({ profile, revealKey, className }) => {
  const style = rarityMap[profile.rarity];

  // trigger a re-animation when revealKey changes
  const [localKey, setLocalKey] = useState(0);
  useEffect(() => {
    setLocalKey((k) => k + 1);
  }, [revealKey]);

  const isFancy = profile.rarity === "diamant" || profile.rarity === "legend";

  return (
    <div className={"[perspective:1100px] " + (className ?? "")}> {/* 3D perspective for flip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={localKey}
          initial={{ rotateY: 90, opacity: 0, scale: 0.88 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          exit={{ rotateY: -90, opacity: 0, scale: 0.88 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="relative w-[280px] h-[400px] select-none"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Border gradient */}
          <div
            className="absolute inset-0 rounded-2xl p-[3px]"
            style={{ background: style.border, filter: "saturate(1.15)" }}
          >
            {/* Inner card */}
            <div
              className="relative h-full w-full rounded-[14px] overflow-hidden"
              style={{ background: style.bg, boxShadow: style.glow }}
            >
              {/* Optional sparkles for fancy rarities */}
              {isFancy && <Sparkles count={22} color={profile.rarity === "legend" ? "rgba(255,80,100,.95)" : "rgba(200,245,255,.95)"} />}

              {/* Top strip with rarity */}
              <div className="absolute left-3 right-3 top-3 flex items-center gap-2">
                <div className="rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide text-black/90" style={{
                  background: style.border,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.25)",
                }}>
                  {style.label}
                </div>
                <div className="ml-auto text-white/70 text-xs">{style.accent} {profile.element} {elementEmoji(profile.element)}</div>
              </div>

              {/* Photo */}
              <div className="absolute inset-x-3 top-8 bottom-64 rounded-xl overflow-hidden">
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
                {/* Subtle vignette */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/40" />
              </div>

              {/* Name + age */}
              <div className="absolute inset-x-3 bottom-16">
                <div className="text-white font-semibold text-[22px] leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]">
                  {profile.name}, {profile.age}
                </div>
              </div>

              {/* Footer */}
              <div className="absolute inset-x-0 bottom-0">
                <div className="mx-3 mb-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-[2px]">
                  <div className="text-[12px] text-white/80">{elementEmoji(profile.element)} {profile.element}</div>
                  <div className="text-[11px] text-white/55">Statut: {style.label}</div>
                </div>
              </div>

              {/* Shine on reveal */}
              <Shine />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ---------- Booster demo ----------
export default function BoosterRevealDemo() {
  const [revealSeed, setRevealSeed] = useState(0);

  const cards: Profile[] = [
    { name: "Lina", age: 24, element: "Eau", rarity: "bronze", photoUrl: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=800&auto=format&fit=crop" },
    { name: "Maya", age: 27, element: "Plante", rarity: "argent", photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop" },
    { name: "Noa", age: 26, element: "Feu", rarity: "or", photoUrl: "https://images.unsplash.com/photo-1549351512-c5e12b12c6b5?q=80&w=800&auto=format&fit=crop" },
    { name: "Ava", age: 25, element: "Lumière", rarity: "diamant", photoUrl: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=800&auto=format&fit=crop" },
    { name: "Rox", age: 29, element: "Ténèbres", rarity: "legend", photoUrl: "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=800&auto=format&fit=crop" },
  ];

  // simple staggered reveal using setTimeout chain via a local array of booleans
  const [revealed, setRevealed] = useState<number>(0);
  useEffect(() => {
    setRevealed(0);
    const total = cards.length;
    const timers: number[] = [];
    for (let i = 0; i < total; i++) {
      timers.push(window.setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), 250 + i * 220));
    }
    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealSeed]);

  return (
    <div className="min-h-[100svh] w-full bg-[#0a0f14] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Ouverture du booster</h1>
          <button
            onClick={() => setRevealSeed((s) => s + 1)}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15 active:scale-[.98]"
          >
            Ouvrir un nouveau booster
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 place-items-center">
          {cards.map((p, i) => (
            <div key={i} className="h-[420px]">
              <AnimatePresence>
                {revealed > i ? (
                  <ProfileCard profile={p} revealKey={`${revealSeed}-${i}`} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative w-[280px] h-[400px] rounded-2xl bg-white/5 border border-white/10"
                  >
                    {/* card back */}
                    <div className="absolute inset-0 rounded-2xl p-[3px]" style={{ background: "linear-gradient(135deg,#2a3340,#1b222c,#2a3340)" }}>
                      <div className="relative h-full w-full rounded-[14px] bg-[#0e141b] flex items-center justify-center overflow-hidden">
                        <div className="text-white/35 tracking-[0.2em] text-sm">BOOSTER</div>
                        <Shine />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <p className="mt-6 text-white/60 text-sm">
          Astuce: changez <code>revealKey</code> pour rejouer l'animation d'apparition, ou montez/démontez le composant.
        </p>
      </div>

      {/* Extra styles (optional) */}
      <style>{`
        /* Smooth fonts */
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  );
}
