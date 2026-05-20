/**
 * @file ConnectionArrow.tsx
 * @description Flèche de connexion réactive entre deux points du canvas.
 *
 * Les points `from` et `to` sont des **fonctions réactives** — toujours utiliser
 * `vW()` / `vH()` pour un sizing proportionnel.
 *
 * @example
 * ```tsx
 * import {ConnectionArrow} from '../components';
 *
 * const arrow = createRef<ConnectionArrow>();
 *
 * view.add(
 *   <ConnectionArrow
 *     ref={arrow}
 *     from={() => [vW() * -0.2, vH() * 0.05]}
 *     to={() =>   [vW() *  0.2, vH() * 0.05]}
 *     stroke={PALETTE.rose}
 *     opacity={0}
 *   />
 * );
 *
 * arrow().opacity(1);
 * yield* arrow().end(1, 0.5, easeInOutCubic);
 * ```
 *
 * @module
 */

import {Line, LineProps} from '@motion-canvas/2d/lib/components';
import {PALETTE} from '../theme';

export interface ConnectionArrowProps extends Omit<LineProps, 'points'> {
  /** Point de départ — fonction réactive obligatoire : `() => [vW() * x, vH() * y]` */
  from: () => [number, number];
  /** Point d'arrivée — fonction réactive obligatoire : `() => [vW() * x, vH() * y]` */
  to: () => [number, number];
  /** Trace la ligne en tirets (flux optionnel, connexion secondaire). @defaultValue false */
  dashed?: boolean;
  /** Taille de la pointe de flèche en pixels. @defaultValue 10 */
  arrowSize?: number;
}

/**
 * Flèche de connexion entre deux points réactifs.
 * Étend {@link Line} — toutes les LineProps sont disponibles.
 *
 * **Pattern d'animation standard :**
 * 1. Démarrer avec `end={0}` (ou via `arrow().end(0)` avant)
 * 2. `arrow().opacity(1)` (sans yield — instantané)
 * 3. `yield* arrow().end(1, 0.5, easeInOutCubic)`
 */
export class ConnectionArrow extends Line {
  public constructor({
    from,
    to,
    dashed    = false,
    arrowSize = 10,
    stroke    = PALETTE.ghost,
    lineWidth = 2,
    ...rest
  }: ConnectionArrowProps) {
    super({
      points:   () => [from(), to()],
      stroke,
      lineWidth,
      endArrow: true,
      arrowSize,
      lineDash: dashed ? [8, 6] : [],
      ...rest,
    });
  }
}
