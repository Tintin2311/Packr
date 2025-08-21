import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  SafeAreaView,
} from "react-native";
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
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ---------------- Utils ---------------- */
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

const nativeDriver = Platform.OS !== "web"; // évite le warning Animated sur Web

const useScaleOnPress = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: nativeDriver, friction: 7 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, friction: 6 }).start();
  return { scale, onPressIn, onPressOut };
};

/* ---------------- BoosterCard ---------------- */
type BoosterCardProps = {
  title: string;
  subtitle?: string;
  icon: string;
  disabled?: boolean;
  onPress?: () => void;
  tone?: "blue" | "purple" | "rose";
};
const BoosterCard: React.FC<BoosterCardProps> = ({
  title,
  subtitle,
  icon,
  disabled,
  onPress,
  tone = "blue",
}) => {
  const { scale, onPressIn, onPressOut } = useScaleOnPress();
  const bg =
    tone === "blue" ? styles.bgBlue : tone === "rose" ? styles.bgRose : styles.bgPurple;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={!disabled ? onPress : undefined}
        onPressIn={!disabled ? onPressIn : undefined}
        onPressOut={!disabled ? onPressOut : undefined}
        style={[styles.card, bg, disabled && { opacity: 0.4 }]}
      >
        <View style={styles.rowCenter}>
          <Text style={styles.boosterIcon}>{icon}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={styles.cardTitle}>
              {title}
            </Text>
            {!!subtitle && (
              <Text numberOfLines={1} style={styles.cardSubtitle}>
                {subtitle}
              </Text>
            )}
          </View>
          {!disabled && <Text style={styles.chevron}>›</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
};

/* ---------------- BottomSheet infra ---------------- */
const useBottomSheetAnim = (open: boolean) => {
  const translateY = useRef(new Animated.Value(56)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(overlay, { toValue: 1, duration: 160, useNativeDriver: nativeDriver }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: nativeDriver,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlay, { toValue: 0, duration: 160, useNativeDriver: nativeDriver }),
        Animated.timing(translateY, {
          toValue: 56,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: nativeDriver,
        }),
      ]).start();
    }
  }, [open, overlay, translateY]);

  return { translateY, overlay };
};

const BottomSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => {
  const { translateY, overlay } = useBottomSheetAnim(open);
  if (!open) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
          ]}
        />
      </Pressable>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>{children}</Animated.View>
    </View>
  );
};

/* ---------------- ElementsSheet ---------------- */
const ElementsSheet: React.FC<{ open: boolean; onPick: (el: string) => void; onClose: () => void }> =
  ({ open, onPick, onClose }) => {
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
      <BottomSheet open={open} onClose={onClose}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Choisis un élément</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.grid2}>
          {elements.map((el) => (
            <Pressable key={el} style={styles.gridItem} onPress={() => onPick(el)}>
              <Text style={styles.gridTitle}>
                {elementEmoji(el)} {el}
              </Text>
              <Text style={styles.gridSub}>5 cartes · même élément</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    );
  };

/* ---------------- ObjectivesSheet ---------------- */
const ObjectivesSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const missions = [
    { title: "Compléter ta bio", desc: "+1 booster aujourd'hui", icon: "📝" },
    { title: "Envoyer 1 premier message", desc: "Débloque Mini-jeu: Brise-glace", icon: "💬" },
    { title: "Inviter un ami", desc: "+1 booster cette semaine", icon: "👥" },
    { title: "Scanner un code soirée", desc: "Accès boosters Événement", icon: "🎟️" },
    { title: "Like 10 profils", desc: "Récompense partenaire: -1€ boisson", icon: "🍹" },
  ];

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={styles.sheetHeader}>
        <View style={styles.rowCenter}>
          <Flag size={20} color="#fff" />
          <Text style={[styles.sheetTitle, { marginLeft: 8 }]}>Objectifs</Text>
        </View>
        <Pressable onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <View style={{ rowGap: 12 }}>
        {missions.map((m) => (
          <View key={m.title} style={styles.missionCard}>
            <Text style={styles.missionIcon}>{m.icon}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={styles.missionTitle}>
                {m.title}
              </Text>
              <Text numberOfLines={1} style={styles.missionDesc}>
                {m.desc}
              </Text>
            </View>
            <Pressable style={styles.seeBtn}>
              <Text style={styles.seeBtnText}>Voir</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
};

/* ---------------- Likes (cartes) ---------------- */
type ProfileStatus = "pending" | "validated" | "gifted" | "refused";

const LikeProfileCard: React.FC<{
  name: string;
  element: string;
  photo: string;
  status: ProfileStatus;
  onValidate: () => void;
  onRefuse: () => void;
  onGift: () => void;
  disableActions?: boolean;
}> = ({ name, element, photo, status, onValidate, onRefuse, onGift, disableActions }) => {
  const disabled = disableActions || status !== "pending";
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(appear, {
      toValue: 1,
      useNativeDriver: nativeDriver,
      // @ts-expect-error RN web ne tape pas ces props; c'est ok natif
      stiffness: 140,
      damping: 16,
      mass: 0.8,
    }).start();
  }, [appear]);

  const rotateY = appear.interpolate({ inputRange: [0, 1], outputRange: ["60deg", "0deg"] });
  const scale = appear.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });
  const opacity = appear;

  // boxShadow vs shadow* (évite les warnings sur Web)
  const webOrNativeShadow = Platform.select({
    web: ({ boxShadow: "0 15px 80px rgba(120,210,255,.45)" } as any),
    default: {
      shadowColor: "#78d2ff",
      shadowOpacity: 0.4,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 6,
    },
  });

  // text shadow (évite warning Web)
  const webOrNativeTextShadow = Platform.select({
    web: ({ textShadow: "0px 1px 6px rgba(0,0,0,0.45)" } as any),
    default: {
      textShadowColor: "rgba(0,0,0,0.45)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 6,
    },
  });

  return (
    <Animated.View style={{ transform: [{ rotateY }, { scale }], opacity }}>
      <View style={styles.cardOuterGlow}>
        <View style={[styles.likeCard, webOrNativeShadow]}>
          <Pressable
            onPress={onGift}
            disabled={disabled}
            style={[styles.giftBtn, disabled ? styles.giftBtnDisabled : styles.giftBtnEnabled]}
          >
            <Gift size={14} color="#fff" />
            <Text style={styles.giftText}> Offrir</Text>
          </Pressable>

          <View style={{ height: 300, width: "100%" }}>
            <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
          </View>

          {status !== "pending" && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {status === "validated" ? "Match validé" : status === "gifted" ? "Carte offerte" : "Refusé"}
              </Text>
            </View>
          )}

          <View style={styles.cardTextWrap}>
            <Text style={[styles.cardName, webOrNativeTextShadow]}>{name}</Text>
            <Text style={styles.cardElement}>
              {elementEmoji(element)} {element}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityLabel="Refuser"
          onPress={onRefuse}
          disabled={disabled}
          style={[styles.circleBtn, disabled ? styles.circleBtnDisabled : styles.circleBtnRed]}
        >
          <Text style={styles.circleBtnText}>✖️</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Valider"
          onPress={onValidate}
          disabled={disabled}
          style={[styles.circleBtn, disabled ? styles.circleBtnDisabled : styles.circleBtnGreen]}
        >
          <Text style={styles.circleBtnText}>✔️</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const LikesSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [weeklyGiftsLeft, setWeeklyGiftsLeft] = useState(1);
  const [people, setPeople] = useState<
    Array<{ id: number; name: string; element: string; photo: string; status: ProfileStatus }>
  >([
    {
      id: 1,
      name: "Lina, 24",
      element: "Eau",
      photo:
        "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=800&auto=format&fit=crop",
      status: "pending",
    },
    {
      id: 2,
      name: "Noa, 26",
      element: "Feu",
      photo:
        "https://images.unsplash.com/photo-1549351512-c5e12b12c6b5?q=80&w=800&auto=format&fit=crop",
      status: "pending",
    },
    {
      id: 3,
      name: "Maya, 27",
      element: "Plante",
      photo:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
      status: "pending",
    },
  ]);

  const validateMatch = (id: number) =>
    setPeople((arr) => arr.map((p) => (p.id === id ? { ...p, status: "validated" } : p)));
  const refuseMatch = (id: number) =>
    setPeople((arr) => arr.map((p) => (p.id === id ? { ...p, status: "refused" } : p)));
  const giftCard = (id: number) => {
    if (weeklyGiftsLeft <= 0) return;
    setWeeklyGiftsLeft((n) => n - 1);
    setPeople((arr) => arr.map((p) => (p.id === id ? { ...p, status: "gifted" } : p)));
  };

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={styles.sheetHeader}>
        <View style={styles.rowCenter}>
          <Heart size={20} color="#fff" />
          <Text style={[styles.sheetTitle, { marginLeft: 8 }]}>Ils ont choisi ta carte</Text>
        </View>
        <Pressable onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>

      <Text style={styles.smallNote}>
        Valide (✔️) pour créer un match et discuter. Refuse (✖️) pour ignorer. Tu peux{" "}
        <Text style={{ fontWeight: "700", color: "#fff" }}>offrir ta carte</Text> 1x/sem via{" "}
        <Text style={{ fontWeight: "700", color: "#fff" }}>🎁 Offrir</Text>.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4 }}
        decelerationRate="fast"
        snapToAlignment="center"
        snapToInterval={Dimensions.get("window").width - 32}
      >
        {people.map((p) => (
          <View key={p.id} style={{ width: Dimensions.get("window").width - 32, maxWidth: 420, marginRight: 20 }}>
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
          </View>
        ))}
      </ScrollView>

      <Text style={styles.smallNoteMuted}>
        Super match restant cette semaine :{" "}
        <Text style={{ color: "#fff", fontWeight: "700" }}>{weeklyGiftsLeft}</Text>/1
      </Text>
    </BottomSheet>
  );
};

/* ---------------- Onglets placeholders ---------------- */
const CardBlock: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <View style={styles.cardSimple}>
    <Text style={styles.simpleTitle}>{title}</Text>
    <Text style={styles.simpleSubtitle}>{subtitle}</Text>
  </View>
);
const ProfileTab = () => (
  <CardBlock title="Mon profil" subtitle="Complète ta bio, photos et élément préféré." />
);
const CollectionTab = () => (
  <CardBlock
    title="Ma collection"
    subtitle="Tes cartes sauvegardées s’affichent ici (classées par élément)."
  />
);
const MessagesTab = () => (
  <CardBlock title="Messagerie" subtitle="Retrouve tes matchs et conversations." />
);

/* ---------------- Page principale ---------------- */
export default function AccueilConnected() {
  const insets = useSafeAreaInsets();

  const user = { name: "Quentin" };

  const [openElements, setOpenElements] = useState(false);
  const [openObjectives, setOpenObjectives] = useState(false);
  const [openLikes, setOpenLikes] = useState(false);

  const [tab, setTab] = useState<"home" | "profile" | "collection" | "messages" | "shop">("home");

  // Progression mock (bronze → argent)
  const currentMatches = 8;
  const nextThreshold = 10;
  const remaining = Math.max(0, nextThreshold - currentMatches);
  const progressPct = Math.min(100, Math.round((currentMatches / nextThreshold) * 100));

  return (
    <SafeAreaView style={styles.root}>
      {/* Content */}
      <View
        style={[
          styles.contentWrap,
          { paddingBottom: 88 + Math.max(0, insets.bottom - 8) },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.username}>{user.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setOpenLikes(true)} hitSlop={8} style={{ marginRight: 12 }}>
              <Heart size={24} color="#cbd5e1" />
            </Pressable>
            <Pressable onPress={() => {}} hitSlop={8}>
              <Settings size={24} color="#cbd5e1" />
            </Pressable>
          </View>
        </View>

        {/* Tabs content */}
        {tab === "home" && (
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Progression + Objectifs */}
            <View style={styles.cardSimple}>
              <View style={styles.rowBetween}>
                <View style={styles.rowCenter}>
                  <Trophy size={20} color="#fff" />
                  <Text style={[styles.progressTitle, { marginLeft: 8 }]}>
                    Progression vers ARGENT
                  </Text>
                </View>
                <Text style={styles.progressCount}>
                  {currentMatches}/{nextThreshold}
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View style={[styles.progressInner, { width: `${progressPct}%` }]} />
              </View>
              <Text style={styles.progressNote}>
                Encore <Text style={styles.boldWhite}>{remaining}</Text> match
                {remaining > 1 ? "s" : ""} pour atteindre
                <Text style={styles.boldWhite}> ARGENT</Text>.
              </Text>

              <View style={{ marginTop: 12 }}>
                <Pressable style={styles.objectiveBtn} onPress={() => setOpenObjectives(true)}>
                  <Flag size={16} color="#fff" />
                  <Text style={styles.objectiveBtnText}>Voir les objectifs</Text>
                </Pressable>
              </View>
            </View>

            {/* Boosters */}
            <Text style={styles.sectionHint}>Choisis tes 3 boosters quotidiens.</Text>

            <BoosterCard
              title="Éléments"
              subtitle="Choisis parmi 10 éléments"
              icon="🧪"
              tone="blue"
              onPress={() => setOpenElements(true)}
            />
            <View style={{ height: 12 }} />
            <BoosterCard title="Aléatoire" subtitle="5 cartes · éléments variés" icon="🎲" tone="purple" />
            <View style={{ height: 12 }} />
            <BoosterCard title="Événement" subtitle="Aucun événement rejoint" icon="🎟️" tone="rose" disabled />
          </ScrollView>
        )}

        {tab === "profile" && <ProfileTab />}
        {tab === "collection" && <CollectionTab />}
        {tab === "messages" && <MessagesTab />}
        {tab === "shop" && (
          <View>
            <CardBlock
              title="Boutique"
              subtitle="Achète des boosters supplémentaires, skins exclusifs ou avantages partenaires."
            />
          </View>
        )}
      </View>

      {/* Bottom bar — FIX: rangée horizontale + largeur égale + safe-area */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(8, insets.bottom) },
        ]}
      >
        <View style={styles.tabsRow}>
          {(
            [
              { id: "home", Icon: Home },
              { id: "profile", Icon: User },
              { id: "collection", Icon: Grid3x3 },
              { id: "messages", Icon: MessageSquare },
              { id: "shop", Icon: ShoppingBag },
            ] as const
          ).map(({ id, Icon }) => {
            const active = tab === id;
            return (
              <Pressable key={id} style={styles.tabBtn} onPress={() => setTab(id as any)}>
                <Icon size={28} color={active ? "#ffffff" : "#94a3b8"} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Sheets */}
      <ElementsSheet
        open={openElements}
        onPick={(el) => {
          setOpenElements(false);
          // TODO: lancer l’animation d’ouverture + tirage selon l’élément choisi
        }}
        onClose={() => setOpenElements(false)}
      />
      <ObjectivesSheet open={openObjectives} onClose={() => setOpenObjectives(false)} />
      <LikesSheet open={openLikes} onClose={() => setOpenLikes(false)} />
    </SafeAreaView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0f14",
  },
  contentWrap: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  username: { fontSize: 16, color: "#fff", fontWeight: "600" },
  headerActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center" },

  /* Cards */
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  bgBlue: { backgroundColor: "rgba(13, 26, 42, 0.9)" },
  bgPurple: { backgroundColor: "rgba(34, 20, 58, 0.9)" },
  bgRose: { backgroundColor: "rgba(58, 22, 30, 0.9)" },
  boosterIcon: { fontSize: 26, marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#fff" },
  cardSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  chevron: { fontSize: 22, color: "rgba(255,255,255,0.6)" },

  /* Simple card */
  cardSimple: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
    marginBottom: 12,
  },
  simpleTitle: { fontSize: 16, color: "#fff", fontWeight: "600", marginBottom: 6 },
  simpleSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)" },

  /* Progress */
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  progressTitle: { fontSize: 14, color: "#fff", fontWeight: "600" },
  progressCount: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  progressBar: {
    marginTop: 8,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressInner: {
    height: "100%",
    backgroundColor: "#facc15",
    borderRadius: 999,
  },
  progressNote: { marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.7)" },
  boldWhite: { color: "#fff", fontWeight: "700" },

  objectiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  objectiveBtnText: { color: "#fff", fontSize: 12, fontWeight: "600", marginLeft: 6 },

  /* Section label */
  sectionHint: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 },

  /* Sheet */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "#0d141c",
    padding: 16,
    paddingBottom: 20,
  },
  sheetHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 16, color: "#fff", fontWeight: "700" },
  close: { fontSize: 20, color: "rgba(255,255,255,0.7)" },

  /* Elements grid */
  grid2: { flexDirection: "row", flexWrap: "wrap", rowGap: 12, columnGap: 12 },
  gridItem: {
    width: "48%",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
  },
  gridTitle: { fontSize: 15, fontWeight: "600", color: "#fff" },
  gridSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },

  /* Missions */
  missionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
  },
  missionIcon: { fontSize: 22, marginRight: 12 },
  missionTitle: { fontSize: 13.5, fontWeight: "700", color: "#fff" },
  missionDesc: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  seeBtn: {
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  seeBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  /* Likes */
  cardOuterGlow: {
    borderRadius: 18,
    padding: 3,
    backgroundColor: "rgba(141, 214, 255, 0.25)",
  },
  likeCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#071018",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(168,228,255,.4)",
  },
  giftBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 10,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  giftBtnEnabled: { backgroundColor: "#f43f5e" },
  giftBtnDisabled: { backgroundColor: "rgba(255,255,255,0.1)" },
  giftText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  photo: { width: "100%", height: "100%" },
  cardTextWrap: { position: "absolute", left: 16, right: 16, bottom: 20 },
  cardName: { color: "#fff", fontSize: 22, fontWeight: "700" },
  cardElement: { color: "rgba(255,255,255,0.85)", fontSize: 13 },
  statusBadge: {
    position: "absolute",
    left: 10,
    top: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusText: { color: "rgba(255,255,255,0.85)", fontSize: 11 },

  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 16,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  circleBtnText: { fontSize: 16, color: "#fff" },
  circleBtnRed: { borderColor: "rgba(248,113,113,0.6)" },
  circleBtnGreen: { borderColor: "rgba(52,211,153,0.6)" },
  circleBtnDisabled: { borderColor: "rgba(255,255,255,0.12)", opacity: 0.45 },

  /* Notes */
  smallNote: { marginBottom: 8, fontSize: 11, color: "rgba(255,255,255,0.8)" },
  smallNoteMuted: { marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.6)" },

  /* Bottom bar (fix) */
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
    backgroundColor: Platform.select({
      web: "rgba(13,20,28,0.92)",
      default: "rgba(13,20,28,0.95)",
    }),
    paddingTop: 4,
  },
  tabsRow: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabBtn: {
    flex: 1,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
});
