/**
 * @file InfoCard.tsx
 * @description Carte de contenu avec header coloré et body flexible (children).
 *
 * Étend {@link Rect} — toutes les RectProps sont disponibles.
 * Le body accepte n'importe quels nœuds Motion Canvas en tant qu'enfants JSX.
 *
 * @example
 * ```tsx
 * import {InfoCard} from '../components';
 *
 * const memCard = createRef<InfoCard>();
 *
 * view.add(
 *   <InfoCard
 *     ref={memCard}
 *     title="MEMORY"
 *     subtitle="Mémoire RAM"
 *     color={PALETTE.blue}
 *     width={() => vW() * 0.25}
 *     height={() => vH() * 0.35}
 *     opacity={0}
 *   >
 *     <ProgressBar ref={memBar} ... />
 *     <Txt text="256 MB max" fill={PALETTE.ghost} fontSize={() => vW() * 0.012} />
 *   </InfoCard>
 * );
 *
 * yield* memCard().opacity(1, 0.4);
 * ```
 *
 * @remarks
 * **Pourquoi `layout: false` sur le root ?**
 * Avec `layout: true`, Motion Canvas calcule la hauteur du Rect en fonction
 * de ses enfants. Si un enfant dérive sa taille de `this.height()`, on obtient
 * une dépendance circulaire. `layout: false` + positionnement absolu des
 * enfants brise ce cycle : `this.height()` retourne directement la valeur
 * fournie par l'appelant, sans passer par le moteur de layout.
 *
 * @module
 */

import {Rect, RectProps, Layout, Txt} from '@motion-canvas/2d/lib/components';
import {PALETTE} from '../theme';

export interface InfoCardProps extends RectProps {
  /** Titre affiché dans le header (ex. "MEMORY", "CPU"). */
  title: string;
  /** Sous-titre optionnel sous le titre (monospace, plus petit). */
  subtitle?: string;
  /** Couleur du header, du stroke et du texte de titre. @defaultValue PALETTE.blue */
  color?: string;
  /** Contenu du body — tout nœud Motion Canvas valide. */
  children?: any;
}

/**
 * Carte avec header coloré et body libre.
 *
 * **Structure visuelle**
 * ```
 * ┌────────────────────────┐  ← y = -39% height (centre du header)
 * │ TITLE                  │
 * │ subtitle               │  ← header : 22% de la hauteur totale
 * ├────────────────────────┤
 * │                        │
 * │      [children]        │  ← body : 78% restants, centré
 * │                        │
 * └────────────────────────┘  ← y = +50% height
 * ```
 */
export class InfoCard extends Rect {
  // Compteur statique — rend les keys internes uniques entre instances
  private static _count = 0;

  public constructor({
    title,
    subtitle,
    color    = PALETTE.blue,
    children,
    ...rest
  }: InfoCardProps) {
    // layout: false — les enfants sont positionnés en absolu.
    // this.height() / this.width() retournent la valeur fournie par l'appelant
    // sans créer de dépendance circulaire avec le layout des enfants.
    super({
      fill:      PALETTE.bgCard,
      stroke:    color,
      lineWidth: 2,
      radius:    8,
      clip:      true,
      ...rest,
    });

    const id = InfoCard._count++;

    // Body Layout — positionné sous le header, même emprise que la zone restante
    const bodyLayout = new Layout({
      key:            `card-body-${id}`,
      layout:         true,
      width:          () => this.width(),
      height:         () => this.height() * 0.78,
      direction:      'column',
      alignItems:     'center',
      justifyContent: 'center',
      paddingLeft:    () => this.width()  * 0.06,
      paddingRight:   () => this.width()  * 0.06,
      paddingBottom:  () => this.height() * 0.04,
      // Centre du body : depuis le centre du parent (InfoCard)
      // top = -height/2, header occupe 22%, body occupe 78%
      // centre body = -height/2 + 22% + 78%/2 = height * 0.11
      y: () => this.height() * 0.11,
    });

    if (children != null) {
      bodyLayout.add(children);
    }

    this.add(
      <>
        {/* Header coloré — positionné en haut du Rect */}
        {/* centre header = -height/2 + 22%/2 = height * -0.39 */}
        <Rect
          key={`card-header-${id}`}
          width={() => this.width()}
          height={() => this.height() * 0.22}
          y={() => this.height() * -0.39}
          fill={color + '28'}
          layout
          direction={'column'}
          alignItems={'start'}
          justifyContent={'center'}
          paddingLeft={() => this.width() * 0.06}
        >
          <Txt
            key={`card-title-${id}`}
            text={title}
            fill={color}
            fontSize={() => this.height() * 0.09}
            fontFamily={'Space Grotesk, sans-serif'}
            fontWeight={700}
          />
          {subtitle && (
            <Txt
              key={`card-subtitle-${id}`}
              text={subtitle}
              fill={color + 'AA'}
              fontSize={() => this.height() * 0.065}
              fontFamily={'DM Mono, monospace'}
            />
          )}
        </Rect>

        {bodyLayout}
      </>,
    );
  }
}
