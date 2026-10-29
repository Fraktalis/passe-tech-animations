/**
 * salle.ts — Plan de salle fictif PARTAGÉ par les scènes mariage
 * (contraintes-placement, cpsat-solution, livret-table, plan-traiteur-totaux).
 *
 * Pas de JSX : constantes et fonctions pures. Toutes les positions sont
 * calculées à partir de `vW` / `vH` (fonctions réactives de la vue), donc la
 * salle est identique d'une scène à l'autre.
 *
 * Données 100 % fictives : prénoms inventés, aucun vrai invité.
 *
 * Salle : 1 table d'honneur rectangulaire (index 0) + 7 tables rondes (1..7).
 * Tailles : 7, 8, 6, 8, 8, 8, 7, 8 = 60 convives.
 */

export type Dim = () => number;
export type Dish = 'risotto' | 'jarret';
export type Diet = 'veg' | 'laitiers' | 'alcool' | 'mer' | 'poisson';

export interface Guest {
  id: number;
  name: string;
  dish: Dish;
  diets: Diet[];
  /** 0 = table d'honneur, 1..7 = tables rondes. */
  table: number;
  /** Rang du siège autour de la table. */
  seat: number;
}

// ── Tables ──────────────────────────────────────────────────────────────────

export const TABLE_SIZES = [7, 8, 6, 8, 8, 8, 7, 8] as const;
export const TABLE_COUNT = TABLE_SIZES.length;
export const HONOR_TABLE = 0;
export const GUEST_COUNT = 60;

/** Centre des tables en fractions [vW, vH] — index 0 = honneur. */
const TABLE_CENTER_FRACTIONS: ReadonlyArray<readonly [number, number]> = [
  [0.0, -0.36],
  [-0.3, -0.08], [-0.1, -0.08], [0.1, -0.08], [0.3, -0.08],
  [-0.2, 0.28], [0.0, 0.28], [0.2, 0.28],
];

export function tableCenter(table: number, vW: Dim, vH: Dim): [number, number] {
  const [fx, fy] = TABLE_CENTER_FRACTIONS[table];
  return [vW() * fx, vH() * fy];
}

export const tableRadius = (vW: Dim) => vW() * 0.04;
export const seatRingRadius = (vW: Dim) => vW() * 0.058;
export const seatDotRadius = (vW: Dim) => vW() * 0.0085;
export const honorTableSize = (vW: Dim, vH: Dim): [number, number] => [vW() * 0.26, vH() * 0.06];

/** Position (px, repère scène) du siège `seat` de la table `table`. */
export function seatSlot(table: number, seat: number, vW: Dim, vH: Dim): [number, number] {
  const [cx, cy] = tableCenter(table, vW, vH);
  const count = TABLE_SIZES[table];
  if (table === HONOR_TABLE) {
    const [width, height] = honorTableSize(vW, vH);
    // sièges sur le grand côté tourné vers la salle
    return [cx + ((seat + 0.5) / count - 0.5) * width, cy + height / 2 + vW() * 0.02];
  }
  const angle = -Math.PI / 2 + (2 * Math.PI * seat) / count;
  const ring = seatRingRadius(vW);
  return [cx + Math.cos(angle) * ring, cy + Math.sin(angle) * ring];
}

// ── Convives fictifs ────────────────────────────────────────────────────────

const NAMES: readonly string[] = [
  'Léa', 'Hugo', 'Camille', 'Louis', 'Chloé', 'Jules', 'Manon', 'Nathan', 'Inès', 'Théo',
  'Sarah', 'Lucas', 'Emma', 'Paul', 'Zoé', 'Gabriel', 'Alice', 'Arthur', 'Jade', 'Tom',
  'Lola', 'Adam', 'Mathis', 'Matis', 'Clara', 'Noah', 'Eva', 'Maxime', 'Rose', 'Victor',
  'Nina', 'Antoine', 'Lina', 'Samuel', 'Julie', 'Raphaël', 'Anna', 'Baptiste', 'Mia', 'Étienne',
  'Elsa', 'Romain', 'Iris', 'Quentin', 'Léna', 'Simon', 'Margaux', 'Dylan', 'Pauline', 'Bastien',
  'Océane', 'Enzo', 'Fanny', 'Kévin', 'Laure', 'Yanis', 'Salomé', 'Ismaël', 'Thaïs', 'Corentin',
];

/** Risotto si (id × 7) mod 15 < 8 : exactement 32 risotto / 28 jarret sur 60. */
const dishOf = (id: number): Dish => ((id * 7) % 15 < 8 ? 'risotto' : 'jarret');

/** Régimes (fictifs). Les végétariens mangent tous du risotto. */
const DIET_IDS: Record<Diet, readonly number[]> = {
  veg:      [1, 5, 9, 13, 18, 24, 30, 35, 41, 46, 54, 58],
  laitiers: [8, 20, 31, 35, 44, 52],
  alcool:   [3, 14, 26, 33, 36, 49, 57],
  mer:      [12, 29, 40, 55],
  poisson:  [6, 22, 34, 47, 59],
};

export const DIET_ORDER: readonly Diet[] = ['veg', 'laitiers', 'alcool', 'mer', 'poisson'];
export const DIET_ICON: Record<Diet, string> = {
  veg:      'mdi:leaf',
  laitiers: 'mdi:cheese',
  alcool:   'mdi:glass-cocktail',
  mer:      'lucide:shrimp',
  poisson:  'mdi:fish',
};
export const DIET_LABEL: Record<Diet, string> = {
  veg:      'Végétarien',
  laitiers: 'Produits laitiers',
  alcool:   'Alcool',
  mer:      'Fruits de mer',
  poisson:  'Poisson',
};

/** Sortie brute du solveur : tables remplies dans l'ordre des ids. */
export const GUESTS_SOLVEUR: readonly Guest[] = (() => {
  const guests: Guest[] = [];
  let id = 0;
  TABLE_SIZES.forEach((size, table) => {
    for (let seat = 0; seat < size; seat++, id++) {
      guests.push({
        id,
        name: NAMES[id],
        dish: dishOf(id),
        diets: DIET_ORDER.filter(diet => DIET_IDS[diet].includes(id)),
        table,
        seat,
      });
    }
  });
  return guests;
})();

/** Petite retouche à la main : ces deux convives (sans contrainte) échangent leur place. */
export const RETOUCHE: readonly [number, number] = [20, 28];

/** Plan FINAL (après retouche) — celui que montrent livret et plan traiteur. */
export const GUESTS: readonly Guest[] = GUESTS_SOLVEUR.map(guest => {
  const [first, second] = RETOUCHE;
  if (guest.id !== first && guest.id !== second) return guest;
  const other = GUESTS_SOLVEUR[guest.id === first ? second : first];
  return {...guest, table: other.table, seat: other.seat};
});

export const guestsOfTable = (table: number, guests: readonly Guest[] = GUESTS) =>
  guests.filter(guest => guest.table === table).sort((a, b) => a.seat - b.seat);

export const DISH_TOTALS: Record<Dish, number> = {
  risotto: GUESTS.filter(guest => guest.dish === 'risotto').length, // 32
  jarret:  GUESTS.filter(guest => guest.dish === 'jarret').length,  // 28
};

// ── Règles de placement (cohérentes avec GUESTS_SOLVEUR) ─────────────────────

/** Liens rigides : toujours à la même table. */
export const COUPLES: ReadonlyArray<readonly number[]> = [
  [0, 1], [2, 3], [7, 8], [9, 10], [15, 16], [17, 18], [26, 27], [42, 43], [49, 50], [52, 53], [54, 55],
];
export const TRIOS: ReadonlyArray<readonly number[]> = [[4, 5, 6], [11, 12, 13], [56, 57, 58]];
/** Familles : contour commun, une table (ou une moitié de table) chacune. */
export const FAMILIES: ReadonlyArray<readonly number[]> = [
  [29, 30, 31, 32, 33, 34, 35, 36],
  [45, 46, 47, 48],
];
/** Groupes qui s'attirent (élastique) : même table. */
export const GROUPS: ReadonlyArray<readonly number[]> = [
  [21, 22, 23, 24, 25], // collègues
  [37, 38, 39, 40, 41], // amis
];
/** Paires à éloigner : tables différentes. */
export const SEPARATIONS: ReadonlyArray<readonly [number, number]> = [
  [7, 37], [19, 52], [30, 21], [14, 44], [3, 59], [50, 33],
];

// ── Nuage désordonné (avant solveur) ─────────────────────────────────────────

const pseudoRandom = (seed: number) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

/** Position du convive `id` dans le nuage initial (déterministe). */
export function cloudPos(id: number, vW: Dim, vH: Dim): [number, number] {
  return [
    (pseudoRandom(id * 2 + 1) - 0.5) * 0.84 * vW(),
    (pseudoRandom(id * 2 + 2) - 0.5) * 0.7 * vH(),
  ];
}

/** Aléa déterministe réutilisable par les scènes (0..1). */
export const hashUnit = pseudoRandom;
