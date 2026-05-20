/**
 * @file ConnectedNode.tsx
 * @description Nœud de diagramme : icône + label + sublabel + compteur optionnel.
 * Représente un service, processus ou machine dans un schéma réseau ou système.
 *
 * Le `counterValue` est un **signal externe** géré par la scène — le composant
 * se contente d'en afficher la valeur de façon réactive.
 *
 * @example
 * ```tsx
 * import {ConnectedNode} from '../components';
 *
 * const connCount = createSignal(0);
 * const serverNode = createRef<ConnectedNode>();
 *
 * view.add(
 *   <ConnectedNode
 *     ref={serverNode}
 *     icon="▣"
 *     label="Server"
 *     sublabel="nginx:80"
 *     counterLabel="conn:"
 *     counterValue={connCount}
 *     color={PALETTE.vert}
 *     width={() => vW() * 0.16}
 *     height={() => vH() * 0.25}
 *     opacity={0}
 *   />
 * );
 *
 * yield* serverNode().opacity(1, 0.4);
 * yield* connCount(connCount() + 1, 0.2);  // animé depuis la scène
 * ```
 *
 * @module
 */

import {Rect, RectProps, Layout, Txt} from '@motion-canvas/2d/lib/components';
import {SignalValue} from '@motion-canvas/core';
import {PALETTE} from '../theme';

export interface ConnectedNodeProps extends RectProps {
  /** Symbole ou caractère unicode affiché en grand. @defaultValue '▣' */
  icon?: string;
  /** Label principal du nœud (ex. "Server", "LB", "Client"). */
  label: string;
  /** Texte secondaire (ex. nom du service, port, namespace). */
  sublabel?: string;
  /** Libellé précédant le compteur (ex. "conn:", "req:"). */
  counterLabel?: string;
  /**
   * Valeur du compteur — signal externe créé dans la scène.
   * ```ts
   * const requestCount = createSignal(0);
   * <ConnectedNode counterValue={requestCount} ... />
   * yield* requestCount(requestCount() + 1, 0.2);
   * ```
   */
  counterValue?: SignalValue<number | string>;
  /** Couleur du stroke, de l'icône et du compteur. @defaultValue PALETTE.blue */
  color?: string;
}

/**
 * Nœud de diagramme avec icône, label et compteur externe réactif.
 * Étend {@link Rect} — toutes les RectProps sont disponibles.
 *
 * Utilise `layout: false` sur le root pour éviter une dépendance circulaire
 * entre `this.height()` et le moteur de layout. Voir InfoCard pour le détail.
 */
export class ConnectedNode extends Rect {
  // Compteur statique — rend les keys internes uniques entre instances
  private static _count = 0;

  public constructor({
    icon         = '▣',
    label,
    sublabel,
    counterLabel,
    counterValue,
    color        = PALETTE.blue,
    ...rest
  }: ConnectedNodeProps) {
    super({
      fill:      PALETTE.bgCard,
      stroke:    color,
      lineWidth: 2,
      radius:    8,
      clip:      true,
      ...rest,
    });

    const id         = ConnectedNode._count++;
    const hasCounter = counterValue !== undefined;

    // Contenu centré dans un Layout interne — layout: false sur le root évite
    // la dépendance circulaire avec this.height() / this.width().
    this.add(
      <Layout
        key={`node-content-${id}`}
        layout
        width={() => this.width()}
        height={() => this.height()}
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => this.height() * 0.05}
        paddingTop={() => this.height() * 0.08}
        paddingBottom={() => this.height() * 0.08}
      >
        <Txt
          key={`node-icon-${id}`}
          text={icon}
          fill={color}
          fontSize={() => this.width() * 0.28}
          fontFamily={'DM Mono, monospace'}
        />

        <Rect
          key={`node-divider-${id}`}
          width={() => this.width() * 0.7}
          height={1}
          fill={color + '44'}
        />

        <Txt
          key={`node-label-${id}`}
          text={label}
          fill={PALETTE.cream}
          fontSize={() => this.height() * 0.1}
          fontFamily={'Space Grotesk, sans-serif'}
          fontWeight={700}
        />

        {sublabel && (
          <Txt
            key={`node-sublabel-${id}`}
            text={sublabel}
            fill={PALETTE.ghost}
            fontSize={() => this.height() * 0.075}
            fontFamily={'DM Mono, monospace'}
          />
        )}

        {hasCounter && (
          <Layout
            key={`node-counter-${id}`}
            layout
            direction={'row'}
            alignItems={'center'}
            gap={() => this.width() * 0.025}
          >
            {counterLabel && (
              <Txt
                key={`node-counter-label-${id}`}
                text={counterLabel}
                fill={PALETTE.ghost}
                fontSize={() => this.height() * 0.075}
                fontFamily={'DM Mono, monospace'}
              />
            )}
            <Txt
              key={`node-counter-value-${id}`}
              text={() => String(
                typeof counterValue === 'function'
                  ? (counterValue as () => number | string)()
                  : (counterValue ?? ''),
              )}
              fill={color}
              fontSize={() => this.height() * 0.075}
              fontFamily={'DM Mono, monospace'}
              fontWeight={700}
            />
          </Layout>
        )}
      </Layout>,
    );
  }
}
