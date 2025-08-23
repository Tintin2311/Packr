// overlay/LikesOverlay.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { Heart, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ----------------------------------------------------
   Contexte
---------------------------------------------------- */
type Ctx = {
  openLikes: () => void;
  closeLikes: () => void;
  isOpen: boolean;
};
const LikesOverlayContext = createContext<Ctx | null>(null);

export const useLikesOverlay = () => {
  const ctx = useContext(LikesOverlayContext);
  if (!ctx) throw new Error("useLikesOverlay must be used within LikesOverlayProvider");
  return ctx;
};

/* ----------------------------------------------------
   Provider
---------------------------------------------------- */
const nativeDriver = Platform.OS !== "web";

// Doit correspondre au FAB "Paramètres" (⚙️) pour un alignement parfait
const SETTINGS_TOP_PADDING = 8;      // même top que le bouton ⚙️
const SETTINGS_RIGHT = 8;            // même right que le bouton ⚙️
const RESERVED_RIGHT_FOR_SETTINGS = 56; // largeur+espacement réservé pour ⚙️ (ajuste si besoin)

export default function LikesOverlayProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  // Animations
  const translateY = useRef(new Animated.Value(64)).current;
  const overlay = useRef(new Animated.Value(0)).current;

  const animateTo = useCallback(
    (toOpen: boolean) => {
      Animated.parallel([
        Animated.timing(overlay, { toValue: toOpen ? 1 : 0, duration: 180, useNativeDriver: nativeDriver }),
        Animated.timing(translateY, {
          toValue: toOpen ? 0 : 64,
          duration: toOpen ? 220 : 200,
          easing: toOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
          useNativeDriver: nativeDriver,
        }),
      ]).start(() => {
        if (!toOpen) setOpen(false);
      });
    },
    [overlay, translateY]
  );

  const openLikes = useCallback(() => {
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() => animateTo(true));
    }
  }, [open, animateTo]);

  const closeLikes = useCallback(() => animateTo(false), [animateTo]);

  const value = useMemo<Ctx>(() => ({ openLikes, closeLikes, isOpen: open }), [openLikes, closeLikes, open]);

  const topAligned = insets.top + SETTINGS_TOP_PADDING;

  return (
    <LikesOverlayContext.Provider value={value}>
      {/* 1) Contenu de l’app */}
      {children}

      {/* 2) Bouton flottant (cœur), aligné sur la même ligne que ⚙️ */}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Pressable
          onPress={openLikes}
          style={[
            styles.fab,
            {
              top: topAligned,                 // même top que ⚙️
              right: RESERVED_RIGHT_FOR_SETTINGS, // on réserve la place pour ⚙️ (qui est à right: 8)
            },
          ]}
          hitSlop={8}
        >
          <Heart size={18} color="#fff" />
        </Pressable>
      </View>

      {/* 3) Calque + feuille Likes */}
      {open && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {/* overlay */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeLikes}>
            <Animated.View
              style={[
                styles.overlay,
                { opacity: overlay.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
              ]}
            />
          </Pressable>

          {/* feuille */}
          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.sheetHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Heart size={18} color="#fff" />
                <Text style={styles.sheetTitle}>  Ils ont choisi ta carte</Text>
              </View>
              <Pressable onPress={closeLikes} hitSlop={8}>
                <X size={20} color="rgba(255,255,255,0.8)" />
              </Pressable>
            </View>

            {/* Contenu démo un peu plus "riche" */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 8 }}
              decelerationRate="fast"
              snapToAlignment="center"
              snapToInterval={300}
            >
              {demoPeople.map((p) => (
                <View key={p.id} style={styles.cardWrap}>
                  <View style={styles.card}>
                    <View style={{ height: 190, width: "100%" }}>
                      <Image source={{ uri: p.photo }} style={styles.photo} resizeMode="cover" />
                    </View>
                    <View style={styles.cardText}>
                      <Text numberOfLines={1} style={styles.cardName}>{p.name}</Text>
                      <Text style={styles.cardMeta}>Élément : {p.element}</Text>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable style={[styles.btn, styles.btnAccept]}>
                      <Text style={styles.btnTxt}>Valider</Text>
                    </Pressable>
                    <Pressable style={[styles.btn, styles.btnRefuse]}>
                      <Text style={styles.btnTxt}>Refuser</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </LikesOverlayContext.Provider>
  );
}

/* ----------------------------------------------------
   Données de démo (images libres Unsplash)
---------------------------------------------------- */
const demoPeople = [
  {
    id: 1,
    name: "Lina, 24",
    element: "Eau",
    photo: "https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Noa, 26",
    element: "Feu",
    photo: "https://images.unsplash.com/photo-1549351512-c5e12b12c6b5?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    name: "Maya, 27",
    element: "Plante",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop",
  },
];

/* ----------------------------------------------------
   Styles
---------------------------------------------------- */
const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.18)",
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    zIndex: 50,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0d141c",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 16,
    paddingBottom: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },

  cardWrap: {
    width: 300,
    marginRight: 14,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#071018",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(168,228,255,.25)",
  },
  photo: { width: "100%", height: "100%" },
  cardText: { padding: 10 },
  cardName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cardMeta: { color: "rgba(255,255,255,0.75)", fontSize: 12, marginTop: 2 },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  btnAccept: { backgroundColor: "rgba(34,197,94,0.25)", borderWidth: 1, borderColor: "rgba(34,197,94,0.4)" },
  btnRefuse: { backgroundColor: "rgba(239,68,68,0.25)", borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" },
  btnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
