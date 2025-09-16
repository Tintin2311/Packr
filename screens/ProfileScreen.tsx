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
  Image as RNImage,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { supabase } from "../SupabaseClient";
import ProfileCard from "../card/cards/ProfileCard";
import PhotoCropModal, { CropState } from "../overlay/PhotoCropModal";

/* ================== Constantes ================== */
const CARD_CREATION_ROUTE = "CardCreationScreen";
const PHOTO_TOUCH_INSET = { top: 6, right: 10, bottom: 10, left: 10 };

const STORAGE_BUCKET = "images";
const STORAGE_DIR = "profiles";

/** 👉 Taille de la fenêtre de recadrage (doit matcher la zone photo de ta carte) */
const FRAME_W = 280;
const FRAME_H = 280; // mets une autre valeur si ta fenêtre n'est pas carrée

/* ================== Types ================== */
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

/* ================== Helpers ================== */
function devineTypeContenu(uri: string) {
  const lower = uri.split("?")[0].toLowerCase();
  const m = lower.match(/\.([a-z0-9]+)$/);
  const ext = m?.[1] ?? "";
  switch (ext) {
    case "jpg":
    case "jpeg":
      return { mime: "image/jpeg", ext: "jpg" };
    case "png":
      return { mime: "image/png", ext: "png" };
    case "webp":
      return { mime: "image/webp", ext: "webp" };
    case "heic":
      return { mime: "image/heic", ext: "heic" };
    case "heif":
      return { mime: "image/heif", ext: "heif" };
    default:
      return { mime: "image/jpeg", ext: "jpg" };
  }
}

/** URI image -> ArrayBuffer (web + iOS/Android), sans Blob. */
async function arrayBufferDepuisUri(uri: string, contentType: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") {
    const res = await fetch(uri);
    if (!res.ok) throw new Error("Impossible de lire l’image (web).");
    return await res.arrayBuffer();
  }
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });
  const dataUrl = `data:${contentType};base64,${b64}`;
  const res = await fetch(dataUrl);
  if (!res.ok) throw new Error("Impossible de lire l’image (natif).");
  return await res.arrayBuffer();
}

/* ================== Écran ================== */
export default function ProfileScreen() {
  const nav = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DBProfile | null>(null);

  // Preview (locale) & états de workflow
  const [previewUri, setPreviewUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  // Recadrage (modal)
  const [cropVisible, setCropVisible] = useState(false);
  const [pickedUri, setPickedUri] = useState<string | null>(null);

  /* ---- Charger le profil ---- */
  const chargerProfil = useCallback(async () => {
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
      setPreviewUri(undefined);
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
      chargerProfil();
    }, [chargerProfil])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await chargerProfil();
    setRefreshing(false);
  }, [chargerProfil]);

  /* ---- Upload vers Supabase Storage ---- */
  const uploaderAvatarSiBesoin = useCallback(async (uri?: string) => {
    if (!uri) return null;
    if (/^https?:\/\//i.test(uri)) return uri; // déjà hébergée

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) throw authErr;
    if (!user?.id) throw new Error("Utilisateur non authentifié.");

    const { mime: contentType, ext } = devineTypeContenu(uri);
    const fileName = `profile_${Date.now()}.${ext}`;
    const path = `${user.id}/${STORAGE_DIR}/${fileName}`;

    const buffer = await arrayBufferDepuisUri(uri, contentType);

    const { error: upErr } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, { contentType, upsert: true });
    if (upErr) throw upErr;

    const pub = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data?.publicUrl;
    const { data: signed } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    return signed?.signedUrl ?? pub ?? null;
  }, []);

  /* ---- Choisir une photo → ouvrir le modal de recadrage ---- */
  const choisirPhoto = useCallback(async () => {
    try {
      if (saving) return;
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Autorise l’accès à la galerie pour choisir une photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          (ImagePicker as any).MediaType?.Images ??
          ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      setPickedUri(res.assets[0].uri);
      setCropVisible(true); // → l’utilisateur recadre, puis on valide
    } catch {
      Alert.alert("Oups", "Impossible de sélectionner l’image.");
    }
  }, [saving]);

  /* ---- Appliquer le crop venant du modal ---- */
  async function appliquerCropEtSauver(srcUri: string, crop: CropState) {
    // 1) Obtenir la taille d’origine de l’image
    const { width: imgW, height: imgH } = await new Promise<{ width: number; height: number }>((resolve) => {
      RNImage.getSize(srcUri, (w, h) => resolve({ width: w, height: h }), () => resolve({ width: 1000, height: 1000 }));
    });

    const s = crop.scale;
    const tx = crop.translateX;
    const ty = crop.translateY;

    const displayW = imgW * s;
    const displayH = imgH * s;

    // Formules alignées avec ton modal (voir transform dans PhotoCropModal)
    // T = tx + (FRAME_W - displayW)/2, left visible = -T
    const originX = Math.max(0, Math.min(
      imgW - 1,
      Math.round(((displayW - FRAME_W) / 2 - tx) / s)
    ));
    const originY = Math.max(0, Math.min(
      imgH - 1,
      Math.round(((displayH - FRAME_H) / 2 - ty) / s)
    ));

    const cropWsrc = Math.round(FRAME_W / s);
    const cropHsrc = Math.round(FRAME_H / s);

    const width = Math.max(1, Math.min(imgW - originX, cropWsrc));
    const height = Math.max(1, Math.min(imgH - originY, cropHsrc));

    // 2) Générer l’image recadrée localement
    const result = await ImageManipulator.manipulateAsync(
      srcUri,
      [{ crop: { originX, originY, width, height } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 3) Preview immédiate + upload + update DB
    const ancienneUrl = profile?.photo_url ?? undefined;
    setPreviewUri(result.uri);
    setSaving(true);

    try {
      const uploadedUrl = await uploaderAvatarSiBesoin(result.uri);
      if (!uploadedUrl) throw new Error("Upload échoué (bucket/policies).");

      const { data, error: dbErr } = await supabase
        .from("profiles")
        .update({ photo_url: uploadedUrl })
        .eq("id", profile!.id)
        .select()
        .single();
      if (dbErr) throw dbErr;

      setProfile(data as DBProfile);
      setPreviewUri(undefined);
      Alert.alert("Profil mis à jour", "Photo recadrée enregistrée ✅");
    } catch (e: any) {
      setPreviewUri(undefined);
      if (ancienneUrl && profile) setProfile({ ...profile, photo_url: ancienneUrl });
      Alert.alert("Oups", e?.message ?? "Échec de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  /* ---- UI ---- */
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
        <Pressable onPress={chargerProfil} style={[styles.primaryBtn, { marginTop: 12 }]}>
          <Text style={styles.primaryBtnText}>Réessayer</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!profile || !profile.onboarding_completed) {
    return (
      <SafeAreaView style={[styles.fill, styles.center, { padding: 24 }]}>
        <Text style={styles.titleLarge}>Crée ta carte</Text>
        <Text style={styles.muted}>Ta carte apparaîtra ici une fois validée ✅</Text>
        <Pressable onPress={() => nav.navigate(CARD_CREATION_ROUTE)} style={styles.primaryBtn}>
          <Text style={styles.primaryBtnText}>Créer ma carte</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const cardProps = {
    element: (profile.element ?? "Feu") as any,
    rarity: (profile.rarity ?? "bronze") as any,
    avatarUrl: (previewUri ?? profile.photo_url) ?? undefined,
    displayName: profile.username ?? "Moi",
    age: profile.age ?? undefined,
    city: profile.city ?? undefined,
    description: profile.description ?? undefined,
    onPhotoPress: choisirPhoto, // ← tap = sélectionner -> recadrer (modal) -> enregistrer auto
    touchInset: PHOTO_TOUCH_INSET,
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

        <View style={{ alignItems: "center", marginTop: 6 }}>
          <View style={{ width: 320 }}>
            <ProfileCard {...cardProps} />
          </View>

          {saving && (
            <View style={{ marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.muted}>Enregistrement…</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ------ Modal de recadrage ------ */}
      <PhotoCropModal
        visible={cropVisible && !!pickedUri}
        onClose={() => { setCropVisible(false); setPickedUri(null); }}
        onConfirm={async (state: CropState) => {
          const src = pickedUri!;
          setCropVisible(false);
          setPickedUri(null);
          await appliquerCropEtSauver(src, state);
        }}
        imageUri={pickedUri ?? ""}
        frameWidth={FRAME_W}
        frameHeight={FRAME_H}
        frameBorderRadius={12}
        showGrid
      />
    </SafeAreaView>
  );
}

/* ================== Styles ================== */
const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0a0f14" },
  center: { alignItems: "center", justifyContent: "center" },
  muted: { color: "rgba(255,255,255,0.7)", marginTop: 8 },
  error: { color: "#ffd5d5", textAlign: "center" },

  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  titleLarge: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 8 },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#4A90E2",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
});
