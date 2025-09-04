// AuthScreen.tsx
import React, {
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

// Sous-écrans
import AuthScreenConnexion from "./AuthScreenConnexion";
import AuthScreenInscription from "./AuthScreenInscription";
import AuthScreenRecuperation from "./AuthScreenRecuperation";

// Images (PNG transparents)
import PhotoPackConnexion from "./Images/PhotoPackConnexion";
import PhotoPackInscription from "./Images/PhotoPackInscription";
import PhotoPackRecuperation from "./Images/PhotoPackRecuperation";

/* ========= Types & packs ========= */
type SelectedBooster = "signin" | "signup" | "reset" | null;
type BoosterRarity = "COMMON" | "RARE" | "EPIC";
type Booster = {
  id: "signin" | "signup" | "reset";
  name: string;
  subtitle: string;
  rarity: BoosterRarity;
  gradient: [string, string];
  glow: string;
  count: string;
};

const BOOSTERS: Booster[] = [
  { id: "signin", name: "Pack Connexion", subtitle: "Retrouve ton profil", rarity: "COMMON", gradient: ["#0ea5e9", "#38bdf8"], glow: "#22d3ee", count: "5 cartes" },
  { id: "signup", name: "Pack Inscription", subtitle: "Commence l'aventure", rarity: "RARE", gradient: ["#7c3aed", "#a78bfa"], glow: "#a78bfa", count: "5 cartes" },
  { id: "reset",  name: "Pack Récupération", subtitle: "Récupère ton accès", rarity: "EPIC", gradient: ["#f43f5e", "#fb7185"], glow: "#fda4af", count: "5 cartes" },
];

const SPECS = [
  { id: "signin" as const,  Comp: PhotoPackConnexion,   label: "CONNEXION" },
  { id: "signup" as const,  Comp: PhotoPackInscription, label: "INSCRIPTION" },
  { id: "reset"  as const,  Comp: PhotoPackRecuperation, label: "RÉCUPÉRATION" },
];

/* ========= Sizing ========= */
const { width: SCREEN_W } = Dimensions.get("window");
const PAGE_W = SCREEN_W;
const RATIO = 1.25;

/* --- Hitbox interne (pour ignorer les bords transparents du PNG) --- */
const ACTIVE_W_RATIO = 0.54; // ✅ tes valeurs
const ACTIVE_H_RATIO = 0.69;
const ACTIVE_Y_OFFSET = 0.0;

/* ========= PackCard — clic limité à une hitbox interne ========= */
function PackCard({
  width,
  height,
  disabled,
  onPress,
  children,
}: {
  width: number;
  height: number;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const setScale = (v: number, d = 90) =>
    Animated.timing(scale, { toValue: v, duration: d, useNativeDriver: true });

  const activeW = Math.round(width * ACTIVE_W_RATIO);
  const activeH = Math.round(height * ACTIVE_H_RATIO);
  const left = Math.round((width - activeW) / 2);
  const top = Math.round((height - activeH) / 2 + height * ACTIVE_Y_OFFSET);

  return (
    <View style={{ width: PAGE_W, alignItems: "center" }}>
      <Animated.View
        pointerEvents="box-none"
        style={{
          width,
          height,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale }],
          position: "relative",
        }}
      >
        {/* L’image n’attrape pas les events */}
        <View style={{ width, height }} pointerEvents="none">
          {children}
        </View>

        {/* Seule cette zone est cliquable */}
        <Pressable
          onPress={disabled ? undefined : onPress}
          onPressIn={() => !disabled && setScale(0.985).start()}
          onPressOut={() => !disabled && setScale(1).start()}
          style={[styles.hitbox, { width: activeW, height: activeH, left, top }]}
          pointerEvents="box-only"
        />
      </Animated.View>
    </View>
  );
}

/* ========= Écran principal ========= */
export default function AuthScreen() {
  const [selected, setSelected] = useState<SelectedBooster>(null);

  const data = useMemo(() => SPECS, []);
  const listRef = useRef<Animated.FlatList<any>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [isDragging, setIsDragging] = useState(false);
  const [isMomentum, setIsMomentum] = useState(false);
  const [index, setIndex] = useState(1);
  const lastScrollTs = useRef(0);
  const lastArrowTs = useRef(0);

  const [availH, setAvailH] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: PAGE_W * 1, animated: false });
      setIndex(1);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        lastScrollTs.current = Date.now();
        const i = Math.round(e.nativeEvent.contentOffset.x / PAGE_W);
        if (i !== index) setIndex(i);
      },
    }
  );

  const beginDrag = () => setIsDragging(true);
  const endDrag = () => {
    setIsDragging(false);
    setTimeout(() => setIsMomentum(false), 80);
  };
  const momentumBegin = () => setIsMomentum(true);
  const momentumEnd = () => setIsMomentum(false);

  const isScrolling = isDragging || isMomentum;

  const setPage = (i: number, animated = true) => {
    const clamped = Math.max(0, Math.min(data.length - 1, i));
    setIndex(clamped);
    listRef.current?.scrollToOffset({ offset: clamped * PAGE_W, animated });
  };

  const openCurrent = useCallback(() => {
    if (isScrolling || Date.now() - lastScrollTs.current < 120) return;
    const id = data[index].id as SelectedBooster;
    setSelected(id);
  }, [data, index, isScrolling]);

  const goTo = (i: number) => setPage(i, true);

  const canClickArrow = () =>
    !isScrolling && Date.now() - lastArrowTs.current > 150;

  const goPrev = () => {
    if (!canClickArrow() || index <= 0) return;
    lastArrowTs.current = Date.now();
    setPage(index - 1, true);
  };

  const goNext = () => {
    if (!canClickArrow() || index >= data.length - 1) return;
    lastArrowTs.current = Date.now();
    setPage(index + 1, true);
  };

  const TAB_TRACK_W = SCREEN_W - 48;
  const indicatorX = scrollX.interpolate({
    inputRange: [0, PAGE_W, PAGE_W * 2],
    outputRange: [0, 1, 2],
    extrapolate: "clamp",
  });

  const packWidth = useMemo(() => {
    const byWidth = SCREEN_W * 0.995;
    if (!availH) return byWidth;
    const byHeight = availH / RATIO;
    return Math.max(260, Math.min(byWidth, byHeight));
  }, [availH]);
  const packHeight = Math.round(packWidth * RATIO);

  const showLeft = index > 0;
  const showRight = index < data.length - 1;

  const packForSelected =
    selected ? BOOSTERS.find((b) => b.id === selected)! : null;

  const content = selected ? (
    selected === "signin" ? (
      <AuthScreenConnexion onBack={() => setSelected(null)} pack={packForSelected!} />
    ) : selected === "signup" ? (
      <AuthScreenInscription onBack={() => setSelected(null)} pack={packForSelected!} />
    ) : (
      <AuthScreenRecuperation onBack={() => setSelected(null)} pack={packForSelected!} />
    )
  ) : (
    <>
      {/* Onglets */}
      <View style={styles.tabs}>
        {data.map((it, i) => {
          const active = i === index;
          return (
            <Pressable key={it.id} onPress={() => goTo(i)} style={styles.tabBtn}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{it.label}</Text>
            </Pressable>
          );
        })}
        <View style={[styles.tabIndicatorWrap, { width: TAB_TRACK_W }]}>
          <Animated.View
            style={[
              styles.tabIndicator,
              {
                width: TAB_TRACK_W / 3,
                transform: [{ translateX: Animated.multiply(indicatorX, TAB_TRACK_W / 3) }],
              },
            ]}
          />
        </View>
      </View>

      {/* Zone pager (mesure la hauteur dispo) */}
      <View
        style={{ flex: 1, position: "relative" }}
        onLayout={(e) => setAvailH(e.nativeEvent.layout.height)}
      >
        <Animated.FlatList
          ref={listRef as any}
          data={data}
          keyExtractor={(it) => it.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={PAGE_W}
          pagingEnabled
          bounces={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={beginDrag}
          onScrollEndDrag={endDrag}
          onMomentumScrollBegin={momentumBegin}
          onMomentumScrollEnd={momentumEnd}
          renderItem={({ item }) => {
            const Comp =
              item.id === "signin"
                ? PhotoPackConnexion
                : item.id === "signup"
                ? PhotoPackInscription
                : PhotoPackRecuperation;

            return (
              <View
                style={{
                  width: PAGE_W,
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: 0,
                }}
              >
                <PackCard
                  width={packWidth}
                  height={packHeight}
                  disabled={isScrolling}
                  onPress={openCurrent}
                >
                  <Comp />
                </PackCard>
              </View>
            );
          }}
        />

        {/* ⚠️ Flèches APRÈS la FlatList (donc au-dessus) + zIndex */}
        <View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, { zIndex: 10 }]}
        >
          {showLeft && (
            <Pressable
              pointerEvents="auto"
              onPress={goPrev}
              style={[styles.arrow, styles.arrowLeft]}
              hitSlop={{ left: 8, right: 8, top: 12, bottom: 12 }}
            >
              <ChevronLeft color="#fff" size={44} />
            </Pressable>
          )}
          {showRight && (
            <Pressable
              pointerEvents="auto"
              onPress={goNext}
              style={[styles.arrow, styles.arrowRight]}
              hitSlop={{ left: 8, right: 8, top: 12, bottom: 12 }}
            >
              <ChevronRight color="#fff" size={44} />
            </Pressable>
          )}
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0b0f14" }]} />

      {!selected && (
        <View style={styles.header}>
          <Text style={styles.brand}>Packr</Text>
        </View>
      )}

      {content}
    </SafeAreaView>
  );
}

/* ========= Styles ========= */
const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { paddingHorizontal: 24, paddingTop: 8, marginBottom: 0 },
  brand: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -0.6 },

  // Hitbox interne
  hitbox: {
    position: "absolute",
    backgroundColor: "transparent",
    borderRadius: 20,
  },

  // Onglets
  tabs: {
    paddingHorizontal: 24,
    marginTop: 4,
    marginBottom: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tabBtn: {
    alignItems: "center",
    justifyContent: "center",
    width: (SCREEN_W - 48) / 3,
    height: 28,
  },
  tabText: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "900",
    letterSpacing: 0.4,
    fontSize: 12,
  },
  tabTextActive: { color: "#fff" },
  tabIndicatorWrap: {
    marginTop: 3,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    overflow: "hidden",
  },
  tabIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 2,
    borderRadius: 999,
    backgroundColor: "#fff",
  },

  // Flèches au-dessus de tout
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -32,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: 12,
  },
  arrowLeft: { left: 8 },
  arrowRight: { right: 8 },
});
