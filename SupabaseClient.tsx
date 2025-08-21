// supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Erreur claire si .env mal configuré
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
    'Add them to a .env file at the project root and restart Expo.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Sur natif on doit fournir un storage; sur web Supabase utilise localStorage
    ...(isWeb ? {} : { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: isWeb, // true sur web, false sur natif
  },
  // Optionnel: un léger throttle du realtime
  realtime: { params: { eventsPerSecond: 5 } },
});

// Petites aides facultatives
export const getSession = async () => (await supabase.auth.getSession()).data.session;
export const signOut = () => supabase.auth.signOut();
export const IS_WEB = isWeb;
