// card/theme/index.ts
export * from './rarity';
export * from './grammar';
export * from './elements';

import { GRAMMAR } from './grammar';
import type { ElementKey } from './elements';

// Map d’emojis non liée au union-type (évite ts(2353))
const EMOJI_MAP: Record<string, string> = {
  Feu: '🔥',
  Eau: '💧',
  Électricité: '⚡️',
  Plante: '🌿',
  Glace: '❄️',
  Pierre: '🪨',   // si chez toi la clé est "Roche", remplace la string
  Sol: '⛰️',
  Ténèbres: '🌑',
  Lumière: '✨',
  Vent: '💨',
} as const;

export const emojiFor = (key: ElementKey): string =>
  EMOJI_MAP[key as string] ?? '✨';

export const prefixFor = (key: ElementKey): string =>
  GRAMMAR?.[key]?.article ?? '';

export const nounFor = (key: ElementKey): string =>
  GRAMMAR?.[key]?.noun ?? String(key);

export const labelFor = (key: ElementKey): string => {
  const noun = GRAMMAR?.[key]?.noun;
  return noun ? noun.charAt(0).toUpperCase() + noun.slice(1) : String(key);
};
