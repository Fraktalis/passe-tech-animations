/**
 * @file Terminal.tsx
 * @description Composant terminal fenêtré réutilisable pour Motion Canvas.
 *
 * Étend {@link Rect} — toutes les props `RectProps` sont disponibles
 * (position, taille, opacité, zIndex, scale, etc.).
 *
 * @example Utilisation minimale
 * ```tsx
 * import {Terminal} from '../components';
 *
 * const term = createRef<Terminal>();
 *
 * view.add(
 *   <Terminal
 *     ref={term}
 *     title="bash"
 *     fontSize={() => vW() * 0.016}
 *     width={() => vW() * 0.52}
 *     height={() => vH() * 0.46}
 *     opacity={0}
 *   />
 * );
 *
 * yield* term().opacity(1, 0.5);
 *
 * const blink = yield term().startBlink();    // tâche de fond
 * yield* term().typewrite('$ pip install litellm', {prompt: false});
 * yield* term().typewrite('Successfully installed ✓', {color: 'vert'});
 *
 * cancel(blink);                              // import {cancel} from '@motion-canvas/core'
 * yield* term().clear(0.15);
 * ```
 *
 * @module
 */

import {Rect, RectProps, Layout, Txt, Circle} from '@motion-canvas/2d/lib/components';
import {initial, signal} from '@motion-canvas/2d/lib/decorators';
import {
  createRef,
  Reference,
  SignalValue,
  SimpleSignal,
  ThreadGenerator,
  chain,
  loop,
  waitFor,
} from '@motion-canvas/core';

// ─── Palette interne ────────────────────────────────────────────────────────

/**
 * Couleurs internes du composant Terminal, alignées sur la palette Passe-Tech.
 * Utilisées comme valeur de `color` dans {@link TypewriteOpts}.
 *
 * @internal
 */
const TC = {
  bg:     '#161B22',
  border: '#484F58',
  cream:  '#F9F9F6',
  ghost:  '#484F58',
  vert:   '#6DFF8A',
  rose:   '#FF3E6C',
  blue:   '#58A6FF',
  jaune:  '#FFE14D',
  danger: '#F85149',
} as const;

// ─── Types publics ───────────────────────────────────────────────────────────

/**
 * Couleur acceptée par les méthodes du Terminal.
 *
 * Peut être :
 * - une clé de la palette interne : `'cream'`, `'ghost'`, `'vert'`, `'rose'`,
 *   `'blue'`, `'jaune'`, `'danger'`
 * - n'importe quelle chaîne CSS valide : `'#FF3E6C'`, `'rgba(255,0,0,0.5)'`
 */
export type TermColor = keyof typeof TC | (string & {});

/**
 * Options passées à {@link Terminal.typewrite}.
 */
export interface TypewriteOpts {
  /**
   * Délai entre chaque caractère, en secondes.
   *
   * @defaultValue 0.04
   */
  charDelay?: number;

  /**
   * Couleur du texte tapé.
   * Accepte une clé {@link TermColor} ou une chaîne hex brute.
   *
   * @defaultValue 'cream'
   */
  color?: TermColor;

  /**
   * Si `true`, préfixe le texte avec `$ ` avant de taper.
   *
   * @defaultValue false
   *
   * @example
   * ```ts
   * yield* term().typewrite('ls -la', {prompt: true});
   * // affiche : "$ ls -la"
   * ```
   */
  prompt?: boolean;
}

/**
 * Props du composant {@link Terminal}.
 * Étend {@link RectProps} — toutes les propriétés de `Rect` sont disponibles.
 */
export interface TerminalProps extends RectProps {
  /**
   * Texte affiché dans la barre de titre de la fenêtre.
   *
   * C'est un signal Motion Canvas : il peut être animé après montage.
   *
   * @defaultValue 'bash'
   *
   * @example Animation du titre
   * ```ts
   * yield* term().title('zsh — ~/project', 0.3);
   * ```
   */
  title?: SignalValue<string>;

  /**
   * Taille de fonte des lignes de texte du terminal.
   *
   * @remarks
   * Passer une **fonction** pour un sizing réactif lié à la résolution :
   * ```ts
   * fontSize={() => vW() * 0.016}
   * ```
   * Passer un **nombre** pour une valeur fixe en pixels :
   * ```ts
   * fontSize={24}
   * ```
   *
   * @defaultValue 22
   */
  fontSize?: SignalValue<number>;

  /**
   * Nombre de lignes de texte pré-allouées dans le corps du terminal.
   *
   * @remarks
   * Les lignes sont créées à la construction et réutilisées. Dépasser cette
   * limite lors des appels à {@link Terminal.typewrite} / {@link Terminal.writeLine}
   * est silencieux (la ligne supplémentaire est ignorée).
   *
   * @defaultValue 8
   */
  maxLines?: number;
}

// ─── Composant ──────────────────────────────────────────────────────────────

/**
 * Terminal fenêtré réutilisable pour les animations Motion Canvas.
 *
 * @remarks
 * **Structure visuelle**
 * ```
 * ┌─────────────────────────────────┐
 * │ ● ● ●  bash                     │  ← barre de titre (Rect)
 * ├─────────────────────────────────┤
 * │ $ pip install litellm           │  ← ligne complète (row: Txt)
 * │ Collecting litellm...           │
 * │ Successfully installed ✓        │
 * │ █                               │  ← ligne active (row: Txt + curseur Rect)
 * └─────────────────────────────────┘
 *
 * Chaque ligne est un `Layout(row)` contenant un `Txt` et un `Rect` curseur.
 * Seul le curseur de la ligne active (`_nextLine`) est visible ; les autres
 * sont masqués. Cela garantit que le curseur apparaît toujours immédiatement
 * après le dernier caractère tapé.
 * ```
 *
 * **Fonctionnement des lignes**
 *
 * Le Terminal pré-alloue `maxLines` nœuds `Txt` vides à la construction.
 * Chaque appel à {@link typewrite} ou {@link writeLine} remplit la ligne
 * suivante et avance un pointeur interne. {@link clear} remet ce pointeur
 * à zéro et vide le texte de toutes les lignes.
 *
 * **Sizing réactif**
 *
 * Toutes les dimensions internes (espacement, curseur, titre) dérivent de
 * `fontSize`. Passer `fontSize={() => vW() * 0.016}` rend l'ensemble
 * proportionnel à la largeur du canvas.
 *
 * @example Utilisation complète
 * ```tsx
 * const term = createRef<Terminal>();
 *
 * view.add(
 *   <Terminal
 *     ref={term}
 *     title="zsh — ~/project"
 *     fontSize={() => vW() * 0.016}
 *     width={() => vW() * 0.52}
 *     height={() => vH() * 0.46}
 *     maxLines={6}
 *     stroke={'#FF3E6C'}      // surcharge RectProps
 *     opacity={0}
 *   />
 * );
 *
 * yield* term().opacity(1, 0.5);
 * const blink = yield term().startBlink();
 *
 * yield* term().typewrite('ls -la /secrets', {prompt: true, color: 'ghost'});
 * yield* term().typewrite('total 8', {color: 'cream'});
 * yield* term().typewrite('-rw------- 1 root  api_key.txt', {color: 'danger'});
 *
 * cancel(blink);                              // import {cancel} from '@motion-canvas/core'
 * yield* term().hideCursor();
 * yield* waitFor(1);
 * yield* term().clear(0.12);
 * ```
 *
 * @see {@link TerminalProps} pour toutes les props disponibles.
 * @see {@link TypewriteOpts} pour les options de `typewrite`.
 * @see {@link TermColor} pour les couleurs disponibles.
 */
export class Terminal extends Rect {
  /**
   * Titre affiché dans la barre de fenêtre.
   *
   * Signal Motion Canvas — animable directement :
   * ```ts
   * yield* term().title('nouveau titre', 0.3);
   * ```
   *
   * @defaultValue 'bash'
   */
  @initial('bash')
  @signal()
  public declare readonly title: SimpleSignal<string, this>;

  /** @internal Valeur brute du prop `fontSize` (number ou fonction). */
  private readonly _fontSize: SignalValue<number>;

  /** @internal Un curseur Rect par ligne — seul celui de `_nextLine` est visible. */
  private readonly _cursorRefs: Reference<Rect>[] = [];

  /** @internal Refs vers les nœuds Txt de chaque ligne. */
  private readonly _lineRefs: Reference<Txt>[] = [];

  /** @internal Pointeur sur la prochaine ligne libre. */
  private _nextLine = 0;

  /** @internal Nombre total de lignes allouées. */
  private readonly _maxLines: number;

  // ────────────────────────────────────────────────────────────────────────

  /**
   * Crée un terminal fenêtré.
   *
   * @param props - Props du terminal. Toutes les {@link RectProps} sont
   *   transmises à `Rect` et peuvent surcharger les valeurs par défaut
   *   (`fill`, `stroke`, `lineWidth`, `radius`, etc.).
   */
  public constructor({maxLines = 8, fontSize = 22, ...rest}: TerminalProps = {}) {
    super({
      fill:      TC.bg,
      stroke:    TC.border,
      lineWidth: 2,
      radius:    16,
      clip:      true,
      layout:    true,
      direction: 'column',
      ...rest,
    });

    this._fontSize = fontSize;
    this._maxLines = maxLines;

    // Pré-allocation : un Txt ref + un cursor ref par ligne
    for (let lineIndex = 0; lineIndex < maxLines; lineIndex++) {
      this._lineRefs.push(createRef<Txt>());
      this._cursorRefs.push(createRef<Rect>());
    }

    this.add(
      <>
        {/* Barre de titre */}
        <Rect
          width={'100%'}
          height={44}
          fill={`${TC.ghost}30`}
          layout
          direction={'row'}
          alignItems={'center'}
          padding={[0, 20]}
          gap={10}
          shrink={0}
        >
          <Circle width={14} height={14} fill={TC.danger} />
          <Circle width={14} height={14} fill={TC.jaune}  />
          <Circle width={14} height={14} fill={TC.vert}   />
          <Txt
            text={() => this.title()}
            fill={TC.ghost}
            fontSize={this._fs(0.75)}
            fontFamily={'DM Mono, monospace'}
            marginLeft={8}
          />
        </Rect>

        {/* Corps — une ligne = Layout(row) [Txt | cursor] */}
        <Layout
          grow={1}
          width={'100%'}
          padding={[22, 26]}
          layout
          direction={'column'}
          gap={this._fs(0.5)}
          alignItems={'start'}
          justifyContent={'start'}
        >
          {this._lineRefs.map((lineRef, lineIndex) => (
            <Layout layout direction={'row'} alignItems={'center'} gap={2}>
              <Txt
                ref={lineRef}
                text={''}
                fill={TC.cream}
                fontSize={this._fontSize}
                fontFamily={'DM Mono, monospace'}
              />
              {/* Curseur : visible uniquement sur la ligne active */}
              <Rect
                ref={this._cursorRefs[lineIndex]}
                width={this._fs(0.55)}
                height={this._fs(1.15)}
                fill={TC.cream}
                opacity={lineIndex === 0 ? 1 : 0}
              />
            </Layout>
          ))}
        </Layout>
      </>,
    );
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────

  /**
   * Retourne `fontSize * scale` sous forme de `SignalValue<number>`.
   * Si `fontSize` est une fonction, le résultat est également réactif.
   *
   * @internal
   */
  private _fs(scale: number): SignalValue<number> {
    const f = this._fontSize;
    if (typeof f === 'function') return () => (f as () => number)() * scale;
    return (f as number) * scale;
  }

  /**
   * Résout une {@link TermColor} en chaîne CSS.
   * Si `c` est une clé de la palette, retourne la valeur hex correspondante ;
   * sinon retourne `c` tel quel.
   *
   * @internal
   */
  private static _color(c: TermColor): string {
    return c in TC ? TC[c as keyof typeof TC] : (c as string);
  }

  // ─── API publique ─────────────────────────────────────────────────────────

  /**
   * Tape `text` caractère par caractère sur la **prochaine ligne disponible**.
   *
   * @remarks
   * - Le pointeur de ligne avance automatiquement après chaque appel.
   * - Si toutes les lignes sont remplies (`nextLine >= maxLines`), l'appel
   *   est silencieusement ignoré.
   * - La fonction est un générateur : elle doit être appelée avec `yield*`.
   *
   * @param text    - Le texte à taper (sans le préfixe `$ ` si `prompt: false`).
   * @param opts    - Options d'animation (voir {@link TypewriteOpts}).
   *
   * @example Ligne simple
   * ```ts
   * yield* term().typewrite('Collecting litellm...', {color: 'ghost'});
   * ```
   *
   * @example Commande avec prompt + couleur personnalisée
   * ```ts
   * yield* term().typewrite('cat /etc/passwd', {prompt: true, charDelay: 0.06});
   * ```
   */
  public *typewrite(text: string, opts: TypewriteOpts = {}): ThreadGenerator {
    const {charDelay = 0.04, color = 'cream', prompt = false} = opts;
    const lineRef   = this._lineRefs[this._nextLine];
    const cursorRef = this._cursorRefs[this._nextLine];
    if (!lineRef?.()) return;

    lineRef().fill(Terminal._color(color));
    const full = prompt ? `$ ${text}` : text;

    for (let charIndex = 0; charIndex <= full.length; charIndex++) {
      yield* lineRef().text(full.substring(0, charIndex), charDelay);
    }

    // Déplacer le curseur vers la ligne suivante
    cursorRef?.()?.opacity(0);
    this._nextLine++;
    this._cursorRefs[this._nextLine]?.()?.opacity(1);
  }

  /**
   * Écrit une ligne **instantanément** (sans effet machine à écrire).
   *
   * @remarks
   * Cette méthode est **synchrone** — ne pas utiliser avec `yield*`.
   * Utile pour préparer du contenu avant de le rendre visible,
   * ou pour écrire plusieurs lignes d'un coup.
   *
   * @param text  - Le texte à écrire.
   * @param color - Couleur du texte (clé palette ou hex). Défaut : `'cream'`.
   *
   * @example
   * ```ts
   * // Préparer des lignes avant le fade-in
   * term().writeLine('root:x:0:0:root:/root:/bin/bash', 'danger');
   * term().writeLine('daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin');
   * yield* term().opacity(1, 0.5);
   * ```
   */
  public writeLine(text: string, color: TermColor = 'cream'): void {
    const lineRef   = this._lineRefs[this._nextLine];
    const cursorRef = this._cursorRefs[this._nextLine];
    if (!lineRef?.()) return;
    lineRef().text(text);
    lineRef().fill(Terminal._color(color));
    cursorRef?.()?.opacity(0);
    this._nextLine++;
    this._cursorRefs[this._nextLine]?.()?.opacity(1);
  }

  /**
   * Retourne un `ThreadGenerator` de clignotement du curseur en boucle infinie.
   *
   * @remarks
   * C'est une méthode **ordinaire** (pas un générateur) : elle retourne
   * directement le résultat de `loop()`.
   *
   * **Pattern MC 3.x pour annuler une tâche de fond :**
   * ```ts
   * import {cancel} from '@motion-canvas/core';
   *
   * // yield (sans *) → spawn la tâche en arrière-plan,
   * // retourne le ThreadGenerator comme handle
   * const blink = yield term().startBlink();
   *
   * // cancel() est synchrone — pas de yield* nécessaire
   * cancel(blink);
   *
   * // ❌ Ne pas appeler blink.cancel() — cette méthode n'existe pas
   * // ❌ Ne pas faire yield* term().startBlink() — boucle infinie bloquante
   * ```
   *
   * @example
   * ```ts
   * import {cancel, waitFor} from '@motion-canvas/core';
   *
   * const blink = yield term().startBlink();
   * yield* term().typewrite('$ npm install', {prompt: false});
   * yield* waitFor(2);
   * cancel(blink);
   * yield* term().hideCursor();
   * ```
   */
  public startBlink(): ThreadGenerator {
    // Utiliser function* comme body de loop pour pouvoir yield à l'intérieur
    // et nettoyer l'ancien curseur si _nextLine a avancé pendant le cycle.
    const self = this;
    return loop(function* () {
      const lineIndex    = self._nextLine;
      const activeCursor = self._cursorRefs[lineIndex]?.();
      if (!activeCursor) { yield* waitFor(0.9); return; }

      yield* activeCursor.opacity(0, 0.45);

      // Si la ligne a avancé pendant le fade-out, cacher et sortir
      if (self._nextLine !== lineIndex) { activeCursor.opacity(0); return; }

      yield* activeCursor.opacity(1, 0.45);

      // Si la ligne a avancé pendant le fade-in, cacher l'ancien curseur
      if (self._nextLine !== lineIndex) activeCursor.opacity(0);
    });
  }

  /**
   * Affiche le curseur avec un fondu entrant.
   *
   * @param duration - Durée du fondu en secondes. Défaut : `0.2`.
   */
  public *showCursor(duration = 0.2): ThreadGenerator {
    const activeCursor = this._cursorRefs[this._nextLine]?.();
    if (activeCursor) yield* activeCursor.opacity(1, duration);
  }

  /**
   * Cache le curseur avec un fondu sortant.
   *
   * @param duration - Durée du fondu en secondes. Défaut : `0.2`.
   */
  public *hideCursor(duration = 0.2): ThreadGenerator {
    const activeCursor = this._cursorRefs[this._nextLine]?.();
    if (activeCursor) yield* activeCursor.opacity(0, duration);
  }

  /**
   * Efface toutes les lignes et **remet le pointeur de ligne à zéro**.
   *
   * @remarks
   * Si `fadeDuration > 0`, chaque ligne fait un fondu sortant **séquentiel**
   * avant d'être vidée. Pour un effacement plus rapide, passer `0` (défaut).
   *
   * @param fadeDuration - Durée du fondu par ligne, en secondes. Défaut : `0`.
   *
   * @example Effacement instantané
   * ```ts
   * yield* term().clear();
   * ```
   *
   * @example Effacement avec fondu (150 ms par ligne)
   * ```ts
   * yield* term().clear(0.15);
   * ```
   */
  public *clear(fadeDuration = 0): ThreadGenerator {
    // Masquer tous les curseurs sauf celui de la ligne 0
    for (let lineIndex = 0; lineIndex < this._cursorRefs.length; lineIndex++) {
      this._cursorRefs[lineIndex]?.()?.opacity(lineIndex === 0 ? 1 : 0);
    }
    for (const lineRef of this._lineRefs) {
      const lineNode = lineRef();
      if (!lineNode) continue;
      if (fadeDuration > 0) yield* lineNode.opacity(0, fadeDuration);
      lineNode.text('');
      lineNode.opacity(1);
    }
    this._nextLine = 0;
  }

  // ─── Accès direct aux nœuds internes ──────────────────────────────────────

  /**
   * Retourne le nœud `Txt` de la ligne à l'index donné (base 0).
   *
   * @remarks
   * Utile pour un contrôle fin non couvert par l'API (couleur mid-animation,
   * changement de police, accès à la largeur calculée…).
   *
   * @param index - Index de la ligne (0 = première ligne).
   * @returns Le nœud `Txt`, ou `undefined` si l'index est hors limites.
   *
   * @example
   * ```ts
   * // Faire pulser la 3ème ligne en rouge
   * yield* term().line(2)!.fill('#F85149', 0.3);
   * ```
   */
  public line(index: number): Txt | undefined {
    return this._lineRefs[index]?.();
  }

  /**
   * Nœud `Rect` du curseur bloc.
   *
   * @remarks
   * Utile pour changer sa couleur, sa taille ou le repositionner manuellement.
   *
   * @example
   * ```ts
   * term().cursor!.fill('#FF3E6C');   // curseur rose
   * ```
   */
  public get cursor(): Rect | undefined {
    return this._cursorRefs[this._nextLine]?.();
  }

  /**
   * Index de la **prochaine ligne libre** (lecture seule).
   *
   * @remarks
   * Vaut `0` après un {@link clear}, et s'incrémente à chaque appel à
   * {@link typewrite} ou {@link writeLine}.
   */
  public get nextLine(): number {
    return this._nextLine;
  }
}
