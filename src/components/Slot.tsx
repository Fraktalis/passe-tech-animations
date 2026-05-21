/**
 * @file Slot.tsx
 * @description Primitives « Slot » et « SlotGroup » du design system Passe-Tech (≥ 2026-05-20).
 *
 * `Slot` — case unitaire dans une structure ordonnée : message en queue, entrée d'index,
 *           frame de call stack, bloc. Rend les structures de données spatialement.
 *
 * `SlotGroup` — conteneur de N slots en rangée avec label de structure.
 *
 * @example
 * ```tsx
 * import {SlotGroup, Slot} from '../../components';
 *
 * const slot0 = createRef<Slot>();
 * const slot1 = createRef<Slot>();
 * const slot2 = createRef<Slot>();
 *
 * view.add(
 *   <SlotGroup
 *     label="QUEUE · CAPACITY 3"
 *     color={PALETTE.amber}
 *     width={() => vW() * 0.42}
 *     height={() => vH() * 0.18}
 *   >
 *     <Slot ref={slot0} index={0} content="msg-01" initialState="filled"
 *       width={() => vW() * 0.08} height={() => vH() * 0.1} />
 *     <Slot ref={slot1} index={1} content="msg-02" initialState="filled"
 *       width={() => vW() * 0.08} height={() => vH() * 0.1} />
 *     <Slot ref={slot2} index={2} content=""        initialState="empty"
 *       width={() => vW() * 0.08} height={() => vH() * 0.1} />
 *   </SlotGroup>
 * );
 *
 * yield* slot0().setState('active', 0.12);
 * yield* slot0().setState('consumed', 0.25);
 * ```
 *
 * @module
 */

import {Rect, RectProps, Layout, LayoutProps, Txt} from '@motion-canvas/2d/lib/components';
import {all, ThreadGenerator} from '@motion-canvas/core';
import {PALETTE} from '../theme';

// ── Slot ─────────────────────────────────────────────────────────────────────

export type SlotState = 'empty' | 'filled' | 'active' | 'consumed' | 'error';

export interface SlotProps extends RectProps {
  /** Index ou identifiant — affiché en haut en monospace. */
  index: number | string;
  /** Contenu résumé — affiché en bas (vide si état 'empty'). */
  content?: string;
  /** Couleur thématique (active/error state). @defaultValue PALETTE.amber */
  color?: string;
  /** État initial. @defaultValue 'empty' */
  initialState?: SlotState;
}

function slotFill(state: SlotState, themeColor: string): string {
  switch (state) {
    case 'empty':    return PALETTE.nodeBg;
    case 'filled':   return PALETTE.nodeActiveBg;
    case 'active':   return themeColor + '26';  // 15%
    case 'consumed': return PALETTE.nodeBg;
    case 'error':    return PALETTE.dsRose + '1A';  // 10%
  }
}

function slotStroke(state: SlotState, themeColor: string): string {
  switch (state) {
    case 'empty':    return PALETTE.secondary + '33';  // 20%
    case 'filled':   return PALETTE.secondary + '99';  // 60%
    case 'active':   return themeColor;
    case 'consumed': return PALETTE.secondary + '33';
    case 'error':    return PALETTE.dsRose;
  }
}

/**
 * Case unitaire d'une structure spatiale.
 * Étend {@link Rect} — toutes les RectProps sont disponibles.
 */
export class Slot extends Rect {
  private static _count = 0;
  private readonly _themeColor: string;
  // Direct ref to the height lambda — bypasses this.height() so Txt children
  // don't create a dep on Slot's reactive layout signal (causes false-positive
  // cycle detection on timeline seek when Slot is a flex child).
  private readonly _h: () => number;

  public constructor({
    index,
    content      = '',
    color        = PALETTE.amber,
    initialState = 'empty',
    ...rest
  }: SlotProps) {
    super({
      fill:      slotFill(initialState, color),
      stroke:    slotStroke(initialState, color),
      lineWidth: 1,
      radius:    4,
      clip:      true,
      ...rest,
    });

    this._themeColor = color;
    const rawH = rest.height;
    this._h = typeof rawH === 'function'
      ? (rawH as () => number)
      : () => (typeof rawH === 'number' ? rawH : 80);

    const id = Slot._count++;

    this.add(
      <>
        <Txt
          key={`slot-index-${id}`}
          text={String(index)}
          fill={PALETTE.secondary}
          fontSize={() => this._h() * 0.22}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          y={() => content ? -this._h() * 0.16 : 0}
        />
        {content && (
          <Txt
            key={`slot-content-${id}`}
            text={content}
            fill={PALETTE.cream}
            fontSize={() => this._h() * 0.18}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
            fontWeight={700}
            y={() => this._h() * 0.14}
          />
        )}
      </>,
    );
  }

  /**
   * Anime la transition vers un nouvel état.
   * ```ts
   * yield* slot.setState('active', 0.12);
   * yield* slot.setState('consumed', 0.25);
   * ```
   */
  public *setState(state: SlotState, duration = 0.12): ThreadGenerator {
    yield* all(
      this.fill(slotFill(state, this._themeColor), duration),
      this.stroke(slotStroke(state, this._themeColor), duration),
    );
  }
}

// ── SlotGroup ─────────────────────────────────────────────────────────────────

export interface SlotGroupProps extends RectProps {
  /** Label de structure — ex: `QUEUE · CAPACITY 5`. Caps, monospace. */
  label?: string;
  /** Couleur de bordure et label. @defaultValue PALETTE.secondary */
  color?: string;
  /** Espacement entre les slots (gap). */
  gap?: number | (() => number);
  /** Slots à afficher — créés dans la scène avec leurs refs. */
  children?: any;
}

/**
 * Conteneur de slots en rangée horizontale.
 * Les slots sont créés dans la scène et passés comme children avec leurs refs.
 * Étend {@link Rect}.
 */
export class SlotGroup extends Rect {
  private static _count = 0;

  public constructor({
    label,
    color    = PALETTE.secondary,
    gap,
    children,
    ...rest
  }: SlotGroupProps) {
    super({
      fill:      color + '0A',  // 4%
      stroke:    color + '66',  // 40%
      lineWidth: 1,
      lineDash:  [6, 4],
      radius:    8,
      ...rest,
    });

    const id = SlotGroup._count++;

    const slotRow = new Layout({
      key:            `slotgroup-row-${id}`,
      layout:         true,
      direction:      'row',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            gap ?? 6,
      // décalé vers le bas pour laisser place au label
      y:              label ? () => this.height() * 0.07 : 0,
    });

    if (children != null) {
      slotRow.add(children);
    }

    this.add(
      <>
        {label && (
          <Txt
            key={`slotgroup-label-${id}`}
            text={label}
            fill={color + 'AA'}
            fontSize={9}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
            fontWeight={700}
            offset={[-1, -1]}
            x={() => -this.width() / 2 + 12}
            y={() => -this.height() / 2 + 10}
          />
        )}
        {slotRow}
      </>,
    );
  }
}
