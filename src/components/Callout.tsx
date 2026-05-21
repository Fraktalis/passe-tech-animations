/**
 * @file Callout.tsx
 * @description Primitive « Callout » du design system Passe-Tech (≥ 2026-05-20).
 * Annotation ancrée à un nœud, une edge ou une zone. Jamais flottante.
 * La flèche d'ancrage est gérée séparément via {@link DiagramEdge} ou {@link ConnectionArrow}.
 *
 * Max 2 lignes de body — au-delà, le contenu est trop dense pour l'animation.
 *
 * @example
 * ```tsx
 * import {Callout, ConnectionArrow} from '../../components';
 *
 * const calloutRef = createRef<Callout>();
 * const arrowRef   = createRef<ConnectionArrow>();
 *
 * view.add(
 *   <>
 *     <Callout
 *       ref={calloutRef}
 *       title="Token expiré"
 *       body="401 Unauthorized → redirect /login"
 *       color={PALETTE.dsRose}
 *       width={() => vW() * 0.24}
 *       height={() => vH() * 0.14}
 *       x={() => vW() * 0.3}
 *       y={() => vH() * -0.15}
 *       opacity={0}
 *     />
 *     <ConnectionArrow
 *       ref={arrowRef}
 *       from={() => [vW() * 0.18, vH() * -0.15]}
 *       to={() =>   [vW() * 0.08, vH() * -0.02]}
 *       stroke={PALETTE.dsRose}
 *       dashed end={0} opacity={0}
 *     />
 *   </>
 * );
 *
 * yield* calloutRef().opacity(1, 0.2);
 * arrowRef().opacity(1);
 * yield* arrowRef().end(1, 0.35);
 * yield* calloutRef().setState('error', 0.08);
 * ```
 *
 * @module
 */

import {Rect, RectProps, Layout, Txt} from '@motion-canvas/2d/lib/components';
import {all, ThreadGenerator} from '@motion-canvas/core';
import {PALETTE} from '../theme';

export type CalloutState = 'idle' | 'active' | 'error' | 'success';

export interface CalloutProps extends RectProps {
  /** Titre — une ligne max. Police sans-serif bold. */
  title: string;
  /** Description — deux lignes max. Police sans-serif regular, secondaire. */
  body?: string;
  /** Couleur de la bordure et du titre. @defaultValue PALETTE.secondary */
  color?: string;
  /** État initial. @defaultValue 'idle' */
  initialState?: CalloutState;
}

function calloutStroke(state: CalloutState, baseColor: string): string {
  switch (state) {
    case 'idle':    return baseColor;
    case 'active':  return baseColor;
    case 'error':   return PALETTE.dsRose;
    case 'success': return PALETTE.dsGreen;
  }
}

function calloutTitleColor(state: CalloutState, baseColor: string): string {
  switch (state) {
    case 'idle':    return baseColor;
    case 'active':  return baseColor;
    case 'error':   return PALETTE.dsRose;
    case 'success': return PALETTE.dsGreen;
  }
}

/**
 * Boîte d'annotation ancrée.
 * Étend {@link Rect} — toutes les RectProps sont disponibles.
 */
export class Callout extends Rect {
  private static _count = 0;
  private readonly _baseColor: string;
  private _titleTxt!: Txt;
  private _accentRect!: Rect;

  public constructor({
    title,
    body,
    color         = PALETTE.secondary,
    initialState  = 'idle',
    ...rest
  }: CalloutProps) {
    super({
      fill:      PALETTE.nodeBg,
      stroke:    calloutStroke(initialState, color),
      lineWidth: 1,
      radius:    6,
      clip:      true,
      ...rest,
    });

    this._baseColor = color;

    const id = Callout._count++;

    const titleTxt = new Txt({
      key:        `callout-title-${id}`,
      text:       title,
      fill:       calloutTitleColor(initialState, color),
      fontSize:   () => this.height() * 0.22,
      fontFamily: 'Inter, DM Sans, sans-serif',
      fontWeight: 700,
    });
    this._titleTxt = titleTxt;

    const accentRect = new Rect({
      key:    `callout-accent-${id}`,
      width:  2000,
      height: 4,
      fill:   calloutStroke(initialState, color),
      y:      () => -this.height() / 2 + 2,
    });
    this._accentRect = accentRect;

    this.add(
      <>
        {accentRect}
        <Layout
          key={`callout-body-${id}`}
          layout
          direction={'column'}
          alignItems={'start'}
          justifyContent={'center'}
          paddingLeft={()  => this.width()  * 0.08}
          paddingRight={()  => this.width()  * 0.08}
          paddingTop={()    => this.height() * 0.1}
          paddingBottom={()  => this.height() * 0.1}
          gap={() => this.height() * 0.08}
        >
        {titleTxt}
        {body && (
          <Txt
            key={`callout-body-txt-${id}`}
            text={body}
            fill={PALETTE.secondary}
            fontSize={() => this.height() * 0.17}
            fontFamily={'Inter, DM Sans, sans-serif'}
            fontWeight={400}
            textWrap
            width={() => this.width() * 0.84}
          />
        )}
      </Layout>
      </>,
    );
  }

  /**
   * Anime la transition vers un nouvel état (couleurs de bordure, accent et titre).
   * ```ts
   * yield* callout.setState('error', 0.08);
   * ```
   */
  public *setState(state: CalloutState, duration = 0.15): ThreadGenerator {
    const newStroke = calloutStroke(state, this._baseColor);
    const newTitle  = calloutTitleColor(state, this._baseColor);
    yield* all(
      this.stroke(newStroke, duration),
      this._accentRect.fill(newStroke, duration),
      this._titleTxt.fill(newTitle, duration),
    );
  }
}
