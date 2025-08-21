// App.tsx
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { supabase } from "./SupabaseClient";

import AuthScreen from "./AuthScreen";
import AccueilConnected from "./screens/AccueilConnected";
import ResetPasswordScreen from "./ResetPasswordScreen";

export default function App() {
  const [session, setSession] = useState<ReturnType<typeof supabase.auth.getSession> | any>(null);
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

    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess ?? null);
      if (event === "PASSWORD_RECOVERY") setNeedsReset(true);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {!booted ? (
        // petit loader le temps d'initialiser la session
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0f14" }}>
          <ActivityIndicator />
        </View>
      ) : needsReset ? (
        <ResetPasswordScreen onDone={() => setNeedsReset(false)} />
      ) : session ? (
        <AccueilConnected />
      ) : (
        <AuthScreen />
      )}
    </SafeAreaProvider>
  );
}
