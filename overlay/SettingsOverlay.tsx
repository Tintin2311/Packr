// overlay/SettingsOverlay.tsx
import React, { createContext, useContext, useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { Settings } from "lucide-react-native";
import { supabase } from "../SupabaseClient";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const OverlayCtx = createContext<Ctx | null>(null);
export const useSettingsOverlay = () => {
  const ctx = useContext(OverlayCtx);
  if (!ctx) throw new Error("useSettingsOverlay must be used inside SettingsOverlayProvider");
  return ctx;
};

type Props = { children: React.ReactNode; hideFloatingButton?: boolean };

const SettingsOverlayProvider: React.FC<Props> = ({ children, hideFloatingButton }) => {
  const [open, setOpen] = useState(false);

  return (
    <OverlayCtx.Provider value={{ open, setOpen }}>
      <View style={{ flex: 1 }}>
        {children}

        {!hideFloatingButton && (
          <Pressable
            testID="open-settings-overlay"
            accessibilityLabel="Ouvrir les paramètres"
            onPress={() => setOpen(true)}
            style={styles.fab}
          >
            <Settings size={18} color="#0a0f14" />
          </Pressable>
        )}

        {open && (
          <View style={styles.overlay} pointerEvents="auto">
            {/* Fermer en tapant à l'extérieur */}
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />

            {/* Panneau */}
            <SafeAreaView style={styles.panel}>
              <Text style={styles.title}>Paramètres</Text>

              <Pressable
                style={styles.row}
                onPress={async () => {
                  try {
                    await supabase.auth.signOut();
                  } finally {
                    setOpen(false);
                  }
                }}
              >
                <Text style={styles.rowTxt}>Se déconnecter</Text>
              </Pressable>

              <Pressable style={[styles.row, styles.rowSecondary]} onPress={() => setOpen(false)}>
                <Text style={styles.rowTxt}>Fermer</Text>
              </Pressable>
            </SafeAreaView>
          </View>
        )}
      </View>
    </OverlayCtx.Provider>
  );
};

export default SettingsOverlayProvider;

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 9999,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    opacity: 0.9,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
  },
  panel: {
    marginTop: 56,
    marginRight: 10,
    width: 260,
    borderRadius: 16,
    backgroundColor: "#0d141c",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 14,
  },
  title: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  row: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 8,
  },
  rowSecondary: { backgroundColor: "rgba(255,255,255,0.04)" },
  rowTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
