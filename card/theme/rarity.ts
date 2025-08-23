export type Rarity = 'bronze'|'argent'|'or'|'diamant'|'legend';

export const RARITY = {
  bronze: { label: 'BRONZE' },
  argent: { label: 'ARGENT' },
  or:     { label: 'OR' },
  diamant:{ label: 'DIAMANT' },
  legend: { label: 'LÉGENDAIRE' },
} as const;
