// AuthScreen.tsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Alert,
  Platform,
  Dimensions,
  Modal,
  FlatList,
  type ColorValue,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { supabase } from "./SupabaseClient";
import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
import { Sparkles, BadgeCheck } from "lucide-react-native";

/* ========================= Types ========================= */
type Mode = "signin" | "signup";
type SelectedBooster = "signin" | "signup" | "reset" | null;
type AuthMethod = "email" | "phone";

type Booster = {
  id: "signin" | "signup" | "reset";
  name: string;
  subtitle: string;
  rarity: "COMMON" | "RARE" | "EPIC";
  gradient: [ColorValue, ColorValue];
  glow: string;
  count: string;
};

type Country = { name: string; iso2: string; dial: string; flag: string };

/* ========================= Données ========================= */
const BOOSTERS: Booster[] = [
  {
    id: "signin",
    name: "Pack Connexion",
    subtitle: "Retrouve ton profil",
    rarity: "COMMON",
    gradient: ["#0ea5e9", "#38bdf8"],
    glow: "#22d3ee",
    count: "5 cartes",
  },
  {
    id: "signup",
    name: "Pack Inscription",
    subtitle: "Commence l'aventure",
    rarity: "RARE",
    gradient: ["#7c3aed", "#a78bfa"],
    glow: "#a78bfa",
    count: "5 cartes",
  },
  {
    id: "reset",
    name: "Pack Récupération",
    subtitle: "Récupère ton accès",
    rarity: "EPIC",
    gradient: ["#f43f5e", "#fb7185"],
    glow: "#fda4af",
    count: "5 cartes",
  },
];

const COUNTRIES: Country[] = [
  { name: "France", iso2: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Belgique", iso2: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Suisse", iso2: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Canada", iso2: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "États-Unis", iso2: "US", dial: "+1", flag: "🇺🇸" },
  { name: "Royaume-Uni", iso2: "GB", dial: "+44", flag: "🇬🇧" },
];

/* ========================= Sizing ========================= */
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const ITEM_WIDTH = 270;
const ITEM_HEIGHT = 360;
const GAP = 18;
const CARD_FULL = ITEM_WIDTH + GAP;
const SIDE_PAD = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

/* util shadow */
const webOrNativeShadow = (color = "rgba(56,189,248,0.45)") =>
  Platform.select({
    web: ({ boxShadow: `0 18px 90px ${color}` } as any),
    default: {
      shadowColor: "#38bdf8",
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
  });

/* ========================= Composant ========================= */
export default function AuthScreen() {
  // step / mode
  const [mode, setMode] = useState<Mode>("signin");
  const [selected, setSelected] = useState<SelectedBooster>(null);
  const [opening, setOpening] = useState<SelectedBooster>(null);

  // auth method
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");

  // identifiers
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  // password
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // optional profile info
  const [username, setUsername] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [waitingForPhoneOtp, setWaitingForPhoneOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // messages
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // focus
  const [fUser, setFUser] = useState(false);
  const [fEmail, setFEmail] = useState(false);
  const [fPhone, setFPhone] = useState(false);
  const [fPwd, setFPwd] = useState(false);
  const [fPwd2, setFPwd2] = useState(false);
  const [fOtp, setFOtp] = useState(false);

  // open animation
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!opening) return;
    spin.setValue(0);
    const anim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [opening, spin]);

  // shimmer across cards
  const shimmerX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: 2400,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerX]);

  // carousel
  const data = useMemo(() => BOOSTERS, []);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<any>(null);

  // center on "signup"
  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToOffset({ offset: CARD_FULL * 1, animated: false }), 0);
    return () => clearTimeout(t);
  }, []);

  // reset forces email method
  useEffect(() => {
    if (selected === "reset" && authMethod !== "email") setAuthMethod("email");
  }, [selected, authMethod]);

  // clear messages when step/method changes
  useEffect(() => {
    setNotice(null);
    setErrorMsg(null);
    setWaitingForPhoneOtp(false);
    setOtpCode("");
  }, [selected, mode, authMethod]);

  // redirect
  const redirectTo =
    Platform.OS === "web"
      ? (typeof window !== "undefined" ? `${window.location.origin}/auth-callback` : "/auth-callback")
      : Linking.createURL("/auth-callback");

  const packForOverlay = BOOSTERS.find((b) => b.id === opening) ?? BOOSTERS[0];

  const handlePackClick = (id: SelectedBooster) => {
    setNotice(null);
    setErrorMsg(null);
    setWaitingForPhoneOtp(false);
    setOtpCode("");
    if (opening) return;
    setOpening(id);
    setTimeout(() => {
      setSelected(id);
      setMode(id === "signup" ? "signup" : "signin");
      setOpening(null);
    }, 600);
  };

  /* ========== Phone helpers ========== */
  const onChangePhoneLocal = (raw: string) => {
    const digitsOnly = raw.replace(/[^\d]/g, "");
    const formatter = new AsYouType(country.iso2 as any);
    const formatted = formatter.input(digitsOnly);
    setPhoneLocal(formatted);
  };

  const e164Phone = useMemo(() => {
    const digits = phoneLocal.replace(/[^\d]/g, "");
    if (!digits) return "";
    const parsed = parsePhoneNumberFromString(digits, country.iso2 as any);
    return parsed?.isValid() ? parsed.number : "";
  }, [phoneLocal, country]);

  const ensureSignupPasswordOK = () => {
    if (password.length < 8) {
      setErrorMsg("Le mot de passe doit contenir au moins 8 caractères.");
      return false;
    }
    if (password !== password2) {
      setErrorMsg("Les mots de passe ne correspondent pas.");
      return false;
    }
    return true;
  };

  /* ========== OAuth ========== */
  async function oauthSignIn(provider: "google" | "facebook") {
    try {
      setLoading(true);
      setErrorMsg(null);
      setNotice(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
      return data;
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Connexion OAuth impossible.");
    } finally {
      setLoading(false);
    }
  }

  /* ========== Submit (email/phone) ========== */
  const submit = async () => {
    setNotice(null);
    setErrorMsg(null);

    const idField = authMethod === "email" ? email : phoneLocal;
    if (!idField || (selected !== "reset" && !password)) {
      setErrorMsg("Merci de remplir les champs requis.");
      Alert.alert("Champs requis", "Merci de remplir les champs requis.");
      return;
    }
    if (authMethod === "phone" && !e164Phone) {
      setErrorMsg(`Numéro invalide pour ${country.name}.`);
      return;
    }
    if (mode === "signup" && !ensureSignupPasswordOK()) return;

    setLoading(true);
    try {
      if (selected === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        setNotice(`Un e-mail de réinitialisation a été envoyé à ${email}.`);
        return;
      }

      if (mode === "signup") {
        if (authMethod === "email") {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: username ? { username } : undefined },
          });
          if (error) throw error;
          if (data?.user && !data.session) setNotice(`Un e-mail de confirmation a été envoyé à ${email}.`);
          else setNotice("Compte créé et connecté !");
          setMode("signin");
          setSelected("signin");
          return;
        } else {
          const { error } = await supabase.auth.signUp({ phone: e164Phone, password });
          if (error) throw error;
          setWaitingForPhoneOtp(true);
          setNotice(`Un code SMS a été envoyé au ${e164Phone}.`);
          return;
        }
      }

      if (authMethod === "email") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setNotice("Connexion réussie !");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ phone: e164Phone, password });
        if (error) throw error;
        setNotice("Connexion réussie !");
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Action impossible pour le moment.");
      Alert.alert("Erreur", e?.message ?? "Action impossible pour le moment.");
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    setErrorMsg(null);
    setNotice(null);
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg("Merci de saisir le code reçu par SMS.");
      return;
    }
    if (!e164Phone) {
      setErrorMsg("Numéro invalide.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: e164Phone,
        token: otpCode.trim(),
        type: "sms",
      });
      if (error) throw error;
      setNotice("Téléphone vérifié ✅ Tu peux maintenant te connecter.");
      setMode("signin");
      setSelected("signin");
      setWaitingForPhoneOtp(false);
      setOtpCode("");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Code invalide. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  /* ========================= 1) Sélection des boosters ========================= */
  if (!selected) {
    const shimmerTranslate = shimmerX.interpolate({
      inputRange: [0, 1],
      outputRange: [-ITEM_WIDTH, ITEM_WIDTH],
    });

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0f14" }}>
        {/* Fond "aurora" */}
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={["#0a0f14", "#0d141c"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.blob, { top: -80, left: -60, transform: [{ rotate: "15deg" }] }]}>
            <LinearGradient colors={["#1d4ed8", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          </View>
          <View style={[styles.blob, { bottom: -90, right: -30, transform: [{ rotate: "-20deg" }] }]}>
            <LinearGradient colors={["#22c55e", "transparent"]} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }} style={StyleSheet.absoluteFill} />
          </View>
          <View style={[styles.blob, { top: 160, right: -60, transform: [{ rotate: "30deg" }] }]}>
            <LinearGradient colors={["#e11d48", "transparent"]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
          </View>
        </View>

        {/* Titre */}
        <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
          <Text style={styles.brand}>Packr</Text>
          <Text style={styles.brandSub}>Choisis ton booster de départ</Text>
        </View>

        {/* Carrousel */}
        <Animated.FlatList
          ref={listRef}
          data={data}
          keyExtractor={(it) => it.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_FULL}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={{ paddingHorizontal: SIDE_PAD, paddingTop: 18, paddingBottom: 30 }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => {
            const inputRange = [(index - 1) * CARD_FULL, index * CARD_FULL, (index + 1) * CARD_FULL];
            const scale = scrollX.interpolate({ inputRange, outputRange: [0.93, 1, 0.93], extrapolate: "clamp" });
            const translateY = scrollX.interpolate({ inputRange, outputRange: [8, 0, 8], extrapolate: "clamp" });

            return (
              <Animated.View style={{ width: CARD_FULL, alignItems: "center", transform: [{ scale }, { translateY }] }}>
                <Pressable disabled={!!opening} onPress={() => handlePackClick(item.id)}>
                  <View style={[{ borderRadius: 24 }, webOrNativeShadow(item.glow as string)]}>
                    {/* cadre dégradé */}
                    <LinearGradient colors={[String(item.gradient[0]), String(item.gradient[1])]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFrame}>
                      {/* carte interne */}
                      <View style={styles.cardInner}>
                        <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 6 }}>
                          <Sparkles size={20} color="#fff" />
                          <Text style={styles.cardTitle}>{item.name}</Text>
                          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>

                          {/* badge rareté */}
                          <View style={[styles.rarityBadge, rarityStyle(item.rarity)]}>
                            <BadgeCheck size={14} color="#0b0f14" />
                            <Text style={styles.rarityText}>{item.rarity}</Text>
                          </View>

                          {/* image décor (facultative) */}
                          <Image
                            source={{ uri: "https://images.unsplash.com/photo-1470167290877-7d5d3446de4c?q=80&w=800&auto=format&fit=crop" }}
                            style={styles.heroImg}
                          />
                        </View>

                        {/* compteur + shine animé */}
                        <View style={styles.countWrap}>
                          <Text style={styles.countText}>{item.count}</Text>
                        </View>
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.shine,
                            {
                              transform: [{ translateX: shimmerTranslate }],
                            },
                          ]}
                        >
                          <LinearGradient
                            colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                        </Animated.View>
                      </View>
                    </LinearGradient>
                  </View>
                </Pressable>
              </Animated.View>
            );
          }}
        />

        {/* Overlay d’ouverture */}
        {opening && (
          <View style={styles.openOverlay}>
            <Animated.View
              style={[
                styles.openCard,
                {
                  transform: [
                    { rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
                    { scale: 1.05 },
                  ],
                },
              ]}
            >
              <LinearGradient colors={packForOverlay.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.openCard} />
            </Animated.View>
            <ActivityIndicator size="large" color="#fff" style={{ marginTop: 16 }} />
            <Text style={{ color: "#fff", marginTop: 8 }}>Ouverture…</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  /* ========================= 2) Formulaire ========================= */
  const pack = BOOSTERS.find((b) => b.id === selected)!;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0f14" }}>
      <ScrollView contentContainerStyle={styles.center}>
        <Pressable onPress={() => setSelected(null)} style={{ alignSelf: "flex-start" }}>
          <Text style={{ color: "#9fb0d9", marginBottom: 12 }}>← Choisir un autre pack</Text>
        </Pressable>

        {/* mini header pack */}
        <View style={{ alignItems: "center", marginBottom: 14 }}>
          <LinearGradient colors={pack.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.miniCard} />
          <Text style={{ color: "white", fontSize: 20, fontWeight: "800", marginTop: 10 }}>{pack.name}</Text>
          <Text style={{ color: "#aab4cf" }}>Pack ouvert avec succès !</Text>
        </View>

        {/* carte formulaire */}
        <View style={[styles.form, { borderColor: String(pack.glow) + "66", backgroundColor: "rgba(255,255,255,0.03)" }]}>
          {/* OAuth */}
          <View style={{ gap: 10, marginBottom: 10 }}>
            <Pressable onPress={() => oauthSignIn("google")} style={[styles.oauthBtn, { backgroundColor: "#4285F4" }]} disabled={loading}>
              <Text style={styles.btnText}>Continuer avec Google</Text>
            </Pressable>
            <Pressable onPress={() => oauthSignIn("facebook")} style={[styles.oauthBtn, { backgroundColor: "#1877F2" }]} disabled={loading}>
              <Text style={styles.btnText}>Continuer avec Facebook</Text>
            </Pressable>
          </View>

          {/* perks */}
          <View style={styles.perksRow}>
            <Text style={styles.perkChip}>🎁 1 booster offert</Text>
            <Text style={styles.perkChip}>⚡ Connexion rapide</Text>
            <Text style={styles.perkChip}>🛡️ Sécurisé</Text>
          </View>

          {/* Diviseur */}
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerTxt}>ou</Text>
            <View style={styles.divider} />
          </View>

          {/* Switch Email / Phone */}
          <View style={styles.segment}>
            <Pressable onPress={() => setAuthMethod("email")} style={[styles.segmentBtn, authMethod === "email" && styles.segmentBtnActive]}>
              <Text style={[styles.segmentText, authMethod === "email" && styles.segmentTextActive]}>E-mail</Text>
            </Pressable>
            <Pressable
              onPress={() => (selected === "reset" ? null : setAuthMethod("phone"))}
              style={[styles.segmentBtn, authMethod === "phone" && styles.segmentBtnActive, selected === "reset" && { opacity: 0.5 }]}
            >
              <Text style={[styles.segmentText, authMethod === "phone" && styles.segmentTextActive]}>Téléphone</Text>
            </Pressable>
          </View>

          {selected === "reset" ? (
            <>
              <TextInput
                placeholder="Ton adresse e-mail"
                placeholderTextColor="#8892a6"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFEmail(true)}
                onBlur={() => setFEmail(false)}
                style={[styles.input, fEmail && { borderColor: pack.gradient[0] as string }]}
              />
              <Pressable style={[styles.btn, { backgroundColor: pack.gradient[0] as string }]} onPress={submit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer l’e-mail de reset</Text>}
              </Pressable>

              {notice ? <Text style={styles.notice}>{notice}</Text> : null}
              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
            </>
          ) : (
            <>
              {mode === "signup" && (
                <TextInput
                  placeholder="Nom d'utilisateur (optionnel)"
                  placeholderTextColor="#8892a6"
                  value={username}
                  onChangeText={setUsername}
                  onFocus={() => setFUser(true)}
                  onBlur={() => setFUser(false)}
                  style={[styles.input, fUser && { borderColor: pack.gradient[0] as string }]}
                />
              )}

              {authMethod === "email" ? (
                <TextInput
                  placeholder="Ton adresse e-mail"
                  placeholderTextColor="#8892a6"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFEmail(true)}
                  onBlur={() => setFEmail(false)}
                  style={[styles.input, fEmail && { borderColor: pack.gradient[0] as string }]}
                />
              ) : (
                <>
                  <View style={styles.row}>
                    <Pressable onPress={() => setShowCountryPicker(true)} style={[styles.countryBtn, { borderColor: pack.gradient[0] as string }]}>
                      <Text style={styles.countryFlag}>{country.flag}</Text>
                      <Text style={styles.countryDial}>{country.dial}</Text>
                    </Pressable>

                    <TextInput
                      placeholder="Numéro local (ex: 6 12 34 56 78)"
                      placeholderTextColor="#8892a6"
                      keyboardType="phone-pad"
                      value={phoneLocal}
                      onChangeText={onChangePhoneLocal}
                      onFocus={() => setFPhone(true)}
                      onBlur={() => setFPhone(false)}
                      style={[styles.input, { flex: 1, marginBottom: 0 }, fPhone && { borderColor: pack.gradient[0] as string }]}
                    />
                  </View>
                  <Text style={styles.helper}>Formaté: {phoneLocal || "—"} {"   "}E.164: {e164Phone || `${country.dial}…`}</Text>
                </>
              )}

              <TextInput
                placeholder="Ton mot de passe"
                placeholderTextColor="#8892a6"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFPwd(true)}
                onBlur={() => setFPwd(false)}
                style={[styles.input, fPwd && { borderColor: pack.gradient[0] as string }]}
              />

              {mode === "signup" && (
                <TextInput
                  placeholder="Confirmer le mot de passe"
                  placeholderTextColor="#8892a6"
                  secureTextEntry
                  value={password2}
                  onChangeText={setPassword2}
                  onFocus={() => setFPwd2(true)}
                  onBlur={() => setFPwd2(false)}
                  style={[styles.input, fPwd2 && { borderColor: pack.gradient[0] as string }]}
                />
              )}

              <Pressable style={[styles.btn, { backgroundColor: pack.gradient[0] as string }]} onPress={submit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{mode === "signup" ? "Créer mon profil" : "Accéder à mon profil"}</Text>}
              </Pressable>

              {waitingForPhoneOtp && authMethod === "phone" && mode === "signup" ? (
                <View style={{ marginTop: 10 }}>
                  <TextInput
                    placeholder="Code SMS (OTP)"
                    placeholderTextColor="#8892a6"
                    keyboardType="number-pad"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    onFocus={() => setFOtp(true)}
                    onBlur={() => setFOtp(false)}
                    style={[styles.input, fOtp && { borderColor: pack.gradient[0] as string }]}
                  />
                  <Pressable style={[styles.btn, { backgroundColor: "#34D399", marginTop: 6 }]} onPress={verifyPhoneOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Valider le code</Text>}
                  </Pressable>
                </View>
              ) : null}

              {notice ? <Text style={styles.notice}>{notice}</Text> : null}
              {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

              {mode === "signin" && (
                <Pressable onPress={() => setSelected("reset")} style={{ marginTop: 12 }}>
                  <Text style={{ color: "#9fb0d9", textAlign: "center" }}>J'ai oublié mon mot de passe</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Sélecteur de pays */}
      <Modal visible={showCountryPicker} transparent animationType="fade" onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choisir un pays</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.iso2}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setCountry(item);
                    if (phoneLocal) {
                      const digitsOnly = phoneLocal.replace(/[^\d]/g, "");
                      const formatter = new AsYouType(item.iso2 as any);
                      const formatted = formatter.input(digitsOnly);
                      setPhoneLocal(formatted);
                    }
                    setShowCountryPicker(false);
                  }}
                  style={styles.countryRow}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDialRow}>{item.dial}</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
            <Pressable onPress={() => setShowCountryPicker(false)} style={[styles.btn, { marginTop: 12, backgroundColor: "#4A90E2" }]}>
              <Text style={styles.btnText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ========================= Styles ========================= */
const styles = StyleSheet.create({
  brand: { color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  brandSub: { color: "rgba(255,255,255,0.7)", marginTop: 2 },

  blob: {
    position: "absolute",
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
    borderRadius: 999,
    opacity: 0.15,
  },

  center: { padding: 24, alignItems: "center", minHeight: Platform.OS === "web" ? ("100vh" as unknown as number) : undefined },

  /* Cartes boosters */
  cardFrame: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: 24,
    padding: 1.5,
  },
  cardInner: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: "#0b0f19",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardTitle: { color: "white", fontSize: 20, fontWeight: "900", textAlign: "center", marginTop: 6 },
  cardSubtitle: { color: "rgba(255,255,255,0.8)", textAlign: "center", marginTop: 2 },

  rarityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginTop: 10,
  },
  rarityText: { color: "#0b0f19", fontWeight: "900", fontSize: 12 },

  heroImg: { width: "90%", height: 140, borderRadius: 14, marginTop: 12 },

  countWrap: {
    position: "absolute",
    bottom: 10,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  countText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  shine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: ITEM_WIDTH,
    opacity: 0.28,
  },

  openOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  openCard: { width: 180, height: 240, borderRadius: 16 },

  /* Form */
  miniCard: { width: 96, height: 128, borderRadius: 12 },

  form: {
    width: 368,
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
    borderColor: "rgba(56,189,248,0.4)",
  },
  oauthBtn: { borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  perksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  perkChip: {
    color: "#cde7ff",
    backgroundColor: "rgba(56,189,248,0.12)",
    borderColor: "rgba(56,189,248,0.35)",
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    overflow: "hidden",
  },

  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  divider: { flex: 1, height: 1, backgroundColor: "#1f2937" },
  dividerTxt: { color: "#6f7ca1", marginHorizontal: 8, fontSize: 12 },

  segment: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#233055",
  },
  segmentBtn: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 8 },
  segmentBtnActive: { backgroundColor: "rgba(255,255,255,0.12)" },
  segmentText: { color: "#9fb0d9", fontWeight: "700" },
  segmentTextActive: { color: "white" },

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

  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#101729",
  },
  countryFlag: { fontSize: 18 },
  countryDial: { color: "white", fontWeight: "800" },
  helper: { color: "#9fb0d9", marginTop: 6, marginBottom: 4, fontSize: 12, textAlign: "left" },

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

  /* Modal pays */
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", padding: 24, justifyContent: "center" },
  modalCard: {
    backgroundColor: "#0b0f19",
    borderWidth: 1,
    borderColor: "#233055",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  modalTitle: { color: "white", fontWeight: "800", fontSize: 16, marginBottom: 12, textAlign: "center" },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#101729",
  },
  countryName: { color: "white", flex: 1 },
  countryDialRow: { color: "#9fb0d9", fontWeight: "700" },
});

/* ========================= helpers ========================= */
function rarityStyle(r: Booster["rarity"]) {
  if (r === "COMMON") return { backgroundColor: "#93c5fd" };
  if (r === "RARE") return { backgroundColor: "#c4b5fd" };
  return { backgroundColor: "#fbcfe8" }; // EPIC
}
