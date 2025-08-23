// App.tsx
import "react-native-gesture-handler";

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme, type Theme } from "@react-navigation/native";
import { supabase } from "./SupabaseClient";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

import AuthScreen from "./AuthScreen";
import ResetPasswordScreen from "./ResetPasswordScreen";
import AppTabs from "./navigation/AppTabs";
import SettingsOverlayProvider from "./overlay/SettingsOverlay";
import LikesOverlayProvider from "./overlay/LikesOverlay"; // <- nouveau

const DarkTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0a0f14",
    card: "#0a0f14",
    border: "rgba(255,255,255,0.12)",
    primary: "#ffffff",
    text: "#ffffff",
    notification: "#ffffff",
  },
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [needsReset, setNeedsReset] = useState(false);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setBooted(true);
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, sess) => {
        setSession(sess ?? null);
        if (event === "PASSWORD_RECOVERY") setNeedsReset(true);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {!booted ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0f14" }}>
          <ActivityIndicator />
        </View>
      ) : needsReset ? (
        <ResetPasswordScreen onDone={() => setNeedsReset(false)} />
      ) : session ? (
        <NavigationContainer theme={DarkTheme}>
          {/* Les deux calques flottants au-dessus de toutes les pages */}
          <SettingsOverlayProvider>
            <LikesOverlayProvider>
              <AppTabs />
            </LikesOverlayProvider>
          </SettingsOverlayProvider>
        </NavigationContainer>
      ) : (
        <AuthScreen />
      )}
    </SafeAreaProvider>
  );
}
