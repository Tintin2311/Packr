// screens/CollectionScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  Pressable,
  TextInput,
  Image,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import {
  Grid3x3,
  Search,
  Sparkles,
  Flame,
  Droplets,
  Zap,
  Leaf,
  Snowflake,
  Mountain,
  Waves,
  Moon,
  SunMedium,
  Star,
} from "lucide-react-native";
// import { supabase } from "../SupabaseClient"; // ← branche quand prêt
// import { useAuth } from "../hooks/useAuth";

/* ---------- Thème ---------- */
const BG = "#0b0f19";
const CARD_BG = "#0e1526";
const TEXT = "#e6ecff";
const MUTED = "#91a0c0";
const BORDER = "rgba(255,255,255,0.06)";

/* ---------- Types ---------- */
type Rarity = "bronze" | "argent" | "or" | "diamant" | "legend";
type ElementKey =
  | "Feu"
  | "Eau"
  | "Électricité"
  | "Plante"
  | "Glace"
  | "Pierre"
  | "Sol"
  | "Ténèbres"
  | "Lumière"
  | "Vent";

type CardItem = {
  id: string;
  username: string;
  imageUrl: string;
  element: ElementKey;
  rarity: Rarity;
  created_at: string;
  isFavorite?: boolean;
};

/* ---------- Métadonnées ---------- */
const ELEMENT_META: Record<
  ElementKey,
  { label: string; tint: string; Icon: any }
> = {
  Feu: { label: "Feu", tint: "#ef4444", Icon: Flame },
  Eau: { label: "Eau", tint: "#0ea5e9", Icon: Droplets },
  Électricité: { label: "Élec", tint: "#f59e0b", Icon: Zap },
  Plante: { label: "Plante", tint: "#22c55e", Icon: Leaf },
  Glace: { label: "Glace", tint: "#38bdf8", Icon: Snowflake },
  Pierre: { label: "Pierre", tint: "#a78bfa", Icon: Mountain },
  Sol: { label: "Sol", tint: "#d97706", Icon: Waves },
  Ténèbres: { label: "Ténèbres", tint: "#6366f1", Icon: Moon },
  Lumière: { label: "Lumière", tint: "#facc15", Icon: SunMedium },
  Vent: { label: "Vent", tint: "#60a5fa", Icon: Grid3x3 },
};

const RARITY_TINT: Record<Rarity, string> = {
  bronze: "#cd7f32",
  argent: "#c0c0c0",
  or: "#f6c453",
  diamant: "#67e8f9",
  legend: "#f0abfc",
};
const RARITY_LABEL: Record<Rarity, string> = {
  bronze: "BRONZE",
  argent: "ARGENT",
  or: "OR",
  diamant: "DIAMANT",
  legend: "LÉGENDAIRE",
};

/* ---------- Grille: constantes & métriques ---------- */
const H_PADDING = 14; // padding horizontal du FlatList
const COL_GAP = 12;   // espacement entre colonnes
const CARD_ASPECT = 0.66; // ratio vignette proche de ta carte

function useGridMetrics() {
  const [state, setState] = useState({ cols: 2, cardW: 160 });
  useEffect(() => {
    const compute = () => {
      const w = Dimensions.get("window").width;
      let cols = 2;
      if (w >= 1280) cols = 6;
      else if (w >= 1060) cols = 5;
      else if (w >= 880) cols = 4;
      else if (w >= 620) cols = 3;

      const inner = w - H_PADDING * 2;
      const cardW = (inner - COL_GAP * (cols - 1)) / cols;
      setState({ cols, cardW });
    };
    compute();
    const sub = Dimensions.addEventListener("change", compute);
    return () => sub.remove();
  }, []);
  return state; // { cols, cardW }
}

/* ---------- Mock data (remplacer par Supabase) ---------- */
const MOCK: CardItem[] = Array.from({ length: 18 }).map((_, i) => {
  const elements = Object.keys(ELEMENT_META) as ElementKey[];
  const rarities: Rarity[] = ["bronze", "argent", "or", "diamant", "legend"];
  return {
    id: String(i + 1),
    username: ["Ava", "Léo", "Maya", "Noa", "Lina", "Eli"][i % 6],
    imageUrl:
      "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?w=1200&q=60",
    element: elements[i % elements.length],
    rarity: rarities[i % rarities.length],
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    isFavorite: Math.random() > 0.6,
  };
});

/* ---------- Chip ---------- */
function Chip({
  active,
  label,
  onPress,
}: {
  active?: boolean;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? "#6ee7b7" : BORDER, backgroundColor: CARD_BG },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? TEXT : MUTED }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ---------- Vignette de carte (avec favoris) ---------- */
function CardTile({
  item,
  cardWidth,
  onPress,
  onToggleFav,
}: {
  item: CardItem;
  cardWidth: number;
  onPress?: (it: CardItem) => void;
  onToggleFav?: (id: string, next: boolean) => void;
}) {
  const { tint, Icon } = ELEMENT_META[item.element];

  // Hover web uniquement
  const [isHover, setIsHover] = useState(false);
  const webHoverProps =
    Platform.OS === "web"
      ? ({
          onHoverIn: () => setIsHover(true),
          onHoverOut: () => setIsHover(false),
        } as any)
      : undefined;

  return (
    <Pressable
      {...webHoverProps}
      onPress={() => onPress?.(item)}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          borderColor:
            Platform.OS === "web" && isHover ? tint + "44" : BORDER,
          transform:
            Platform.OS === "web" && isHover ? [{ translateY: -2 }] : undefined,
          shadowOpacity: Platform.OS === "web" && isHover ? 0.35 : 0.18,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
    >
      <View style={styles.thumbWrap}>
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
        <View style={styles.thumbOverlay} />

        {/* badge rareté */}
        <View style={[styles.badge, { left: 8, borderColor: BORDER }]}>
          <View
            style={[
              styles.badgeDot,
              { backgroundColor: RARITY_TINT[item.rarity] },
            ]}
          />
          <Text style={styles.badgeText}>{RARITY_LABEL[item.rarity]}</Text>
        </View>

        {/* badge élément */}
        <View style={[styles.badge, { right: 8, borderColor: BORDER }]}>
          <Icon size={14} color={tint} />
          <Text style={[styles.badgeText, { color: tint, marginLeft: 6 }]}>
            {ELEMENT_META[item.element].label}
          </Text>
        </View>

        {/* FAVORI : bouton étoile en bas-droite */}
        <Pressable
          onPress={() => onToggleFav?.(item.id, !item.isFavorite)}
          hitSlop={10}
          style={styles.favBtn}
        >
          <Star
            size={18}
            color={item.isFavorite ? "#facc15" : "#cbd5e1"}
            fill={item.isFavorite ? "#facc15" : "transparent"}
          />
        </Pressable>
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.username}>
          {item.username}
        </Text>
        <Text style={styles.metaSub}>
          Ajouté·e • {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
}

/* ---------- Skeleton ---------- */
function CardSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <View style={[styles.card, { width: cardWidth, borderColor: BORDER }]}>
      <View style={[styles.thumbWrap, { backgroundColor: "#121a2c" }]} />
      <View style={{ padding: 10 }}>
        <View style={{ height: 14, backgroundColor: "#141d33", borderRadius: 6 }} />
        <View
          style={{
            height: 10,
            backgroundColor: "#121a2c",
            borderRadius: 6,
            marginTop: 8,
            width: "60%",
          }}
        />
      </View>
    </View>
  );
}

/* ---------- Empty State ---------- */
function EmptyState({ onOpenShop }: { onOpenShop?: () => void }) {
  return (
    <View style={styles.empty}>
      <Grid3x3 size={42} color={MUTED} />
      <Text style={styles.emptyTitle}>Ma collection</Text>
      <Text style={styles.emptyDesc}>Tes cartes sauvegardées s’affichent ici.</Text>
      <Pressable onPress={onOpenShop} style={styles.cta}>
        <Sparkles size={16} color="#0b0f19" />
        <Text style={styles.ctaText}>Ouvrir un booster</Text>
      </Pressable>
    </View>
  );
}

/* ---------- Écran ---------- */
export default function CollectionScreen({ navigation }: any) {
  // const { user } = useAuth();
  const { cols: numColumns, cardW } = useGridMetrics();

  const [query, setQuery] = useState("");
  const [onlyFav, setOnlyFav] = useState(false); // ← filtre Favoris
  const [activeEl, setActiveEl] = useState<ElementKey | "Tous">("Tous");
  const [sort, setSort] = useState<"Recents" | "Nom" | "Rareté">("Recents");
  const [items, setItems] = useState<CardItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    // TODO: fetch Supabase (owner_id, join favorites pour marquer isFavorite)
    // Exemple d'approche :
    // const { data: cards } = await supabase.from('cards').select('*').eq('owner_id', user.id);
    // const { data: favs } = await supabase.from('favorites').select('card_id').eq('user_id', user.id);
    // const favSet = new Set(favs?.map(f => f.card_id));
    // setItems(cards?.map(c => ({...c, isFavorite: favSet.has(c.id)})) ?? []);
    setItems(null);
    setTimeout(() => setItems(MOCK), 350);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const onEndReached = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    // TODO: pagination Supabase
    setTimeout(() => setLoadingMore(false), 300);
  }, [loadingMore]);

  const filtered = useMemo(() => {
    if (!items) return null;
    let data = items;
    if (onlyFav) data = data.filter((d) => d.isFavorite);
    if (activeEl !== "Tous") data = data.filter((d) => d.element === activeEl);
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((d) => d.username.toLowerCase().includes(q));
    }
    if (sort === "Recents") {
      data = [...data].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "Nom") {
      data = [...data].sort((a, b) =>
        a.username.localeCompare(b.username, "fr", { sensitivity: "base" })
      );
    } else {
      const order: Rarity[] = ["legend", "diamant", "or", "argent", "bronze"];
      const idx = (r: Rarity) => order.indexOf(r);
      data = [...data].sort((a, b) => idx(a.rarity) - idx(b.rarity));
    }
    return data;
  }, [items, onlyFav, activeEl, query, sort]);

  const toggleFav = useCallback(
    async (id: string, next: boolean) => {
      // Optimistic UI
      setItems((prev) =>
        prev ? prev.map((it) => (it.id === id ? { ...it, isFavorite: next } : it)) : prev
      );

      // TODO: persister côté Supabase
      // if (!user) return;
      // if (next) {
      //   await supabase.from('favorites').upsert({ user_id: user.id, card_id: id });
      // } else {
      //   await supabase.from('favorites').delete().eq('user_id', user.id).eq('card_id', id);
      // }
    },
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: CardItem }) => (
      <CardTile item={item} cardWidth={cardW} onPress={() => {}} onToggleFav={toggleFav} />
    ),
    [cardW, toggleFav]
  );

  const elementKeys: (ElementKey | "Tous")[] = useMemo(
    () => ["Tous", ...Object.keys(ELEMENT_META)] as (ElementKey | "Tous")[],
    []
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Ma collection</Text>
          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {filtered ? `${filtered.length}` : "…"}
            </Text>
          </View>
        </View>

        {/* Recherche + filtre Favoris */}
        <View style={styles.searchBar}>
          <Search size={18} color={MUTED} />
          <TextInput
            placeholder="Rechercher un nom…"
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <Pressable
            onPress={() => setOnlyFav((v) => !v)}
            hitSlop={10}
            style={styles.favToggle}
          >
            <Star
              size={18}
              color={onlyFav ? "#facc15" : "#94a3b8"}
              fill={onlyFav ? "#facc15" : "transparent"}
            />
            <Text style={[styles.favToggleText, { color: onlyFav ? TEXT : MUTED }]}>
              Favoris
            </Text>
          </Pressable>
        </View>

        {/* Filtres élément */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2 }}
          style={{ marginTop: 10 }}
        >
          {elementKeys.map((key) => {
            const active = activeEl === key;
            const tint =
              key === "Tous"
                ? "#6ee7b7"
                : ELEMENT_META[key as ElementKey].tint;
            const Icon =
              key === "Tous" ? Grid3x3 : ELEMENT_META[key as ElementKey].Icon;
            return (
              <Pressable
                key={String(key)}
                onPress={() => setActiveEl(key as any)}
                style={[
                  styles.filterPill,
                  {
                    borderColor: active ? tint : BORDER,
                    backgroundColor: CARD_BG,
                  },
                ]}
              >
                <Icon size={14} color={tint} />
                <Text
                  style={[
                    styles.filterText,
                    { color: active ? TEXT : MUTED, marginLeft: 6 },
                  ]}
                >
                  {String(key)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Tri */}
        <View style={styles.sortRow}>
          {(["Recents", "Nom", "Rareté"] as const).map((opt) => (
            <Chip
              key={opt}
              label={opt === "Recents" ? "Récents" : opt}
              active={sort === opt}
              onPress={() => setSort(opt)}
            />
          ))}
        </View>
      </View>

      {/* Grille */}
      {filtered && filtered.length === 0 ? (
        <EmptyState onOpenShop={() => navigation?.navigate?.("Shop")} />
      ) : (
        <FlatList
          data={
            filtered ??
            Array.from({ length: numColumns * 4 }).map((_, i) => ({
              id: `s-${i}`,
              skeleton: true,
            })) as any
          }
          key={numColumns}
          keyExtractor={(item: any) => item.id}
          renderItem={(p: any) =>
            p.item.skeleton ? (
              <CardSkeleton cardWidth={cardW} />
            ) : (
              renderItem(p)
            )
          }
          numColumns={numColumns}
          columnWrapperStyle={
            numColumns > 1
              ? { gap: COL_GAP, alignItems: "flex-start" }
              : undefined
          }
          contentContainerStyle={{ padding: H_PADDING }}
          refreshControl={
            <RefreshControl
              tintColor={TEXT}
              colors={[TEXT]}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          onEndReachedThreshold={0.25}
          onEndReached={onEndReached}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ color: MUTED, fontSize: 12 }}>Chargement…</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

/* ---------- Styles ---------- */
const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  header: { paddingTop: 8, paddingHorizontal: 14, paddingBottom: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { color: TEXT, fontSize: 20, fontWeight: "700", letterSpacing: 0.2 },
  counter: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  counterText: { color: MUTED, fontSize: 12, fontWeight: "600" },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: {
    flex: 1,
    color: TEXT,
    fontSize: 14,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
  },
  favToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "transparent",
  },
  favToggleText: { fontSize: 12, fontWeight: "700" },

  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    marginBottom: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: "600" },

  filterPill: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    flexDirection: "row",
    marginRight: 8,
  },
  filterText: { fontSize: 12, fontWeight: "600" },

  card: {
    backgroundColor: CARD_BG,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  thumbWrap: {
    width: "100%",
    aspectRatio: CARD_ASPECT,
    backgroundColor: "#0f172a",
  },
  thumb: { width: "100%", height: "100%" },
  thumbOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "36%",
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  // badge générique (rareté & élément)
  badge: {
    position: "absolute",
    top: 8,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(5,10,20,0.75)",
    alignItems: "center",
    flexDirection: "row",
  },
  badgeText: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 999, marginRight: 6 },

  // bouton favori sur la vignette
  favBtn: {
    position: "absolute",
    right: 10,
    bottom: 10,
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,10,20,0.75)",
    borderWidth: 1,
    borderColor: BORDER,
  },

  meta: { padding: 10 },
  username: {
    color: TEXT,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  metaSub: { color: MUTED, marginTop: 2, fontSize: 11 },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  emptyTitle: { color: TEXT, fontSize: 20, fontWeight: "800" },
  emptyDesc: { color: MUTED, fontSize: 13, marginBottom: 8 },
  cta: {
    marginTop: 4,
    backgroundColor: "#6ee7b7",
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  ctaText: {
    color: "#0b0f19",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
