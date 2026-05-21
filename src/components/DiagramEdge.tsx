/**
 * @file DiagramEdge.tsx
 * @description Primitive « Edge » du design system Passe-Tech (≥ 2026-05-20).
 * Connexion entre deux nœuds — directions uni/bi, styles solid/dashed/animated.
 *
 * @example
 * ```tsx
 * import {DiagramEdge} from '../../components';
 * import {spawn} from '@motion-canvas/core';
 *
 * const edgeRef = createRef<DiagramEdge>();
 *
 * view.add(
 *   <DiagramEdge
 *     ref={edgeRef}
 *     from={() => [vW() * -0.15, 0]}
 *     to={() =>   [vW() *  0.15, 0]}
 *     direction="uni"
 *     edgeStyle="animated"
 *     label="HTTP/1.1"
 *     stroke={PALETTE.cyan}
 *     end={0} opacity={0}
 *   />
 * );
 *
 * edgeRef().opacity(1);
 * yield* edgeRef().end(1, 0.5);
 * yield spawn(edgeRef().animateDash());  // ant-march continu
 * ```
 *
 * @module
 */

import {Line, LineProps, Txt} from '@motion-canvas/2d/lib/components';
import {loop, ThreadGenerator} from '@motion-canvas/core';
import {linear} from '@motion-canvas/core/lib/tweening';
import {PALETTE} from '../theme';

export type EdgeDirection = 'uni' | 'bi';
export type EdgeStyle     = 'solid' | 'dashed' | 'animated';

export interface DiagramEdgeProps extends Omit<LineProps, 'points'> {
  /** Point de départ — fonction réactive obligatoire. */
  from: () => [number, number];
  /** Point d'arrivée — fonction réactive obligatoire. */
  to: () => [number, number];
  /** Flèche uni- ou bi-directionnelle (≠ `direction` de FlexLayout). @defaultValue 'uni' */
  edgeDirection?: EdgeDirection;
  /** Rendu : continu, tirets statiques, ou tirets animés (ant-march). @defaultValue 'solid' */
  edgeStyle?: EdgeStyle;
  /** Label affiché au milieu de la ligne (protocole, port…). */
  label?: string;
  /** Taille de la pointe de flèche. @defaultValue 10 */
  arrowSize?: number;
}

/**
 * Connexion entre deux points réactifs.
 * Étend {@link Line} — toutes les LineProps sont disponibles, notamment `end` pour l'animation de tracé.
 *
 * **Ant-march** : appeler `yield spawn(edge.animateDash())` pour démarrer l'animation continue.
 */
export class DiagramEdge extends Line {
  private static _count = 0;

  public constructor({
    from,
    to,
    edgeDirection = 'uni',
    edgeStyle     = 'solid',
    label,
    arrowSize     = 10,
    stroke        = PALETTE.secondary,
    lineWidth     = 2,
    ...rest
  }: DiagramEdgeProps) {
    const isAnimated = edgeStyle === 'animated';
    const isDashed   = edgeStyle === 'dashed' || isAnimated;

    super({
      points:     () => [from(), to()],
      stroke,
      lineWidth,
      endArrow:   true,
      startArrow: edgeDirection === 'bi',
      arrowSize,
      lineDash:   isDashed ? [10, 8] : [],
      ...rest,
    });

    const id = DiagramEdge._count++;

    if (label) {
      this.add(
        <Txt
          key={`dedge-label-${id}`}
          text={label}
          fill={PALETTE.secondary}
          fontSize={11}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          x={() => (from()[0] + to()[0]) / 2}
          y={() => (from()[1] + to()[1]) / 2 - 14}
        />,
      );
    }
  }

  /**
   * Animation « ant-march » continue — à lancer via `yield spawn(edge.animateDash())`.
   * Arrêter via `cancel(task)` sur le handle retourné par `spawn`.
   *
   * @param period - Durée d'un cycle complet (secondes). @defaultValue 0.8
   */
  public *animateDash(period = 0.8): ThreadGenerator {
    yield* loop(() =>
      this.lineDashOffset(this.lineDashOffset() - 18, period, linear),
    );
  }
}
