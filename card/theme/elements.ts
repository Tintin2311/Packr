export type ElementKey = keyof typeof ELEMENTS;

export const ELEMENTS = {
  Feu:         { emoji: '🔥' },
  Eau:         { emoji: '💧' },
  "Électricité": { emoji: '⚡' },
  Plante:      { emoji: '🌿' },
  Glace:       { emoji: '❄️' },
  Terre:       { emoji: '🌋' },
  "Ténèbres":  { emoji: '🌑' },
  "Lumière":   { emoji: '✨' },
} as const;

export const emojiFor = (el: string) => (ELEMENTS as any)[el]?.emoji ?? '⭐';
