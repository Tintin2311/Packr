// Accueil connecté — Mobile-first + Progression & Objectifs + Likes (coeur)
// React + TS + Tailwind + Framer Motion + lucide-react
// Fichier complet prêt à exécuter — toutes les dépendances locales supprimées

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Grid3x3,
  MessageSquare,
  Settings,
  Trophy,
  Flag,
  Heart,
  Gift,
  ShoppingBag,
} from "lucide-react";

// ---------- Utils ----------
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
    Vent: "🌪️",
  };
  return map[el] ?? "⭐";
};

// ---------- BoosterCard (fermé) ----------
const BoosterCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: string;
  gradient: string; // ex: "linear-gradient(135deg,#0b1a2a,#121b2b)"
  disabled?: boolean;
  onClick?: () => void;
}> = ({ title, subtitle, icon, gradient, disabled, onClick }) => (
  <motion.button
    whileTap={!disabled ? { scale: 0.98 } : {}}
    onClick={!disabled ? onClick : undefined}
    className={`relative w-full rounded-2xl border border-white/10 p-4 text-left overflow-hidden ${
      disabled ? "opacity-40 cursor-not-allowed" : "active:opacity-90"
    }`}
    style={{ background: gradient }}
  >
    <div className="flex items-center gap-3">
      <div className="text-3xl leading-none select-none">{icon}</div>
      <div className="min-w-0">
        <div className="text-base font-semibold tracking-tight truncate">{title}</div>
        {subtitle && (
          <div className="text-xs text-white/70 truncate">{subtitle}</div>
        )}
      </div>
      {!disabled && <div className="ml-auto text-white/60 text-xl">›</div>}
    </div>
  </motion.button>
);

// ---------- ElementsSheet ----------
const ElementsSheet: React.FC<{
  onPick: (el: string) => void;
  onClose: () => void;
}> = ({ onPick, onClose }) => {
  const elements = [
    "Feu",
    "Eau",
    "Électricité",
    "Plante",
    "Glace",
    "Pierre",
    "Sol",
    "Ténèbres",
    "Lumière",
    "Vent",
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/60 flex items-end"
    >
      <motion.div
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 56, opacity: 0 }}
        className="w-full rounded-t-2xl border border-white/10 bg-[#0d141c] p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Choisis un élément</div>
          <button onClick={onClose} className="text-white/70 text-xl leading-none">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {elements.map((el) => (
            <motion.button
              key={el}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPick(el)}
              className="rounded-xl border border-white/10 bg-white/5 p-3 text-left"
            >
              <div className="text-base font-semibold">
                {elementEmoji(el)} {el}
              </div>
              <div className="text-xs text-white/70">5 cartes · même élément</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------- ObjectivesSheet ----------
const ObjectivesSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const missions = [
    { title: "Compléter ta bio", desc: "+1 booster aujourd'hui", icon: "📝" },
    { title: "Envoyer 1 premier message", desc: "Débloque Mini-jeu: Brise-glace", icon: "💬" },
    { title: "Inviter un ami", desc: "+1 booster cette semaine", icon: "👥" },
    { title: "Scanner un code soirée", desc: "Accès boosters Événement", icon: "🎟️" },
    { title: "Like 10 profils", desc: "Récompense partenaire: -1€ boisson", icon: "🍹" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/60 flex items-end"
    >
      <motion.div
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 56, opacity: 0 }}
        className="w-full rounded-t-2xl border border-white/10 bg-[#0d141c] p-5 pb-[calc(20px+env(safe-area-inset-bottom))]"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold flex items-center gap-2">
            <Flag className="h-5 w-5" /> Objectifs
          </div>
          <button onClick={onClose} className="text-white/70 text-xl leading-none">
            ✕
          </button>
        </div>
        <div className="space-y-3">
          {missions.map((m) => (
            <div
              key={m.title}
              className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3"
            >
              <div className="text-2xl select-none">{m.icon}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{m.title}</div>
                <div className="text-xs text-white/70 truncate">{m.desc}</div>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-xs"
              >
                Voir
              </motion.button>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------- Likes (cartes stylées) ----------
const LikeProfileCard: React.FC<{
  name: string;
  element: string;
  photo: string;
  status: "pending" | "validated" | "gifted" | "refused";
  onValidate: () => void;
  onRefuse: () => void;
  onGift: () => void;
  disableActions?: boolean;
}> = ({ name, element, photo, status, onValidate, onRefuse, onGift, disableActions }) => {
  const disabled = disableActions || status !== "pending";
  return (
    <motion.div
      initial={{ rotateY: 60, opacity: 0, scale: 0.96 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 16 }}
      className="relative w-full"
    >
      <div
        className="rounded-2xl p-[3px]"
        style={{
          background:
            "conic-gradient(from 0deg, #4dd0ff, #f0f9ff, #8ec5ff, #c3f1ff, #4dd0ff)",
        }}
      >
        <div
          className="relative rounded-[14px] overflow-hidden"
          style={{
            background:
              "radial-gradient(120% 120% at 30% 20%, #0a1a27, #071018 60%, #050a10)",
            boxShadow:
              "0 0 0 1px rgba(168,228,255,.6), 0 15px 80px rgba(120,210,255,.45)",
          }}
        >
          <button
            onClick={onGift}
            disabled={disabled}
            className={`absolute right-3 top-3 z-10 inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${
              disabled
                ? "bg-white/10 text-white/50 cursor-not-allowed"
                : "bg-rose-500 text-white"
            }`}
          >
            <Gift className="h-3.5 w-3.5 mr-1" /> Offrir
          </button>
          <div className="h-[300px] w-full">
            <img src={photo} alt={name} className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/0 via-black/0 to-black/50" />
          <div className="absolute left-4 right-4 bottom-20">
            <div className="text-white font-semibold text-[22px] drop-shadow">
              {name}
            </div>
            <div className="text-white/80 text-sm">
              {elementEmoji(element)} {element}
            </div>
          </div>
          {status !== "pending" && (
            <div className="absolute left-3 top-3 rounded-md bg-white/10 border border-white/15 px-2 py-1 text-[11px] text-white/80 backdrop-blur">
              {status === "validated"
                ? "Match validé"
                : status === "gifted"
                ? "Carte offerte"
                : "Refusé"}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRefuse}
          disabled={disabled}
          className={`flex h-11 w-11 items-center justify-center rounded-full border ${
            disabled
              ? "border-white/10 text-white/40"
              : "border-red-400/60 text-red-400"
          }`}
          aria-label="Refuser"
        >
          ✖️
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onValidate}
          disabled={disabled}
          className={`flex h-11 w-11 items-center justify-center rounded-full border ${
            disabled
              ? "border-white/10 text-white/40"
              : "border-emerald-400/60 text-emerald-400"
          }`}
          aria-label="Valider"
        >
          ✔️
        </motion.button>
      </div>
    </motion.div>
  );
};

const LikesSheet: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [weeklyGiftsLeft, setWeeklyGiftsLeft] = useState(1);
  const [people, setPeople] = useState([
    {
      id: 1,
      name: "Lina, 24",
      element: "Eau",
      photo:
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=800&auto=format&fit=crop",
      status: "pending" as const,
    },
    {
      id: 2,
      name: "Noa, 26",
      element: "Feu",
      photo:
        "https://images.unsplash.com/photo-1549351512-c5e12b12c6b5?q=80&w=800&auto=format&fit=crop",
      status: "pending" as const,
    },
    {
      id: 3,
      name: "Maya, 27",
      element: "Plante",
      photo:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
      status: "pending" as const,
    },
  ]);

  const validateMatch = (id: number) =>
    setPeople((arr) =>
      arr.map((p) => (p.id === id ? { ...p, status: "validated" as const } : p))
    );
  const refuseMatch = (id: number) =>
    setPeople((arr) =>
      arr.map((p) => (p.id === id ? { ...p, status: "refused" as const } : p))
    );
  const giftCard = (id: number) => {
    if (weeklyGiftsLeft <= 0) return;
    setWeeklyGiftsLeft((n) => n - 1);
    setPeople((arr) =>
      arr.map((p) => (p.id === id ? { ...p, status: "gifted" as const } : p))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/60 flex items-end"
    >
      <motion.div
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 56, opacity: 0 }}
        className="w-full rounded-t-2xl border border-white/10 bg-[#0d141c] p-4 pb-[calc(20px+env(safe-area-inset-bottom))]"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-base font-semibold flex items-center gap-2">
            <Heart className="h-5 w-5" /> Ils ont choisi ta carte
          </div>
          <button
            onClick={onClose}
            className="text-white/70 text-xl leading-none"
          >
            ✕
          </button>
        </div>
        <div className="mb-3 text-[11px] text-white/70">
          Valide (✔️) pour créer un match et discuter. Refuse (✖️) pour ignorer.
          Tu peux <span className="font-semibold">offrir ta carte</span> 1x/sem grâce
          au bouton <span className="font-semibold">🎁 Offrir</span> présent sur chaque
          carte.
        </div>
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2">
          {people.map((p) => (
            <div
              key={p.id}
              className="snap-center min-w-[calc(100%-2rem)] max-w-[420px] mx-auto"
            >
              <LikeProfileCard
                name={p.name}
                element={p.element}
                photo={p.photo}
                status={p.status}
                onValidate={() => validateMatch(p.id)}
                onRefuse={() => refuseMatch(p.id)}
                onGift={() => giftCard(p.id)}
                disableActions={p.status !== "pending"}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-white/60">
          Super match restant cette semaine :
          <span className="font-semibold text-white"> {weeklyGiftsLeft}</span>/1
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------- Onglets placeholders ----------
const ProfileTab = () => (
  <div className="space-y-3">
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-base font-semibold">Mon profil</div>
      <div className="text-sm text-white/70">
        Complète ta bio, photos et élément préféré.
      </div>
    </div>
  </div>
);

const CollectionTab = () => (
  <div className="space-y-3">
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-base font-semibold">Ma collection</div>
      <div className="text-sm text-white/70">
        Tes cartes sauvegardées s’affichent ici (classées par élément).
      </div>
    </div>
  </div>
);

const MessagesTab = () => (
  <div className="space-y-3">
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-base font-semibold">Messagerie</div>
      <div className="text-sm text-white/70">
        Retrouve tes matchs et conversations.
      </div>
    </div>
  </div>
);

// ---------- Page principale (Mobile) ----------
export default function AccueilConnected() {
  const user = { name: "Quentin" };
  const [openSheet, setOpenSheet] = useState<
    null | "elements" | "objectives" | "likes"
  >(null);
  const [hasEvent] = useState(false);
  const [tab, setTab] = useState<
    "home" | "profile" | "collection" | "messages" | "shop"
  >("home");

  // Progression mock (bronze → argent)
  const currentMatches = 8;
  const nextThreshold = 10;
  const remaining = Math.max(0, nextThreshold - currentMatches);
  const progressPct = Math.min(100, Math.round((currentMatches / nextThreshold) * 100));

  return (
    <div className="min-h-[100svh] w-full bg-[#0a0f14] text-white flex flex-col">
      {/* Content */}
      <div className="flex-1 w-full max-w-md mx-auto px-4 pt-5 pb-[calc(72px+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="leading-tight">
            <div className="text-xs text-white/70">Bonjour</div>
            <div className="text-base font-semibold">{user.name}</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              className="text-white/70 hover:text-white"
              aria-label="Likes"
              onClick={() => setOpenSheet("likes")}
            >
              <Heart className="h-6 w-6" />
            </button>
            <button className="text-white/70 hover:text-white" aria-label="Paramètres">
              <Settings className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs content */}
        {tab === "home" && (
          <div className="space-y-4">
            {/* Progression + Objectifs */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  <div className="text-sm font-semibold">Progression vers ARGENT</div>
                </div>
                <div className="text-xs text-white/70">
                  {currentMatches}/{nextThreshold}
                </div>
              </div>
              <div className="mt-2 relative h-3 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-white/70">
                Encore <span className="text-white font-medium">{remaining}</span> match
                {remaining > 1 ? "s" : ""} pour atteindre
                <span className="font-medium"> ARGENT</span>.
              </div>

              <div className="mt-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setOpenSheet("objectives")}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs"
                >
                  <Flag className="h-4 w-4" /> Voir les objectifs
                </motion.button>
              </div>
            </div>

            {/* Boosters */}
            <div className="text-sm text-white/70">
              Choisis tes 3 boosters quotidiens.
            </div>
            <BoosterCard
              title="Éléments"
              subtitle="Choisis parmi 10 éléments"
              icon="🧪"
              gradient="linear-gradient(135deg,#0b1a2a,#121b2b)"
              onClick={() => setOpenSheet("elements")}
            />
            <BoosterCard
              title="Aléatoire"
              subtitle="5 cartes · éléments variés"
              icon="🎲"
              gradient="linear-gradient(135deg,#1a1326,#2a1f3b)"
            />
            <BoosterCard
              title="Événement"
              subtitle={"Aucun événement rejoint"}
              icon="🎟️"
              gradient="linear-gradient(135deg,#261216,#3a1c22)"
              disabled
            />
          </div>
        )}

        {tab === "profile" && <ProfileTab />}
        {tab === "collection" && <CollectionTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "shop" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-base font-semibold">Boutique</div>
              <div className="text-sm text-white/70">
                Achète des boosters supplémentaires, skins exclusifs ou avantages
                partenaires.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar — icônes uniquement */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#0d141c]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0d141c]/70"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-md grid grid-cols-5">
          {(
            [
              { id: "home", Icon: Home },
              { id: "profile", Icon: User },
              { id: "collection", Icon: Grid3x3 },
              { id: "messages", Icon: MessageSquare },
              { id: "shop", Icon: ShoppingBag },
            ] as const
          ).map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`flex h-16 w-full items-center justify-center ${
                tab === id ? "text-white" : "text-white/60"
              }`}
            >
              <Icon className="h-7 w-7" />
            </button>
          ))}
        </div>
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {openSheet === "elements" && (
          <ElementsSheet
            onPick={(el) => {
              setOpenSheet(null);
              // TODO: lancer l'animation d'ouverture + tirage selon l'élément choisi
            }}
            onClose={() => setOpenSheet(null)}
          />
        )}
        {openSheet === "objectives" && (
          <ObjectivesSheet onClose={() => setOpenSheet(null)} />
        )}
        {openSheet === "likes" && <LikesSheet onClose={() => setOpenSheet(null)} />}
      </AnimatePresence>

      <style>{`
        * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      `}</style>
    </div>
  );
}
