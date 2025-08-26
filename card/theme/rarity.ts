// card/theme/rarity.ts
export type Rarity = 'bronze' | 'argent' | 'diamant' | 'legend';

export const RARITY = {
  bronze: { border: '#bd7a2f', label: 'BRONZE' },
  argent: { border: '#bfc6ce', label: 'ARGENT' },
  diamant:{ border: '#86d0ff', label: 'DIAMANT' },
  legend: { border: '#f04d4d', label: 'LÉGENDAIRE' },
} as const;

export const getRarityBorder = (r: Rarity) => RARITY[r].border;
export const getRarityLabel  = (r: Rarity) => RARITY[r].label;
