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
} as const;

export type PaletteKey   = keyof typeof PALETTE;
export type PaletteColor = typeof PALETTE[PaletteKey];
