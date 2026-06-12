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
import {all, waitFor, ThreadGenerator} from '@motion-canvas/core';
import {PALETTE} from '../theme';

/**
 * Réglage du temps de lecture proportionnel à la longueur du texte.
 * `READ_BASE` est le plancher incompressible (temps de réaction / d'accroche),
 * `READ_PER_CHAR` les secondes ajoutées par caractère (titre + body).
 * ≈ 22 caractères/seconde, légèrement plus rapide que le standard sous-titres
 * (17 cps) car la narration renforce le texte affiché.
 */
const READ_BASE = 0.8;
const READ_PER_CHAR = 0.045;

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
  private readonly _title: string;
  private readonly _body: string;
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
    this._title = title;
    this._body = body ?? '';

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

  /**
   * Durée de lecture conseillée pour ce callout, **proportionnelle à la
   * longueur du texte affiché** (titre + body). Un callout dense reste donc
   * plus longtemps à l'écran qu'un callout court.
   *
   * À passer à {@link waitFor} après le fade-in, ou via le raccourci
   * {@link hold}.
   *
   * @param perChar  Secondes ajoutées par caractère. @defaultValue {@link READ_PER_CHAR}
   * @param base     Plancher incompressible. @defaultValue {@link READ_BASE}
   */
  public readTime(perChar = READ_PER_CHAR, base = READ_BASE): number {
    const chars = this._title.length + this._body.length;
    return base + chars * perChar;
  }

  /**
   * Maintient le callout à l'écran le temps de le lire (voir {@link readTime}).
   * À utiliser à la place d'un `waitFor` fixe juste après la révélation :
   * ```ts
   * yield* callout().opacity(1, 0.3);
   * yield* callout().hold();        // dwell ∝ longueur du texte
   * ```
   * @param extra  Secondes ajoutées au-delà du temps de lecture. @defaultValue 0
   */
  public *hold(extra = 0): ThreadGenerator {
    yield* waitFor(this.readTime() + extra);
  }
}
