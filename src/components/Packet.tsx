/**
 * @file Packet.tsx
 * @description Primitive « Packet » du design system Passe-Tech (≥ 2026-05-20).
 * Représente un élément en transit : paquet réseau, requête HTTP, message, secret…
 * Sa position est entièrement gérée par la scène.
 *
 * @example
 * ```tsx
 * import {Packet} from '../../components';
 * import {easeInOutCubic} from '@motion-canvas/core';
 *
 * const pkt = createRef<Packet>();
 *
 * view.add(
 *   <Packet
 *     ref={pkt}
 *     content="GET /api"
 *     color={PALETTE.cyan}
 *     size="md"
 *     x={() => vW() * -0.3}
 *     y={() => vH() * -0.05}
 *     opacity={0}
 *   />
 * );
 *
 * yield* pkt().opacity(1, 0.2);
 * yield* pkt().moveTo([vW() * 0.3, vH() * -0.05], 0.8);
 * yield* pkt().opacity(0, 0.15);
 * ```
 *
 * @module
 */

import {Rect, RectProps, Txt} from '@motion-canvas/2d/lib/components';
import {ThreadGenerator, Vector2} from '@motion-canvas/core';
import {easeInOutCubic} from '@motion-canvas/core/lib/tweening';
import {PALETTE} from '../theme';

export type PacketSize = 'sm' | 'md' | 'lg';

export interface PacketProps extends RectProps {
  /** Contenu affiché — court : `SYN`, `GET /`, `200 OK`, `JWT`. */
  content: string;
  /** Couleur du fond et de la bordure. @defaultValue PALETTE.cyan */
  color?: string;
  /** Taille du paquet — sm pour bas niveau, lg pour payload applicatif (≠ `size` Vector2 de RectProps). @defaultValue 'md' */
  packetSize?: PacketSize;
}

const SIZE_FONT: Record<PacketSize, number> = {
  sm: 0.38,
  md: 0.33,
  lg: 0.28,
};

/**
 * Élément mobile représentant un flux en transit.
 * Étend {@link Rect} — position animée librement par la scène.
 */
export class Packet extends Rect {
  private static _count = 0;

  public constructor({
    content,
    color      = PALETTE.cyan,
    packetSize = 'md',
    ...rest
  }: PacketProps) {
    super({
      fill:      color + '22',  // fond semi-transparent
      stroke:    color,
      lineWidth: 1,
      radius:    4,
      ...rest,
    });

    const id = Packet._count++;

    this.add(
      <Txt
        key={`pkt-content-${id}`}
        text={content}
        fill={color}
        fontSize={() => this.height() * SIZE_FONT[packetSize]}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
      />,
    );
  }

  /**
   * Déplace le paquet vers une position cible (nommé `flyTo` pour éviter le conflit avec `Node.moveTo(index)`).
   * @param target - `[x, y]` en coordonnées scène.
   * @param duration - Durée en secondes. @defaultValue 0.8
   */
  public *flyTo(target: [number, number], duration = 0.8): ThreadGenerator {
    yield* this.position(new Vector2(target[0], target[1]), duration, easeInOutCubic);
  }
}
