// card/builder/CardBuilder.tsx
import React, { useMemo, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, Alert,
  ScrollView, Platform, Dimensions, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import ProfileCard from '../cards/ProfileCard';
import { ELEMENTS, type ElementKey } from '../theme/elements';
import { type Rarity } from '../theme/rarity';
import { supabase } from '../../SupabaseClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// >>> NEW
import PhotoCropModal from './PhotoCropModal';

// --- layout constants (unchanged) ---
const MAX_CARD_W = 340;
const GUTTER = 16;
const V_PAD = 14;

// --- helpers date (unchanged) ---
function formatBirthdateInput(value: string): string { /* ... same as before ... */ 
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
function toISODate(input: string): string | null { /* ... same as before ... */ 
  const s = input.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const fr = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  return null;
}
function computeAgeFromBirthdateStr(birthdate?: string | null): number | null { /* ... same as before ... */ 
  if (!birthdate) return null;
  const iso = toISODate(birthdate);
  if (!iso) return null;
  const [Y, M, D] = iso.split('-').map(Number);
  const d = new Date(Y, M - 1, D);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age < 0 || age > 120 ? null : age;
}

export default function CardBuilder() {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_W } = Dimensions.get('window');
  const cardSize = Math.min(MAX_CARD_W, Math.max(280, Math.round(SCREEN_W - 2 * GUTTER)));

  const [element, setElement] = useState<ElementKey>('Feu' as ElementKey);
  const [rarity] = useState<Rarity>('bronze'); // toujours bronze pour l’instant

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [displayName, setDisplayName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [city, setCity] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // >>> NEW: state for crop modal
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  const age = useMemo(() => computeAgeFromBirthdateStr(birthdate), [birthdate]);

  // ---- Photo flow: pick then open cropper
  const pickImage = useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.95,
      allowsEditing: false, // we use our own editor
    });
    if (!res.canceled && res.assets?.[0]?.uri) {
      setCropSrc(res.assets[0].uri);
      setCropOpen(true);
    }
  }, []);

  // >>> NEW: re-open cropper for an existing photo
  const adjustPhoto = useCallback(() => {
    if (avatarUrl) {
      setCropSrc(avatarUrl);
      setCropOpen(true);
    }
  }, [avatarUrl]);

  // --- Save (unchanged apart from rarity if you store it) ---
  const save = useCallback(async () => {
    try {
      setSaving(true);
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user?.id;
      if (!userId) { Alert.alert('Non connecté', 'Reviens te connecter.'); return; }
      if (!displayName.trim()) { Alert.alert('Incomplet', 'Nom obligatoire.'); return; }

      let birthdateISO: string | null = null;
      if (birthdate.trim()) {
        birthdateISO = toISODate(birthdate);
        if (!birthdateISO) { Alert.alert('Date invalide', 'Saisis JJ/MM/AAAA ou AAAA-MM-JJ.'); return; }
      }

      const payload = {
        id: userId,
        element,
        rarity,
        avatar_url: avatarUrl ?? null,
        display_name: displayName.trim(),
        birthdate: birthdateISO,
        age,
        city: city.trim() || null,
        reason: reason.trim() || null,
        onboarding_completed: true,
      };
      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) throw error;
      Alert.alert('OK', 'Profil enregistré ✅');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Sauvegarde impossible');
    } finally {
      setSaving(false);
    }
  }, [age, avatarUrl, birthdate, city, displayName, element, reason, rarity]);

  // Elements list without "Vent"
  const elementKeys = useMemo(
    () => (Object.keys(ELEMENTS) as ElementKey[]).filter((k) => k.toLowerCase() !== 'vent'),
    []
  );

  // >>> NEW: compute the exact frame aspect used by ProfileCard's photo window
  // Your ProfileCard uses CARD_W=300, CARD_H=500, MEDIA_RATIO=0.42 and 8px paddings on the photo box:
  // frameWidth ≈ cardSize - 16 ; frameHeight ≈ (CARD_H/CARD_W * cardSize)*MEDIA_RATIO - 12
  const frameAspect = useMemo(() => {
    const cardHOverW = 500 / 300;
    const mediaRatio = 0.42;
    const visibleW = cardSize - 16; // 8 left + 8 right inside the photo container
    const visibleH = Math.max(80, Math.round(cardHOverW * cardSize * mediaRatio - 12)); // 4 top + 8 bottom
    return visibleW / visibleH;
  }, [cardSize]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0f14' }}>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingTop: Math.max(V_PAD, insets.top + 4),
          paddingBottom: Math.max(V_PAD, insets.bottom + 16),
          paddingHorizontal: GUTTER,
          gap: 14,
        }}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <ProfileCard
          element={element}
          rarity={rarity}
          avatarUrl={avatarUrl}
          displayName={displayName || 'Moi'}
          age={age}
          city={city || undefined}
          reason={reason}
          size={cardSize}
          editable
          onChangeReason={setReason}
        />

        {/* Choix élément */}
        <View style={[styles.rowWrap, { maxWidth: cardSize }]}>
          {elementKeys.map((k) => {
            const active = k === element;
            return (
              <Pressable
                key={k}
                onPress={() => setElement(k)}
                style={[styles.chip, { backgroundColor: active ? '#fff' : '#ffffff1a' }]}
              >
                <Text style={{ color: active ? '#0a0f14' : '#fff' }}>{k}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Champs */}
        <View style={{ width: cardSize }}>
          <TextInput
            placeholder="Ton nom / pseudo"
            placeholderTextColor="#94a3b8"
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.input}
          />

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              placeholder="Date de naissance (JJ/MM/AAAA)"
              placeholderTextColor="#94a3b8"
              value={birthdate}
              onChangeText={(v) => setBirthdate(formatBirthdateInput(v))}
              inputMode="numeric"
              maxLength={10}
              style={[styles.input, { flex: 1 }]}
            />
            <TextInput
              editable={false}
              value={age != null ? `${age} ans` : ''}
              placeholder="Âge (auto)"
              placeholderTextColor="#94a3b8"
              style={[styles.input, { flex: 1, opacity: 0.9 }]}
            />
          </View>

          <TextInput
            placeholder="Ville"
            placeholderTextColor="#94a3b8"
            value={city}
            onChangeText={setCity}
            style={styles.input}
          />
        </View>

        {/* Photo actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, width: cardSize, justifyContent: 'space-between' }}>
          <Pressable onPress={pickImage} style={[styles.btnGhost, { flex: 1 }]}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>
              {avatarUrl ? 'Changer de photo' : 'Choisir une photo'}
            </Text>
          </Pressable>

          {avatarUrl ? (
            <Pressable onPress={adjustPhoto} style={[styles.btnGhost, { flex: 1 }]}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>Ajuster la photo</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>

        <Pressable onPress={save} style={[styles.btnPrimary, { width: cardSize }]}>
          <Text style={{ color: '#0a0f14', fontWeight: '800', textAlign: 'center' }}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* >>> NEW: Crop modal */}
      <PhotoCropModal
        visible={cropOpen && !!cropSrc}
        imageUri={cropSrc ?? ''}
        frameAspect={frameAspect}
        outputWidth={1200}
        onCancel={() => setCropOpen(false)}
        onDone={(uri) => {
          setCropOpen(false);
          setAvatarUrl(uri);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  input: {
    backgroundColor: '#101729',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#233055',
    marginBottom: 8,
  },
  btnGhost: { backgroundColor: '#ffffff1a', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  btnPrimary: { backgroundColor: '#22c55e', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginTop: 12 },
});
