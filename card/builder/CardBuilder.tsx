// card/builder/CardBuilder.tsx
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
  SafeAreaView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import ProfileCard from "../cards/ProfileCard";
import { ELEMENTS, type ElementKey } from "../theme/elements";
import { type Rarity } from "../theme/rarity";
import { supabase } from "../../SupabaseClient";

/* ===== Layout ===== */
const { width: SCREEN_W } = Dimensions.get("window");
const MAX_CARD_W = 340;
const GUTTER = 16;
const V_PAD = 14;
const CARD_W = Math.min(SCREEN_W - GUTTER * 2, MAX_CARD_W);

/* ===== Helpers ===== */
function formatBirthdateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}
function computeAge(birthdate: string): number | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(birthdate);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = Number(dd), month = Number(mm) - 1, y = Number(yyyy);
  const date = new Date(y, month, d); if (isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - y;
  const hasHadBirthday = now.getMonth() > month || (now.getMonth() === month && now.getDate() >= d);
  if (!hasHadBirthday) age -= 1;
  return age;
}

/* ===== Types & const ===== */
type CardDraft = {
  element: ElementKey;
  rarity: Rarity;
  displayName: string;
  birthdate: string;
  age?: number;
  city?: string;
  avatarUrl?: string;
};
const DEFAULT_RARITY: Rarity = "bronze";
const STORAGE_BUCKET = "images";
const STORAGE_DIR = "profiles";

/* ===== Component ===== */
export default function CardBuilder({ onValidate }: { onValidate?: (card: CardDraft) => void; }) {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();

  const elementKeys = useMemo(() => Object.keys(ELEMENTS) as ElementKey[], []);
  const firstElement = useMemo<ElementKey>(() => elementKeys[0] ?? ("Feu" as ElementKey), [elementKeys]);

  const [element, setElement] = useState<ElementKey>(firstElement);
  const rarity = DEFAULT_RARITY;

  const [displayName, setDisplayName] = useState("Alex");
  const [birthdateInput, setBirthdateInput] = useState("");
  const age = useMemo(() => computeAge(birthdateInput), [birthdateInput]);

  const [city, setCity] = useState("Paris");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const pickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Autorise l’accès à la galerie pour choisir une photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes:
          (ImagePicker as any).MediaType?.Images ??
          ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.[0]?.uri) setAvatarUrl(res.assets[0].uri);
    } catch (e) {
      console.warn("pickImage error:", e);
      Alert.alert("Oups", "Impossible de sélectionner l’image.");
    }
  }, []);

  const uploadAvatarIfNeeded = useCallback(async (uri?: string) => {
    if (!uri) return null;
    if (/^https?:\/\//i.test(uri)) return uri;
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id; if (!userId) return null;
      const res = await fetch(uri); const blob = await res.blob();
      const mime = blob.type || "image/jpeg";
      const ext = (mime.split("/")[1] ?? "jpg").replace("+xml", "").replace("+json", "");
      const path = `${STORAGE_DIR}/${userId}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, blob, { upsert: true, contentType: mime });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      return pub.publicUrl ?? null;
    } catch (e) {
      console.warn("uploadAvatarIfNeeded error:", e);
      return null;
    }
  }, []);

  const handleValidate = useCallback(async () => {
    const name = displayName.trim();
    if (name.length < 2) { Alert.alert("Nom affiché", "Indique au moins 2 caractères."); return; }
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(birthdateInput) || age == null) {
      Alert.alert("Date de naissance", "Entre une date valide au format JJ/MM/AAAA."); return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id; if (!userId) { Alert.alert("Authentification", "Tu dois être connecté."); return; }
      const uploadedUrl = await uploadAvatarIfNeeded(avatarUrl);
      const payload: CardDraft = {
        element, rarity, displayName: name, birthdate: birthdateInput,
        age: age ?? undefined, city: city?.trim() || undefined,
        avatarUrl: uploadedUrl ?? undefined,
      };
      const { error: dbErr } = await supabase.from("profiles").upsert(
        {
          id: userId,
          onboarding_completed: true,
          element: payload.element,
          photo_url: payload.avatarUrl ?? null,
          rarity: payload.rarity,
          age: payload.age ?? null,
          city: payload.city ?? null,
          username: payload.displayName,
        },
        { onConflict: "id" }
      );
      if (dbErr) throw dbErr;
      onValidate?.(payload);
      (nav as any).navigate("AccueilConnected");
    } catch (e: any) {
      console.warn("handleValidate error:", e);
      Alert.alert("Oups", e?.message ?? "La création de carte a échoué.");
    } finally {
      setSaving(false);
    }
  }, [displayName, birthdateInput, age, element, rarity, city, avatarUrl, uploadAvatarIfNeeded, onValidate, nav]);

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: insets.top || 12 }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: (insets.bottom || 0) + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Aperçu */}
        <View style={styles.previewWrap}>
          <ProfileCard
            element={element}
            rarity={DEFAULT_RARITY}
            avatarUrl={avatarUrl}
            displayName={displayName}
            age={age ?? undefined}
            city={city}
            onPhotoPress={pickImage} // clic uniquement dans la zone rouge
            touchInset={{ top: 0, right: 0, bottom: 0, left: 0 }} // ajuste ici pour le builder
          />
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Profil</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Nom affiché</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ton prénom"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date de naissance</Text>
            <TextInput
              value={birthdateInput}
              onChangeText={(t) => setBirthdateInput(formatBirthdateInput(t))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
            />
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Âge (auto)</Text>
            <Text style={styles.readonly}>{age ?? "—"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Ville</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Ta ville"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.input}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Élément</Text>
          <View style={styles.choicesRow}>
            {(Object.keys(ELEMENTS) as ElementKey[]).map((k) => (
              <Pressable key={k} onPress={() => setElement(k)} style={[styles.choice, element === k && styles.choiceActive]}>
                <Text style={styles.choiceText}>{k}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Photo</Text>
          <Pressable onPress={pickImage} style={styles.pickBtn}>
            <Text style={styles.pickBtnText}>{avatarUrl ? "Changer la photo" : "Choisir une photo"}</Text>
          </Pressable>

          <Pressable onPress={saving ? undefined : handleValidate} style={[styles.validateBtn, saving && { opacity: 0.6 }]}>
            <Text style={styles.validateTxt}>{saving ? "Enregistrement…" : "Valider"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0f19" },

  previewWrap: {
    width: CARD_W,
    alignSelf: "center",
    marginTop: V_PAD,
    marginBottom: V_PAD,
  },

  form: { paddingHorizontal: GUTTER },

  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 8 },

  row: { marginBottom: 12 },

  label: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginBottom: 6 },

  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10, default: 10 }),
    color: "#fff",
    fontSize: 15,
  },

  readonly: { color: "#fff", fontSize: 15, paddingVertical: 2, opacity: 0.8 },

  choicesRow: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 },

  choice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "rgba(255,255,255,0.06)",
    margin: 4,
  },
  choiceActive: { backgroundColor: "rgba(59,130,246,0.22)", borderColor: "rgba(59,130,246,0.45)" },
  choiceText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  pickBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 6 },
  pickBtnText: { color: "#fff", fontWeight: "800", letterSpacing: 0.4 },

  validateBtn: { backgroundColor: "#16a34a", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 18 },
  validateTxt: { color: "#fff", fontWeight: "900", letterSpacing: 0.4, fontSize: 16 },
});
