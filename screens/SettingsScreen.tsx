// screens/SettingsScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut } from "lucide-react-native";
import { supabase } from "../SupabaseClient";

export default function SettingsScreen() {
  const onSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "local" });
      // App.tsx détecte session=null => retour automatique sur AuthScreen
    } catch (e: any) {
      Alert.alert("Déconnexion", e?.message ?? "Impossible de se déconnecter.");
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Paramètres</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <Pressable onPress={onSignOut} style={styles.rowBtn}>
          <LogOut size={18} color="#fff" />
          <Text style={styles.rowBtnText}>Se déconnecter</Text>
        </Pressable>
      </View>

      <Text style={styles.note}>
        La déconnexion efface la session locale. Vous pourrez vous reconnecter plus tard.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f14", paddingHorizontal: 16, paddingTop: 12 },
  header: { marginBottom: 12 },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  section: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    padding: 12,
  },
  sectionTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  rowBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  rowBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  note: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 12 },
});
