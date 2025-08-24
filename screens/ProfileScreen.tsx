// screens/ProfileScreen.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../SupabaseClient";
import { prefixFor, emojiFor } from "../card/theme";

// --- types côté app (miroir de la table `profiles`)
type DBProfile = {
  id: string;
  onboarding_completed: boolean | null;
  element: string | null;
  description: string | null;
  photo_url: string | null;
  rarity: "bronze" | "argent" | "or" | "diamant" | "legend" | null;
  age: number | null;
  city: string | null;
  username: string | null;
};

// --- couleurs de rareté (utilisées pour bordure carte + cadre photo)
const RARITY = {
  bronze: { label: "BRONZE", start: "#7c4a1f", end: "#b0793a" },
  argent: { label: "ARGENT", start: "#9aa4b2", end: "#e4ecf7" },
  or: { label: "OR", start: "#f6c76f", end: "#f0b33a" },
  diamant: { label: "DIAMANT", start: "#a8e4ff", end: "#9ad1ff" },
  legend: { label: "LÉGENDAIRE", start: "#ff1f3a", end: "#ff7648" },
} as const;

function useMyProfile() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<DBProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          setError("Non authentifié");
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id,onboarding_completed,element,description,photo_url,rarity,age,city,username"
          )
          .eq("id", auth.user.id)
          .single();
        if (error) throw error;
        if (mounted) setProfile(data as DBProfile);
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Impossible de charger le profil");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { loading, profile, error, setProfile };
}

export default function ProfileScreen() {
  const nav = useNavigation<any>();
  const { loading, profile, error } = useMyProfile();

  if (loading) {
    return (
      <View style={[styles.fill, styles.center]}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.muted}>Chargement du profil…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.fill, styles.center]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // Pas encore de carte => CTA vers création
  if (!profile || !profile.onboarding_completed) {
    return (
      <View style={[styles.fill, styles.center, { padding: 24 }]}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Crée ta carte
        </Text>
        <Text style={styles.muted}>Ta carte apparaîtra ici une fois validée ✅</Text>
        <Pressable
          onPress={() => nav.navigate("CardCreate")}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Créer ma carte</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0a0f14" }} contentContainerStyle={{ padding: 16 }}>
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 12 }}>
        Mon profil
      </Text>
      <ProfileCardView profile={profile} />
    </ScrollView>
  );
}

function ProfileCardView({ profile }: { profile: DBProfile }) {
  const rarityKey = (profile.rarity ?? "bronze") as keyof typeof RARITY;
  const r = RARITY[rarityKey];
  const element = profile.element ?? "Feu";
  const locked = prefixFor(element);
  const fullText = locked + (profile.description ?? "…");
  const badge = `${emojiFor(element)} ${element}`;

  return (
    <View style={styles.cardWrap}>
      {/* Bordure de carte = gradient selon rareté */}
      <LinearGradient colors={[r.start, r.end]} style={styles.cardBorder}>
        <View style={styles.cardInner}>
          {/* Barre du haut */}
          <View style={styles.topBar}>
            <LinearGradient
              colors={[r.start, r.end]}
              style={styles.rarityPill}
            >
              <Text style={styles.rarityText}>{r.label}</Text>
            </LinearGradient>

            <View style={styles.elementPill}>
              <Text style={styles.elementText}>{badge}</Text>
            </View>
          </View>

          {/* Photo avec cadre rareté */}
          <LinearGradient colors={[r.start, r.end]} style={styles.photoBorder}>
            {profile.photo_url ? (
              <Image
                source={{ uri: profile.photo_url }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.center]}>
                <Text style={styles.muted}>Aucune photo</Text>
              </View>
            )}
          </LinearGradient>

          {/* Nom + ville */}
          <Text style={styles.nameLine}>
            {(profile.username ?? "Moi").toUpperCase()}
            {profile.age ? `, ${profile.age}` : ""} {profile.city ? `— ${profile.city}` : ""}
          </Text>

          {/* Phrase verrouillée + complément */}
          <View style={styles.textBox}>
            <Text style={styles.lockedPrefix}>
              {locked}
              <Text style={styles.freeText}>
                {profile.description ?? "…"}
              </Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0a0f14" },
  center: { alignItems: "center", justifyContent: "center" },
  muted: { color: "rgba(255,255,255,0.7)", marginTop: 8 },
  error: { color: "#ffd5d5" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#4A90E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  cardWrap: { alignSelf: "center" },
  cardBorder: {
    borderRadius: 18,
    padding: 2,
    width: 320,
  },
  cardInner: {
    borderRadius: 16,
    backgroundColor: "#0e141b",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  rarityPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  elementPill: {
    marginLeft: "auto",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  elementText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  photoBorder: {
    borderRadius: 12,
    padding: 2,
    height: 220,
    marginBottom: 10,
  },
  photo: {
    flex: 1,
    borderRadius: 10,
    resizeMode: "cover",
  },

  nameLine: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },

  textBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 10,
  },
  lockedPrefix: { color: "#fff", fontSize: 13, lineHeight: 18, fontWeight: "700" },
  freeText: { fontWeight: "400" },
});
