// AuthScreenRecuperation.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "./SupabaseClient";
import AuthReturnOverlay from "./AuthReturnOverlay";

/* ========================= Types ========================= */
type Booster = {
  id: "signin" | "signup" | "reset";
  name: string;
  subtitle: string;
  gradient: [string, string];
  glow: string;
  rarity?: "COMMON" | "RARE" | "EPIC";
  count?: string;
};

type Props = {
  onBack: () => void;
  pack: Booster; // reçu depuis AuthScreen
};

/* ========================= Composant ========================= */
export default function AuthScreenRecuperation({ onBack, pack }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Overlay retour
  const [showReturnOverlay, setShowReturnOverlay] = useState(false);

  const redirectTo =
    Platform.OS === "web"
      ? (typeof window !== "undefined" ? `${window.location.origin}/auth-callback` : "/auth-callback")
      : Linking.createURL("/auth-callback");

  async function submit() {
    setNotice(null);
    setErrorMsg(null);
    if (!email) {
      setErrorMsg("Merci de saisir ton e-mail.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      setNotice(`Un e-mail de réinitialisation a été envoyé à ${email}.`);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Impossible d'envoyer l'e-mail de réinitialisation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      {/* bouton Accueil (ouvre overlay) */}
      <View style={{ alignSelf: "stretch", marginBottom: 8 }}>
        <Pressable
          onPress={() => setShowReturnOverlay(true)}
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "#233055",
          }}
        >
          <Text style={{ color: "#9fb0d9", fontWeight: "700" }}>← Accueil</Text>
        </Pressable>
      </View>

      {/* carte formulaire */}
      <View
        style={[
          styles.form,
          { borderColor: String(pack.glow) + "66", backgroundColor: "rgba(255,255,255,0.03)" },
        ]}
      >
        <TextInput
          placeholder="Ton adresse e-mail"
          placeholderTextColor="#8892a6"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={[styles.input]}
        />

        <Pressable
          style={[styles.btn, { backgroundColor: pack.gradient[0] as string }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer l’e-mail de reset</Text>}
        </Pressable>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        {/* Lien retour (ouvre overlay) */}
        <Pressable onPress={() => setShowReturnOverlay(true)} style={{ marginTop: 12 }}>
          <Text style={{ color: "#9fb0d9", textAlign: "center" }}>← Choisir un autre pack</Text>
        </Pressable>
      </View>

      {/* Overlay retour */}
      <AuthReturnOverlay
        visible={showReturnOverlay}
        gradient={pack.gradient}
        onCancel={() => setShowReturnOverlay(false)}
        onConfirm={() => {
          setShowReturnOverlay(false);
          onBack();
        }}
      />
    </View>
  );
}

/* ========================= Styles ========================= */
const styles = StyleSheet.create({
  form: {
    width: 368,
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
  },

  wrap: {
    padding: 24,
    alignItems: "center",
    minHeight: Platform.OS === "web" ? ("100vh" as unknown as number) : undefined,
  },

  input: {
    backgroundColor: "#101729",
    color: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#233055",
    marginBottom: 10,
  },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnText: { color: "white", fontWeight: "800" },

  notice: {
    color: "#C7F0FF",
    backgroundColor: "rgba(80,200,255,0.12)",
    borderColor: "rgba(80,200,255,0.45)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    textAlign: "center",
  },
  error: {
    color: "#FFD5D5",
    backgroundColor: "rgba(255,80,80,0.12)",
    borderColor: "rgba(255,80,80,0.45)",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    textAlign: "center",
  },
});
