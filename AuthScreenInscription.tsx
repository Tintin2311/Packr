// AuthScreenInscription.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "./SupabaseClient";
import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";
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

type AuthMethod = "email" | "phone";
type Country = { name: string; iso2: string; dial: string; flag: string };

/* ========================= Données ========================= */
const COUNTRIES: Country[] = [
  { name: "France", iso2: "FR", dial: "+33", flag: "🇫🇷" },
  { name: "Belgique", iso2: "BE", dial: "+32", flag: "🇧🇪" },
  { name: "Suisse", iso2: "CH", dial: "+41", flag: "🇨🇭" },
  { name: "Canada", iso2: "CA", dial: "+1", flag: "🇨🇦" },
  { name: "États-Unis", iso2: "US", dial: "+1", flag: "🇺🇸" },
  { name: "Royaume-Uni", iso2: "GB", dial: "+44", flag: "🇬🇧" },
];

/* ========================= Composant ========================= */
export default function AuthScreenInscription({ onBack, pack }: Props) {
  // Méthode d'auth
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");

  // Champs
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // OTP
  const [waitingForPhoneOtp, setWaitingForPhoneOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // UI
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Focus visuels
  const [fUser, setFUser] = useState(false);
  const [fEmail, setFEmail] = useState(false);
  const [fPhone, setFPhone] = useState(false);
  const [fPwd, setFPwd] = useState(false);
  const [fPwd2, setFPwd2] = useState(false);
  const [fOtp, setFOtp] = useState(false);

  // Overlay retour
  const [showReturnOverlay, setShowReturnOverlay] = useState(false);

  // Redirect OAuth / reset
  const redirectTo =
    Platform.OS === "web"
      ? (typeof window !== "undefined" ? `${window.location.origin}/auth-callback` : "/auth-callback")
      : Linking.createURL("/auth-callback");

  /* ========== Helpers téléphone ========== */
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

  /* ========== Validation password ========== */
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Connexion OAuth impossible.");
    } finally {
      setLoading(false);
    }
  }

  /* ========== Submit ========== */
  const submit = async () => {
    setNotice(null);
    setErrorMsg(null);
    if (!ensureSignupPasswordOK()) return;

    setLoading(true);
    try {
      if (authMethod === "email") {
        if (!email) throw new Error("Merci d'indiquer un e-mail.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: username ? { username } : undefined },
        });
        if (error) throw error;
        if (data?.user && !data.session) {
          setNotice(`Un e-mail de confirmation a été envoyé à ${email}.`);
        } else {
          setNotice("Compte créé et connecté !");
        }
      } else {
        if (!e164Phone) throw new Error(`Numéro invalide pour ${country.name}.`);
        const { error } = await supabase.auth.signUp({ phone: e164Phone, password });
        if (error) throw error;
        setWaitingForPhoneOtp(true);
        setNotice(`Un code SMS a été envoyé au ${e164Phone}.`);
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Création impossible pour le moment.");
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
      setWaitingForPhoneOtp(false);
      setOtpCode("");
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Code invalide. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  /* ========================= Render ========================= */
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
        {/* OAuth */}
        <View style={{ gap: 10, marginBottom: 10 }}>
          <Pressable
            onPress={() => oauthSignIn("google")}
            style={[styles.oauthBtn, { backgroundColor: "#4285F4" }]}
            disabled={loading}
          >
            <Text style={styles.btnText}>Continuer avec Google</Text>
          </Pressable>
          <Pressable
            onPress={() => oauthSignIn("facebook")}
            style={[styles.oauthBtn, { backgroundColor: "#1877F2" }]}
            disabled={loading}
          >
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

        {/* Username (optionnel) */}
        <TextInput
          placeholder="Nom d'utilisateur (optionnel)"
          placeholderTextColor="#8892a6"
          value={username}
          onChangeText={setUsername}
          onFocus={() => setFUser(true)}
          onBlur={() => setFUser(false)}
          style={[styles.input, fUser && { borderColor: pack.gradient[0] as string }]}
        />

        {/* Switch Email / Phone */}
        <View style={styles.segment}>
          <Pressable
            onPress={() => setAuthMethod("email")}
            style={[styles.segmentBtn, authMethod === "email" && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, authMethod === "email" && styles.segmentTextActive]}>E-mail</Text>
          </Pressable>
          <Pressable
            onPress={() => setAuthMethod("phone")}
            style={[styles.segmentBtn, authMethod === "phone" && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, authMethod === "phone" && styles.segmentTextActive]}>Téléphone</Text>
          </Pressable>
        </View>

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
              <Pressable
                onPress={() => setShowCountryPicker(true)}
                style={[styles.countryBtn, { borderColor: pack.gradient[0] as string }]}
              >
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
                style={[
                  styles.input,
                  { flex: 1, marginBottom: 0 },
                  fPhone && { borderColor: pack.gradient[0] as string },
                ]}
              />
            </View>
            <Text style={styles.helper}>
              Formaté: {phoneLocal || "—"} {"   "}E.164: {e164Phone || `${country.dial}…`}
            </Text>
          </>
        )}

        {/* Passwords */}
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

        {/* Submit */}
        <Pressable
          style={[styles.btn, { backgroundColor: pack.gradient[0] as string }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Créer mon profil</Text>}
        </Pressable>

        {/* OTP bloc si téléphone */}
        {waitingForPhoneOtp && authMethod === "phone" ? (
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
            <Pressable
              style={[styles.btn, { backgroundColor: "#34D399", marginTop: 6 }]}
              onPress={verifyPhoneOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Valider le code</Text>}
            </Pressable>
          </View>
        ) : null}

        {/* Messages */}
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        {/* Lien retour (ouvre overlay) */}
        <Pressable onPress={() => setShowReturnOverlay(true)} style={{ marginTop: 12 }}>
          <Text style={{ color: "#9fb0d9", textAlign: "center" }}>← Choisir un autre pack</Text>
        </Pressable>
      </View>

      {/* Modal pays */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryPicker(false)}
      >
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
            <Pressable
              onPress={() => setShowCountryPicker(false)}
              style={[styles.btn, { marginTop: 12, backgroundColor: "#4A90E2" }]}
            >
              <Text style={styles.btnText}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
