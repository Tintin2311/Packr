// App.tsx
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View, Platform } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

/* Supabase */
import { supabase } from "./SupabaseClient";
import type { Session } from "@supabase/supabase-js";

/* Navigation */
import AppTabs from "./navigation/AppTabs"; // <- ta tabbar (Home, etc.)

/* Écrans */
import AuthScreen from "./AuthScreen";
import AccueilConnected from "./screens/AccueilConnected"; // (utilisé dans AppTabs normalement)
import CardCreationScreen from "./card/builder/CardBuilder"; // création de carte

/* Overlays (coeur/paramètres) */
import LikesOverlayProvider from "./overlay/LikesOverlay";
import SettingsOverlayProvider from "./overlay/SettingsOverlay";

/* ---------- Stack ---------- */
const Stack = createNativeStackNavigator();

/* ---------- Thème nav (sobre, fond sombre) ---------- */
const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0a0f14",
    card: "#0a0f14",
    text: "#fff",
    border: "rgba(255,255,255,0.12)",
  },
};

/* ---------- Linking (web) ---------- */
const linking = {
  prefixes: [Linking.createURL("/"), "http://localhost:8081"],
  config: {
    screens: {
      Auth: "auth",
      CardCreate: "create-card",
      RootTabs: "home",
    },
  },
};

/* Petit composant de chargement plein écran */
function FullscreenLoader() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0a0f14",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color="#9fb0d9" />
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // 1) Récupère la session au démarrage + écoute les changements
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session ?? null);
      setChecking(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, []);

  // 2) Quand on est connecté, on lit le flag onboarding
  useEffect(() => {
    let cancelled = false;

    async function fetchOnboarding() {
      if (!session?.user) {
        setOnboarded(null);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // En cas d’erreur, on considère non onboardé pour forcer le flow
        setOnboarded(false);
      } else if (data) {
        setOnboarded(!!data.onboarding_completed);
      } else {
        // pas de ligne → pas onboardé
        setOnboarded(false);
      }
    }

    fetchOnboarding();
    // on ré-agit si la session change
  }, [session?.user?.id]);

  // 3) Choix du flux
  const content = useMemo(() => {
    // Toujours afficher un loader le temps de lire la session initiale
    if (checking) return <FullscreenLoader />;

    // Non connecté → Auth stack
    if (!session) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Navigator>
      );
    }

    // Connecté mais pas encore onboardé → stack dédiée
    if (onboarded === false) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="CardCreate"
            component={CardCreationScreen}
            options={{ presentation: "card" }}
          />
        </Stack.Navigator>
      );
    }

    // Connecté & onboardé → stack principale avec la TABBAR
    if (onboarded === true) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* IMPORTANT: on monte AppTabs ici → la tabbar est visible */}
          <Stack.Screen name="RootTabs" component={AppTabs} />
          {/* Si tu veux accéder à Home directement en stack aussi */}
          <Stack.Screen name="Home" component={AccueilConnected} />
        </Stack.Navigator>
      );
    }

    // état intermédiaire (lecture du flag)
    return <FullscreenLoader />;
  }, [checking, session, onboarded]);

  return (
    <SafeAreaProvider>
      <SettingsOverlayProvider>
        <LikesOverlayProvider>
          <NavigationContainer theme={navTheme} linking={linking}>
            <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
            {content}
          </NavigationContainer>
        </LikesOverlayProvider>
      </SettingsOverlayProvider>
    </SafeAreaProvider>
  );
}
