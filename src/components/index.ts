/**
 * Bibliothèque de composants Passe-Tech — Motion Canvas
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  FRONTIÈRE DE DÉPRÉCIATION — 2026-05-20                             │
 * │                                                                     │
 * │  Toute scène créée APRÈS cette date doit utiliser les composants    │
 * │  ci-dessous plutôt que reconstruire ces patterns inline.            │
 * │                                                                     │
 * │  Les scènes antérieures (docker/, litellm/, glasswing/, etc.) sont  │
 * │  conservées telles quelles — ne pas rétro-fitter.                   │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Composants disponibles :
 *
 * @see {@link Terminal}          - Fenêtre terminal avec typewrite, blink, clear
 * @see {@link ConnectionArrow}   - Flèche réactive entre deux points (from/to)
 * @see {@link InfoCard}          - Carte header coloré + body children libres
 * @see {@link ConnectedNode}     - Nœud de diagramme (icon + label + compteur externe)
 * @see {@link AnnotationBox}     - Boîte annotation (titre + lignes), flèche séparée
 *
 * Palette partagée :
 * @see {@link PALETTE}           - `import {PALETTE} from '../theme'`
 */

// ── Terminal ─────────────────────────────────────────────────────────────────
export {Terminal}                            from './Terminal';
export type {TerminalProps, TypewriteOpts, TermColor} from './Terminal';

// ── ConnectionArrow ──────────────────────────────────────────────────────────
export {ConnectionArrow}                     from './ConnectionArrow';
export type {ConnectionArrowProps}           from './ConnectionArrow';

// ── InfoCard ─────────────────────────────────────────────────────────────────
export {InfoCard}                            from './InfoCard';
export type {InfoCardProps}                  from './InfoCard';

// ── ConnectedNode ────────────────────────────────────────────────────────────
export {ConnectedNode}                       from './ConnectedNode';
export type {ConnectedNodeProps}             from './ConnectedNode';

// ── AnnotationBox ────────────────────────────────────────────────────────────
export {AnnotationBox}                       from './AnnotationBox';
export type {AnnotationBoxProps}             from './AnnotationBox';
