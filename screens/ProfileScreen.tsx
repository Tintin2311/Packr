// screens/ProfileScreen.tsx
import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Pressable,
  SafeAreaView,
  Alert,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../SupabaseClient";
import ProfileCard from "../card/cards/ProfileCard";

const CARD_CREATION_ROUTE = "CardCreationScreen";

// --- Hitbox de la photo (si tu bouges la mise en page de ProfileCard, ajuste ici) ---
const CARD_W = 320;
const PADDING_INNER = 12;
const TOPBAR_H = 28;
const GAP_TOPBAR_TO_PHOTO = 10;
const PHOTO_TOP = PADDING_INNER + TOPBAR_H + GAP_TOPBAR_TO_PHOTO; // ~50px
const PHOTO_H = 220;

// --- Supabase Storage ---
const STORAGE_BUCKET = "images";
const STORAGE_DIR = "profiles";

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

export default function ProfileScreen() {
  const nav = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DBProfile | null>(null);

  // Preview avant enregistrement
  const [draftPhotoUrl, setDraftPhotoUrl] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setError(null);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        setError("Non authentifié");
        setProfile(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,onboarding_completed,element,description,photo_url,rarity,age,city,username"
        )
        .eq("id", uid)
        .single();

      if (error) throw error;
      setProfile(data as DBProfile);
      setDraftPhotoUrl(undefined); // reset preview locale
    } catch (e: any) {
      setError(e?.message ?? "Impossible de charger le profil");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProfile();
    }, [fetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  // --- Sélection image (preview immédiate) ---
  const selectPhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Autorise l’accès à la galerie pour choisir une photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        // (warning deprecation in console mais ça marche; tu peux passer au nouvel enum si tu veux)
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        setDraftPhotoUrl(res.assets[0].uri); // preview locale
      }
    } catch {
      Alert.alert("Oups", "Impossible de sélectionner l’image.");
    }
  }, []);

  // --- Upload vers Storage si nécessaire ---
  const uploadAvatarIfNeeded = useCallback(async (uri?: string) => {
    if (!uri) return null;
    if (/^https?:\/\//i.test(uri)) return uri; // déjà public (pas d'upload)

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return null;

      const res = await fetch(uri);
      const blob = await res.blob();
      const mime = blob.type || "image/jpeg";
      const ext = (mime.split("/")[1] ?? "jpg").replace("+xml", "").replace("+json", "");
      const path = `${STORAGE_DIR}/${userId}-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .upload(path, blob, { upsert: true, contentType: mime });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return pub.publicUrl ?? null;
    } catch (e) {
      console.warn("uploadAvatarIfNeeded error:", e);
      return null;
    }
  }, []);

  const hasPendingChange = !!draftPhotoUrl && draftPhotoUrl !== (profile?.photo_url ?? undefined);

  const onCancel = useCallback(() => {
    setDraftPhotoUrl(undefined);
  }, []);

  const onSave = useCallback(async () => {
    if (!profile || !hasPendingChange) return;
    setSaving(true);
    try {
      const uploaded = await uploadAvatarIfNeeded(draftPhotoUrl);
      if (!uploaded) throw new Error("Upload échoué (vérifie les policies du bucket).");

      const { error: dbErr, data } = await supabase
        .from("profiles")
        .update({ photo_url: uploaded })
        .eq("id", profile.id)
        .select()
      .single();

      if (dbErr) throw dbErr;

      setProfile(data as DBProfile);
      setDraftPhotoUrl(undefined);
      Alert.alert("Profil mis à jour", "Ta nouvelle photo est enregistrée.");
    } catch (e: any) {
      Alert.alert("Oups", e?.message ?? "Échec de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }, [profile, hasPendingChange, draftPhotoUrl, uploadAvatarIfNeeded]);

  // --- états UI ---
  if (loading) {
    return (
      <SafeAreaView style={[styles.fill, styles.center]}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.muted}>Chargement du profil…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { padding: 24 }]}>
        <Text style={styles.error}>{error}</Text>
        <Pressable onPress={fetchProfile} style={[styles.primaryBtn, { marginTop: 12 }]}>
          <Text style={styles.primaryBtnText}>Réessayer</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!profile || !profile.onboarding_completed) {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { padding: 24 }]}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
          Crée ta carte
        </Text>
        <Text style={styles.muted}>Ta carte apparaîtra ici une fois validée ✅</Text>
        <Pressable onPress={() => nav.navigate(CARD_CREATION_ROUTE)} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Créer ma carte</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  // Props passées à la carte (on passe bien la description pour l'afficher dans la zone)
  const cardProps = {
    element: (profile.element ?? "Feu") as any,
    rarity: (profile.rarity ?? "bronze") as any,
    avatarUrl: (draftPhotoUrl ?? profile.photo_url) ?? undefined,
    displayName: profile.username ?? "Moi",
    age: profile.age ?? undefined,
    city: profile.city ?? undefined,
    description: profile.description ?? undefined, // <<< IMPORTANT : affichage dans la carte
  } as any;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0f14" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mon profil</Text>
        </View>

        {/* Carte + overlay de clic pour la photo */}
        <View style={{ alignItems: "center", marginTop: 6 }}>
          <View style={{ width: CARD_W }}>
            <ProfileCard {...cardProps} />
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              <Pressable
                onPress={selectPhoto}
                style={{
                  position: "absolute",
                  top: PHOTO_TOP,
                  left: PADDING_INNER,
                  right: PADDING_INNER,
                  height: PHOTO_H,
                }}
                android_ripple={
                  Platform.OS === "android" ? { color: "rgba(255,255,255,0.08)" } : undefined
                }
              />
            </View>
          </View>
        </View>

        {/* Boutons Annuler / Enregistrer (uniquement si une nouvelle photo est sélectionnée) */}
        {hasPendingChange && (
          <View style={styles.actionsRow}>
            <Pressable onPress={onCancel} style={[styles.btn, styles.btnCancel]}>
              <Text style={styles.btnTxt}>Annuler</Text>
            </Pressable>
            <Pressable
              onPress={saving ? undefined : onSave}
              style={[styles.btn, styles.btnSave, saving && { opacity: 0.6 }]}
            >
              <Text style={styles.btnTxt}>{saving ? "Enregistrement…" : "Enregistrer"}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- styles ---------------- */
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0a0f14" },
  center: { alignItems: "center", justifyContent: "center" },
  muted: { color: "rgba(255,255,255,0.7)", marginTop: 8 },
  error: { color: "#ffd5d5", textAlign: "center" },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#4A90E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  actionsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnCancel: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
  btnSave: {
    backgroundColor: "#16a34a",
  },
  btnTxt: { color: "#fff", fontWeight: "800" },
});
