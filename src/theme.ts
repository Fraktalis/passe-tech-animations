/**
 * Palette de couleurs Passe-Tech — source unique de vérité.
 * Importer PALETTE dans les composants et les scènes ≥ 2026-05-20.
 *
 * @example
 * ```typescript
 * import {PALETTE} from '../theme';
 * fill={PALETTE.bg}
 * stroke={PALETTE.rose}
 * ```
 */
export const PALETTE = {
  // ── Fond ────────────────────────────────────────────────────────────────
  bg:      '#0D1117',
  bgCard:  '#161B22',

  // ── Texte ───────────────────────────────────────────────────────────────
  cream:   '#F9F9F6',
  ghost:   '#484F58',

  // ── Brand Passe-Tech ────────────────────────────────────────────────────
  rose:    '#FF3E6C',
  vert:    '#6DFF8A',
  jaune:   '#FFE14D',
  blue:    '#58A6FF',

  // ── Alias sémantiques ───────────────────────────────────────────────────
  danger:  '#FF3E6C',
  safe:    '#6DFF8A',
  accent:  '#FFE14D',
  primary: '#58A6FF',

  // ── Design System (≥ 2026-05-20) ────────────────────────────────────────
  nodeBg:       '#1A1A1A',  // fond repos des nœuds DS
  nodeActiveBg: '#252525',  // fond nœud actif/highlighted DS
  secondary:    '#6B7280',  // texte/icône secondaire DS (≠ ghost #484F58)
  cyan:         '#38BDF8',  // connexion réseau, transit DS
  amber:        '#FBBF24',  // avertissement DS
  dsRose:       '#FF4D6D',  // rose pastèque spec DS (≠ brand rose #FF3E6C)
  dsGreen:      '#4ADE80',  // vert spec DS (≠ brand vert #6DFF8A)
} as const;

/**
 * Entité → couleur. La couleur suit l'entité, jamais son rang : une même
 * entité garde la même couleur d'une scène à l'autre, quel que soit le nombre
 * de séries affichées. À étendre ici, pas inline dans les scènes.
 *
 * Validateur dataviz (fond bg, mode sombre) : `blue` et `cyan` sont à ΔE 6,6
 * en vision normale — ne jamais les afficher comme deux catégories voisines
 * sans label direct ou forme distincte. Idem jaune/vert pour les protanopes.
 */
export const ENTITY_COLOR = {
  network:  PALETTE.cyan,   // connexion, transit, protocoles réseau (HTTP, TCP)
  process:  PALETTE.blue,   // processus racine, acteur principal
  danger:   PALETTE.rose,   // risque, attaque, erreur
  safe:     PALETTE.vert,   // protégé, validé
  warning:  PALETTE.amber,  // avertissement
  accent:   PALETTE.jaune,  // point d'attention, mise en avant
  inactive: PALETTE.ghost,  // éléments estompés
} as const;

export type EntityKey = keyof typeof ENTITY_COLOR;

export type PaletteKey   = keyof typeof PALETTE;
export type PaletteColor = typeof PALETTE[PaletteKey];
