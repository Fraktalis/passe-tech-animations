/**
 * @file Zone.tsx
 * @description Primitive « Zone » du design system Passe-Tech (≥ 2026-05-20).
 * Périmètre délimitant un contexte : réseau, datacenter, zone de confiance, sandbox…
 *
 * La Zone est un fond décoratif avec un label. Les nœuds et connexions sont positionnés
 * par la scène à l'intérieur — ils ne sont pas enfants du composant Zone.
 * Les children JSX sont supportés et positionnés en absolu dans la zone.
 *
 * @example
 * ```tsx
 * import {Zone} from '../../components';
 *
 * view.add(
 *   <Zone
 *     preset="trusted"
 *     label="INTERNAL NETWORK"
 *     width={() => vW() * 0.55}
 *     height={() => vH() * 0.6}
 *     x={() => vW() * 0.1}
 *     opacity={0}
 *   />
 * );
 * ```
 *
 * @module
 */

import {Rect, RectProps, Txt} from '@motion-canvas/2d/lib/components';
import {PALETTE} from '../theme';

export type ZonePreset = 'network' | 'cloud' | 'trusted' | 'untrusted' | 'sandbox' | 'cluster';

export interface ZoneProps extends RectProps {
  /** Label affiché en haut à gauche, caps, monospace. */
  label?: string;
  /** Preset qui pré-remplit color et borderStyle. */
  preset?: ZonePreset;
  /** Surcharge la couleur du preset. */
  color?: string;
  /** Contenu additionnel positionné en absolu dans la zone. */
  children?: any;
}

const PRESET_COLORS: Record<ZonePreset, string> = {
  network:   PALETTE.secondary,
  cloud:     PALETTE.cyan,
  trusted:   PALETTE.dsGreen,
  untrusted: PALETTE.dsRose,
  sandbox:   PALETTE.dsRose,
  cluster:   PALETTE.cyan,
};

const PRESET_DASH: Record<ZonePreset, number[]> = {
  network:   [8, 6],
  cloud:     [8, 6],
  trusted:   [8, 6],
  untrusted: [8, 6],
  sandbox:   [4, 3, 4, 3],  // double-tirets
  cluster:   [8, 6],
};

/**
 * Périmètre contextuel.
 * Étend {@link Rect} — toutes les RectProps sont disponibles.
 * Le fond est toujours teinté à 6% de la couleur.
 */
export class Zone extends Rect {
  private static _count = 0;

  public constructor({
    label,
    preset,
    color,
    children,
    ...rest
  }: ZoneProps) {
    const themeColor = color ?? (preset ? PRESET_COLORS[preset] : PALETTE.secondary);
    const dashPattern = preset ? PRESET_DASH[preset] : [8, 6];

    super({
      fill:      themeColor + '0F',  // 6% opacity
      stroke:    themeColor + '99',  // 60% opacity
      lineWidth: 1,
      lineDash:  dashPattern,
      radius:    12,
      clip:      true,
      ...rest,
    });

    const id = Zone._count++;

    if (label) {
      this.add(
        <Txt
          key={`zone-label-${id}`}
          text={label}
          fill={themeColor + 'AA'}
          fontSize={() => this.width() * 0.035}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          fontWeight={700}
          // offset={[-1, -1]} ancre le coin haut-gauche du texte sur (x, y)
          // → le texte ne déborde jamais à gauche de la zone
          offset={[-1, -1]}
          x={() => -this.width() / 2 + 14}
          y={() => -this.height() / 2 + 10}
        />,
      );
    }

    if (children != null) {
      this.add(children);
    }
  }
}
