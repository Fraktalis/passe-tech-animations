/**
 * @file DiagramNode.tsx
 * @description Primitive « Node » du design system Passe-Tech (≥ 2026-05-20).
 * Représente toute entité : serveur, conteneur, base de données, personne, org…
 *
 * Presets disponibles : server | container | database | file | browser | terminal | person | org.
 * Chaque preset pré-remplit icon, color et borderStyle. Toute prop peut être surchargée.
 *
 * @example
 * ```tsx
 * import {DiagramNode} from '../../components';
 *
 * const serverRef = createRef<DiagramNode>();
 *
 * view.add(
 *   <DiagramNode
 *     ref={serverRef}
 *     preset="server"
 *     label="web-01"
 *     sublabel="nginx:80"
 *     initialState="idle"
 *     width={() => vW() * 0.14}
 *     height={() => vH() * 0.28}
 *     opacity={0}
 *   />
 * );
 *
 * yield* serverRef().opacity(1, 0.3);
 * yield* serverRef().setState('active', 0.15);
 * yield* serverRef().setState('error', 0.08);
 * ```
 *
 * @module
 */

import {Rect, RectProps, Layout, Txt, Icon} from '@motion-canvas/2d/lib/components';
import {all, ThreadGenerator} from '@motion-canvas/core';
import {PALETTE} from '../theme';

export type NodeState      = 'idle' | 'active' | 'highlighted' | 'error' | 'success';
export type NodePreset     = 'server' | 'container' | 'database' | 'file' | 'browser' | 'terminal' | 'person' | 'org';
export type NodeBorderStyle = 'solid' | 'dashed';

export interface DiagramNodeProps extends RectProps {
  /** Label principal (nom du service, machine, rôle…). */
  label: string;
  /** Texte secondaire (port, image, namespace…). */
  sublabel?: string;
  /** Icône unicode — surcharge le preset. Ignorée si `iconName` est fourni. */
  icon?: string;
  /** Identifiant d'icône pour le composant Icon (ex : `"mdi:server"`). Prioritaire sur `icon`. */
  iconName?: string;
  /** Couleur de bordure — surcharge le preset. */
  color?: string;
  /** Preset qui pré-remplit icon, color, borderStyle. */
  preset?: NodePreset;
  /** Bordure pleine ou tiretée. `container` est dashed par défaut. */
  borderStyle?: NodeBorderStyle;
  /** État initial du nœud. @defaultValue 'idle' */
  initialState?: NodeState;
}

// ── Preset defaults ─────────────────────────────────────────────────────────

const PRESET_ICON_NAMES: Record<NodePreset, string> = {
  server:    'mdi:server',
  container: 'mdi:docker',
  database:  'mdi:database',
  file:      'mdi:file-document-outline',
  browser:   'mdi:web',
  terminal:  'mdi:console',
  person:    'mdi:account-circle',
  org:       'mdi:domain',
};

const PRESET_COLORS: Record<NodePreset, string> = {
  server:    PALETTE.secondary,
  container: PALETTE.cyan,
  database:  PALETTE.amber,
  file:      PALETTE.secondary,
  browser:   PALETTE.secondary,
  terminal:  PALETTE.vert,
  person:    PALETTE.cream,
  org:       PALETTE.secondary,
};

const PRESET_DASHED: Record<NodePreset, boolean> = {
  server:    false,
  container: true,   // virtualisé/isolé
  database:  false,
  file:      false,
  browser:   false,
  terminal:  false,
  person:    false,
  org:       false,
};

// ── State styles ─────────────────────────────────────────────────────────────

function resolvedFill(state: NodeState, themeColor: string): string {
  switch (state) {
    case 'idle':        return PALETTE.nodeBg;
    case 'active':      return PALETTE.nodeActiveBg;
    case 'highlighted': return PALETTE.nodeActiveBg;
    case 'error':       return PALETTE.dsRose + '14';  // 8% opacity
    case 'success':     return PALETTE.dsGreen + '14';
  }
}

function resolvedStroke(state: NodeState, themeColor: string): string {
  switch (state) {
    case 'idle':        return themeColor + '66';  // 40% opacity
    case 'active':      return themeColor;
    case 'highlighted': return themeColor;
    case 'error':       return PALETTE.dsRose;
    case 'success':     return PALETTE.dsGreen;
  }
}

function resolvedLineWidth(state: NodeState): number {
  return state === 'highlighted' ? 3 : 2;
}

// ── Accent (top border asymétrique) ─────────────────────────────────────────

function resolvedAccent(state: NodeState, themeColor: string): string {
  switch (state) {
    case 'error':   return PALETTE.dsRose;
    case 'success': return PALETTE.dsGreen;
    default:        return themeColor;  // toujours full-opacity pour l'ancrage visuel
  }
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Primitive « Node » du design system.
 * Étend {@link Rect} — toutes les RectProps sont disponibles.
 */
export class DiagramNode extends Rect {
  private static _count = 0;
  /** Couleur thématique du nœud — conservée pour les transitions d'état. */
  private readonly _themeColor: string;
  /** Barre d'accent en haut — animée avec l'état. */
  private _accentRect!: Rect;

  public constructor({
    label,
    sublabel,
    icon,
    iconName,
    color,
    preset,
    borderStyle,
    initialState = 'idle',
    ...rest
  }: DiagramNodeProps) {
    const themeColor      = color ?? (preset ? PRESET_COLORS[preset] : PALETTE.secondary);
    const resolvedIconName = iconName ?? (preset ? PRESET_ICON_NAMES[preset] : undefined);
    const resolvedIcon     = icon ?? '▣';
    const isDashed         = borderStyle === 'dashed'
                      || (borderStyle === undefined && preset ? PRESET_DASHED[preset] : false);

    super({
      fill:        resolvedFill(initialState, themeColor),
      stroke:      resolvedStroke(initialState, themeColor),
      lineWidth:   resolvedLineWidth(initialState),
      lineDash:    isDashed ? [6, 4] : [],
      radius:      8,
      clip:        true,
      shadowBlur:  22,
      shadowColor: '#00000055',
      ...rest,
    });

    this._themeColor = themeColor;

    const id = DiagramNode._count++;

    const accentRect = new Rect({
      key:    `dnode-accent-${id}`,
      width:  2000,
      height: 4,
      fill:   resolvedAccent(initialState, themeColor),
      y:      () => -this.height() / 2 + 2,
    });
    this._accentRect = accentRect;

    this.add(
      <>
        {accentRect}
        <Layout
          key={`dnode-body-${id}`}
          layout
          direction={'column'}
          alignItems={'center'}
          justifyContent={'center'}
          gap={() => this.height() * 0.05}
          paddingTop={() => this.height() * 0.1}
          paddingBottom={() => this.height() * 0.1}
        >
        {resolvedIconName
          ? <Icon
              key={`dnode-icon-${id}`}
              icon={resolvedIconName}
              color={themeColor}
              size={() => this.width() * 0.15}
            />
          : <Txt
              key={`dnode-icon-${id}`}
              text={resolvedIcon}
              fill={themeColor}
              fontSize={() => this.width() * 0.25}
              fontFamily={'JetBrains Mono, DM Mono, monospace'}
            />
        }

        <Rect
          key={`dnode-divider-${id}`}
          width={() => this.width() * 0.65}
          height={1}
          fill={themeColor + '44'}
        />

        <Txt
          key={`dnode-label-${id}`}
          text={label}
          fill={PALETTE.cream}
          fontSize={() => this.height() * 0.1}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          fontWeight={700}
        />

        {sublabel && (
          <Txt
            key={`dnode-sublabel-${id}`}
            text={sublabel}
            fill={PALETTE.secondary}
            fontSize={() => this.height() * 0.075}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
          />
        )}
      </Layout>
      </>,
    );
  }

  /**
   * Anime la transition vers un nouvel état.
   * ```ts
   * yield* node.setState('active', 0.15);
   * yield* node.setState('error',  0.08);  // impact brutal
   * ```
   */
  public *setState(state: NodeState, duration = 0.15): ThreadGenerator {
    yield* all(
      this.fill(resolvedFill(state, this._themeColor), duration),
      this.stroke(resolvedStroke(state, this._themeColor), duration),
      this.lineWidth(resolvedLineWidth(state), duration),
      this._accentRect.fill(resolvedAccent(state, this._themeColor), duration),
    );
  }
}
