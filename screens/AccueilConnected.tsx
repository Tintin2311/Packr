// screens/AccueilConnected.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
  Platform,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Trophy, Flag } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SettingsOverlayProvider, { SettingsFab } from "../overlay/SettingsOverlay";
import LikesOverlayProvider, { LikesFab } from "../overlay/LikesOverlay";

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

const nativeDriver = Platform.OS !== "web";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const useScaleOnPress = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: nativeDriver, friction: 7, tension: 170 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, friction: 6, tension: 170 }).start();
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
const BoosterCard: React.FC<BoosterCardProps> = ({ title, subtitle, icon, disabled, onPress, tone = "blue" }) => {
  const { scale, onPressIn, onPressOut } = useScaleOnPress();
  const bg = tone === "blue" ? styles.bgBlue : tone === "rose" ? styles.bgRose : styles.bgPurple;

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

const BottomSheet: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({
  open,
  onClose,
  children,
}) => {
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
    const elements = ["Feu", "Eau", "Électricité", "Plante", "Glace", "Pierre", "Sol", "Ténèbres", "Lumière", "Vent"];
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

      <View>
        {missions.map((m) => (
          <View key={m.title} style={[styles.missionCard, { marginBottom: 12 }]}>
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

/* ---------------- Page principale ---------------- */
export default function AccueilConnected() {
  const insets = useSafeAreaInsets();
  const user = { name: "Quentin" };

  const [openElements, setOpenElements] = useState(false);
  const [openObjectives, setOpenObjectives] = useState(false);

  const currentMatches = 8;
  const nextThreshold = 10;
  const remaining = Math.max(0, nextThreshold - currentMatches);
  const progressPct = Math.min(100, Math.round((currentMatches / nextThreshold) * 100));

  return (
    <SettingsOverlayProvider>
      <LikesOverlayProvider>
        <SafeAreaView style={styles.root}>
          {/* Fond Aurora */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LinearGradient
              colors={["#0a0f14", "#0d141c"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.blob, { top: -80, left: -60, transform: [{ rotate: "15deg" }] }]}>
              <LinearGradient colors={["#1d4ed8", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            </View>
            <View style={[styles.blob, { bottom: -90, right: -30, transform: [{ rotate: "-20deg" }] }]}>
              <LinearGradient colors={["#22c55e", "transparent"]} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
            </View>
            <View style={[styles.blob, { top: 160, right: -60, transform: [{ rotate: "30deg" }] }]}>
              <LinearGradient colors={["#e11d48", "transparent"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
            </View>
          </View>

          <View style={[styles.contentWrap, { paddingBottom: 16 + Math.max(0, insets.bottom - 8) }]}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.greeting}>Bonjour</Text>
                <Text style={styles.username}>{user.name}</Text>
              </View>
            </View>

            {/* Contenu */}
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
              <View style={styles.cardSimple}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowCenter}>
                    <Trophy size={20} color="#fff" />
                    <Text style={[styles.progressTitle, { marginLeft: 8 }]}>Progression vers ARGENT</Text>
                  </View>
                  <Text style={styles.progressCount}>
                    {currentMatches}/{nextThreshold}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressInner, { width: `${progressPct}%` }]} />
                </View>
                <Text style={styles.progressNote}>
                  Encore <Text style={styles.boldWhite}>{remaining}</Text> match{remaining > 1 ? "s" : ""} pour atteindre
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
              <BoosterCard title="Éléments" subtitle="Choisis parmi 10 éléments" icon="🧪" tone="blue" onPress={() => setOpenElements(true)} />
              <View style={{ height: 12 }} />
              <BoosterCard title="Aléatoire" subtitle="5 cartes · éléments variés" icon="🎲" tone="purple" />
              <View style={{ height: 12 }} />
              <BoosterCard title="Événement" subtitle="Aucun événement rejoint" icon="🎟️" tone="rose" disabled />
            </ScrollView>
          </View>

          {/* Sheets */}
          <ElementsSheet open={openElements} onPick={() => setOpenElements(false)} onClose={() => setOpenElements(false)} />
          <ObjectivesSheet open={openObjectives} onClose={() => setOpenObjectives(false)} />

          {/* FABs alignés en row */}
          <View pointerEvents="box-none" style={[styles.fabsRow, { paddingTop: insets.top }]}>
            <LikesFab style={{ position: "relative", top: undefined, right: undefined, marginRight: 8 }} />
            <SettingsFab style={{ position: "relative", top: undefined, right: undefined }} />
          </View>
        </SafeAreaView>
      </LikesOverlayProvider>
    </SettingsOverlayProvider>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0f14",
  },

  // blobs aurora
  blob: {
    position: "absolute",
    width: Dimensions.get("window").width * 0.9,
    height: Dimensions.get("window").width * 0.9,
    borderRadius: 999,
    opacity: 0.15,
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
  progressInner: { height: "100%", backgroundColor: "#facc15", borderRadius: 999 },
  progressNote: { marginTop: 4, fontSize: 12, color: "rgba(255,255,255,0.7)" },
  boldWhite: { color: "#fff", fontWeight: "700" },

  sectionHint: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 },

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

  /* Sheet */
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
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
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  gridItem: {
    width: "48%",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    marginBottom: 12,
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
  seeBtnText: { color: "rgba(255,255,255,0.95)", fontSize: 12, fontWeight: "600" },

  /* FABs alignés */
  fabsRow: {
    position: "absolute",
    top: 0,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    // Si RN >= 0.71 tu peux activer gap:
    // gap: 8,
  },
});
