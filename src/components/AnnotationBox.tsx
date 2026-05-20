/**
 * @file AnnotationBox.tsx
 * @description Boîte d'annotation : titre coloré + liste de lignes descriptives.
 * Positionnée à côté d'un élément du diagramme, elle est complétée par un
 * {@link ConnectionArrow} séparé pour la flèche pointant vers la cible.
 *
 * @example
 * ```tsx
 * import {AnnotationBox, ConnectionArrow} from '../components';
 *
 * const annotationRef = createRef<AnnotationBox>();
 * const arrowRef      = createRef<ConnectionArrow>();
 *
 * view.add(
 *   <>
 *     <AnnotationBox
 *       ref={annotationRef}
 *       title="Double Base64"
 *       lines={['encode → encode', 'contourne les WAF']}
 *       color={PALETTE.rose}
 *       width={() => vW() * 0.22}
 *       height={() => vH() * 0.18}
 *       x={() => vW() * 0.3}
 *       y={() => vH() * -0.1}
 *       opacity={0}
 *     />
 *     <ConnectionArrow
 *       ref={arrowRef}
 *       from={() => [vW() * 0.19, vH() * -0.1]}
 *       to={() =>   [vW() * 0.08, vH() * 0.02]}
 *       stroke={PALETTE.rose}
 *       dashed
 *       end={0}
 *       opacity={0}
 *     />
 *   </>
 * );
 *
 * yield* annotationRef().opacity(1, 0.4);
 * arrowRef().opacity(1);
 * yield* arrowRef().end(1, 0.45);
 * ```
 *
 * @module
 */

import {Rect, RectProps, Layout, Txt} from '@motion-canvas/2d/lib/components';
import {PALETTE} from '../theme';

export interface AnnotationBoxProps extends RectProps {
  /** Titre en haut de la boîte (couleur = `color`). */
  title: string;
  /** Lignes de texte descriptives sous le titre (couleur = cream). */
  lines?: string[];
  /** Couleur du titre et du stroke. @defaultValue PALETTE.rose */
  color?: string;
}

/**
 * Boîte d'annotation avec titre coloré et corps textuel.
 * Étend {@link Rect} — toutes les RectProps sont disponibles.
 *
 * La flèche de pointage est intentionnellement gérée en dehors du composant
 * via {@link ConnectionArrow} pour conserver la flexibilité du timing d'animation.
 *
 * Utilise `layout: false` sur le root pour éviter une dépendance circulaire.
 * Voir InfoCard pour le détail.
 */
export class AnnotationBox extends Rect {
  // Compteur statique — rend les keys internes uniques entre instances
  private static _count = 0;

  public constructor({
    title,
    lines = [],
    color = PALETTE.rose,
    ...rest
  }: AnnotationBoxProps) {
    super({
      fill:      PALETTE.bgCard,
      stroke:    color,
      lineWidth: 2,
      radius:    6,
      clip:      true,
      ...rest,
    });

    const id = AnnotationBox._count++;

    this.add(
      <Layout
        key={`annotation-content-${id}`}
        layout
        direction={'column'}
        alignItems={'start'}
        justifyContent={'start'}
        width={() => this.width()}
        height={() => this.height()}
        paddingTop={()    => this.height() * 0.1}
        paddingBottom={() => this.height() * 0.1}
        paddingLeft={()   => this.width()  * 0.08}
        paddingRight={()  => this.width()  * 0.08}
        gap={() => this.height() * 0.07}
      >
        <Txt
          key={`annotation-title-${id}`}
          text={title}
          fill={color}
          fontSize={() => this.height() * 0.16}
          fontFamily={'Space Grotesk, sans-serif'}
          fontWeight={700}
          lineHeight={-5}
        />

        {lines.map((lineText, lineIndex) => (
          <Txt
            key={`annotation-line-${id}-${lineIndex}`}
            text={lineText}
            fill={PALETTE.cream}
            fontSize={() => this.height() * 0.11}
            fontFamily={'DM Mono, monospace'}
            lineHeight={1.2}
          />
        ))}
      </Layout>,
    );
  }
}
