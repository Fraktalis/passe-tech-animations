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
  /**
   * Fraction [0–1] de la distance axiale utilisée pour les stubs de sortie/entrée.
   * Crée deux segments perpendiculaires au bord du nœud avant le segment diagonal,
   * comme le font draw.io ou Mermaid. Plus élevé = courbe plus prononcée.
   * `0` = ligne droite sans routing.
   * @defaultValue 0.3
   */
  routing?: number;
  /**
   * Point de passage forcé — court-circuite le routing automatique.
   * Utile pour les arcs en U (flèches de retry qui passent sous les nœuds) :
   * ```tsx
   * via={() => [(fromX + toX) / 2, bottomEdgeY + vH() * 0.10]}
   * ```
   */
  via?: () => [number, number];
  /**
   * Force l'axe des stubs de sortie/entrée.
   * `'auto'` laisse l'algo choisir selon |dx| vs |dy|.
   * `'horizontal'` : stubs toujours latéraux (utile pour les flèches diagonales
   * qui descendent entre nœuds alignés horizontalement).
   * `'vertical'` : stubs toujours verticaux.
   * @defaultValue 'auto'
   */
  routingAxis?: 'auto' | 'horizontal' | 'vertical';
}

/**
 * Flèche de connexion entre deux points réactifs avec routing automatique.
 * Étend {@link Line} — toutes les LineProps sont disponibles.
 *
 * **Pattern d'animation standard :**
 * 1. Démarrer avec `end={0}`
 * 2. `arrow().opacity(1)` (sans yield — instantané)
 * 3. `yield* arrow().end(1, 0.5, easeInOutCubic)`
 */
export class ConnectionArrow extends Line {
  public constructor({
    from,
    to,
    dashed      = false,
    arrowSize   = 10,
    stroke      = PALETTE.ghost,
    lineWidth   = 2,
    routing     = 0.3,
    via,
    routingAxis = 'auto',
    ...rest
  }: ConnectionArrowProps) {
    super({
      points: () => {
        const p0 = from();
        const p3 = to();

        // Via explicite : bézier quadratique échantillonnée en N segments.
        // Le point `via` est un point de passage (t=0.5), pas un point de contrôle —
        // on recalcule le vrai point de contrôle C tel que B(0.5) = via.
        if (via) {
          const [x0, y0] = p0;
          const [x2, y2] = p3;
          const [xm, ym] = via();
          const cx = 2 * xm - 0.5 * x0 - 0.5 * x2;
          const cy = 2 * ym - 0.5 * y0 - 0.5 * y2;
          const N = 10;
          return Array.from({length: N + 1}, (_, i) => {
            const t  = i / N;
            const mt = 1 - t;
            return [
              mt * mt * x0 + 2 * mt * t * cx + t * t * x2,
              mt * mt * y0 + 2 * mt * t * cy + t * t * y2,
            ] as [number, number];
          });
        }

        // Ligne droite
        if (routing === 0) return [p0, p3];

        const [x1, y1] = p0;
        const [x2, y2] = p3;
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Stub = routing% de la distance axiale, plafonné à 45% pour éviter
        // que p1 et p2 se croisent sur les connexions très courtes.
        const useHorizontal = routingAxis === 'horizontal'
          || (routingAxis !== 'vertical' && Math.abs(dx) >= Math.abs(dy));

        if (useHorizontal) {
          const ox = Math.sign(dx) * Math.min(Math.abs(dx) * routing, Math.abs(dx) * 0.45);
          return [p0, [x1 + ox, y1], [x2 - ox, y2], p3];
        } else {
          const oy = Math.sign(dy) * Math.min(Math.abs(dy) * routing, Math.abs(dy) * 0.45);
          return [p0, [x1, y1 + oy], [x2, y2 - oy], p3];
        }
      },
      stroke,
      lineWidth,
      endArrow:   true,
      arrowSize,
      lineDash:   dashed ? [8, 6] : [],
      smoothness: 0.6,
      ...rest,
    });
  }
}
