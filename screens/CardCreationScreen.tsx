// screens/CardCreationScreen.tsx
import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert } from "react-native";
import { supabase } from "../SupabaseClient";

// Ton builder minimal RN (celui qu’on a généré dans card/)
import CardBuilder from "../card/builder/CardBuilder";

export default function CardCreationScreen({ navigation }: any) {
  const [saving, setSaving] = useState(false);

  async function saveProfile() {
    try {
      setSaving(true);

      // Récupère l’utilisateur
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("Non authentifié");

      // ⚠️ À ce stade, branche tes vraies valeurs (élément, texte, photo, etc.)
      // Ici je mets des valeurs de démo pour valider le flux.
      const row = {
        id: user.id,                  // IMPORTANT: = auth.uid()
        onboarding_completed: true,   // on termine l’onboarding ici
        element: "Feu",
        description: "Le feu me correspond car je suis passionné(e) et j’aime les défis.",
        photo_url: null,
        rarity: "bronze",
        age: null,
        city: null,
        username: null,
      };

      // upsert par PK id
      const { error } = await supabase.from("profiles").upsert(row, { onConflict: "id" });
      if (error) throw error;

      // On remplace la stack par Home
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e: any) {
      Alert.alert("Erreur", e?.message ?? "Impossible d’enregistrer le profil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0f14", padding: 16 }}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <CardBuilder />
      </View>

      <Pressable
        onPress={saveProfile}
        disabled={saving}
        style={{
          marginTop: 12,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: "center",
          backgroundColor: saving ? "rgba(255,255,255,0.2)" : "#4A90E2",
        }}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800" }}>Valider ma carte</Text>}
      </Pressable>

      <Text style={{ color: "#9fb0d9", textAlign: "center", marginTop: 8, fontSize: 12 }}>
        Tu dois valider pour continuer.
      </Text>
    </View>
  );
}
