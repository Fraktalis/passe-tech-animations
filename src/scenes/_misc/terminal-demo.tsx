// src/scenes/_misc/terminal-demo.tsx
// Scène de démonstration du composant Terminal
// ─────────────────────────────────────────────
// Couverts :
//   ✓ typewrite() — effet machine à écrire, toutes les couleurs palette
//   ✓ writeLine() — écriture instantanée + fade-in
//   ✓ startBlink() / blink.cancel()
//   ✓ showCursor() / hideCursor()
//   ✓ clear() instantané et avec fondu
//   ✓ title signal — animation du titre
//   ✓ prompt: true — préfixe « $ »
//   ✓ charDelay custom
//   ✓ surcharge RectProps (stroke, position)
//   ✓ line(index) — accès direct à un nœud Txt
//   ✓ deux terminaux côte à côte

import {makeScene2D} from '@motion-canvas/2d';
import {Rect, Txt, Layout} from '@motion-canvas/2d/lib/components';
import {all, cancel, createRef, easeOutCubic, waitFor, waitUntil} from '@motion-canvas/core';
import {Terminal} from '../../components';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:    '#0D1117',
    ghost: '#484F58',
    cream: '#F9F9F6',
    jaune: '#FFE14D',
  };

  // ── Fond ──────────────────────────────────────────────────────────────────
  view.add(<Rect width={'100%'} height={'100%'} fill={C.bg} zIndex={-1} />);

  // ── Titre de section (affiché en haut pendant toute la démo) ──────────────
  const sectionLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={sectionLabel}
      text={'Terminal component · demo'}
      fill={C.ghost}
      fontSize={() => vW() * 0.014}
      fontFamily={'DM Mono, monospace'}
      y={() => vH() * -0.46}
      opacity={0.6}
    />,
  );

  // ── Ref helper pour les étiquettes de phase ────────────────────────────────
  const phaseLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={phaseLabel}
      text={''}
      fill={C.jaune}
      fontSize={() => vW() * 0.013}
      fontFamily={'DM Mono, monospace'}
      y={() => vH() * 0.44}
      opacity={0}
    />,
  );

  function* showPhase(label: string) {
    phaseLabel().text(label);
    yield* phaseLabel().opacity(1, 0.2);
  }
  function* hidePhase() {
    yield* phaseLabel().opacity(0, 0.15);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TERMINAL PRINCIPAL — centré
  // ══════════════════════════════════════════════════════════════════════════

  const term = createRef<Terminal>();

  view.add(
    <Terminal
      ref={term}
      title={'bash — ~/demo'}
      fontSize={() => vW() * 0.015}
      width={() => vW() * 0.56}
      height={() => vH() * 0.52}
      maxLines={7}
      opacity={0}
    />,
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1 — Apparition + typewrite de base
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase1');
  yield* showPhase('1 · typewrite de base');

  yield* term().opacity(1, 0.5, easeOutCubic);

  // Curseur clignotant en arrière-plan pendant tout le bloc
  const blink = yield term().startBlink();

  yield* term().typewrite('echo "Bonjour Passe-Tech"', {prompt: true, charDelay: 0.055});
  yield* term().typewrite('Bonjour Passe-Tech', {color: 'vert'});
  yield* waitFor(0.8);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 — Toutes les couleurs palette
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase2');
  yield* hidePhase();
  yield* showPhase('2 · couleurs palette');

  yield* term().typewrite('cream (défaut)',  {color: 'cream',  charDelay: 0.025});
  yield* term().typewrite('ghost',           {color: 'ghost',  charDelay: 0.025});
  yield* term().typewrite('vert  · succès',  {color: 'vert',   charDelay: 0.025});
  yield* term().typewrite('rose',            {color: 'rose',   charDelay: 0.025});
  yield* term().typewrite('blue',            {color: 'blue',   charDelay: 0.025});
  yield* term().typewrite('danger · erreur', {color: 'danger', charDelay: 0.025});

  yield* waitFor(1.2);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 3 — clear() avec fondu
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase3');
  yield* hidePhase();
  yield* showPhase('3 · clear() avec fondu');

  cancel(blink);
  yield* term().clear(0.08);        // fondu séquentiel 80 ms / ligne
  yield* waitFor(0.3);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 4 — writeLine() instantané + fade-in du terminal
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase4');
  yield* hidePhase();
  yield* showPhase('4 · writeLine() instantané');

  // Préparer le contenu AVANT de rendre visible
  yield* term().opacity(0, 0.2);
  term().writeLine('# contenu pré-chargé',             'ghost');
  term().writeLine('root:x:0:0:root:/root:/bin/bash',  'cream');
  term().writeLine('daemon:x:1:1:daemon:/usr/sbin',    'cream');
  term().writeLine('[ERREUR] accès refusé',            'danger');
  yield* term().opacity(1, 0.4);

  yield* waitFor(1.5);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 5 — line(index) : accès direct à un nœud Txt
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase5');
  yield* hidePhase();
  yield* showPhase('5 · line(index) · accès direct');

  // Faire pulser la ligne 3 (index 3 = "[ERREUR]") en rouge
  const errLine = term().line(3);
  if (errLine) {
    yield* all(
      errLine.scale(1.05, 0.2),
      errLine.fill('#FF0000', 0.2),
    );
    yield* all(
      errLine.scale(1.0, 0.2),
      errLine.fill('#F85149', 0.2),
    );
  }

  yield* waitFor(1);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 6 — Animation du signal title
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase6');
  yield* hidePhase();
  yield* showPhase('6 · title signal animé');

  yield* term().title('zsh — ~/secrets', 0.4);
  yield* waitFor(0.8);
  yield* term().title('bash — ~/demo', 0.4);
  yield* waitFor(0.8);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 7 — hideCursor / showCursor
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase7');
  yield* hidePhase();
  yield* showPhase('7 · showCursor / hideCursor');

  yield* term().hideCursor(0.3);
  yield* waitFor(0.6);
  yield* term().showCursor(0.3);
  const blink2 = yield term().startBlink();
  yield* waitFor(1.2);
  cancel(blink2);
  yield* term().hideCursor();
  yield* waitFor(0.5);

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 8 — Deux terminaux côte à côte + clear() instantané
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase8');
  yield* hidePhase();
  yield* showPhase('8 · deux terminaux côte à côte');

  // Déplacer le terminal principal à gauche
  yield* term().clear();
  yield* all(
    term().x(() => vW() * -0.27, 0.4, easeOutCubic),
    term().width(() => vW() * 0.43, 0.4, easeOutCubic),
  );

  // Créer un second terminal à droite
  const term2 = createRef<Terminal>();
  view.add(
    <Terminal
      ref={term2}
      title={'attacker — C2'}
      fontSize={() => vW() * 0.015}
      width={() => vW() * 0.43}
      height={() => vH() * 0.52}
      x={() => vW() * 0.27}
      stroke={'#F85149'}          // surcharge RectProps — bordure rouge
      maxLines={5}
      opacity={0}
    />,
  );

  yield* term2().opacity(1, 0.4, easeOutCubic);

  // Les deux terminaux écrivent en parallèle
  const blinkL = yield term().startBlink();
  const blinkR = yield term2().startBlink();

  yield* all(
    term().typewrite('pip install litellm', {prompt: true, charDelay: 0.04}),
    term2().typewrite('nc -lvp 4444', {prompt: true, charDelay: 0.04}),
  );
  yield* all(
    term().typewrite('Successfully installed ✓', {color: 'vert', charDelay: 0.02}),
    term2().typewrite('Listening on 0.0.0.0:4444', {color: 'ghost', charDelay: 0.02}),
  );
  yield* term2().typewrite('Connection received!', {color: 'danger', charDelay: 0.06});

  yield* waitFor(1.5);

  cancel(blinkL, blinkR);

  // ─────────────────────────────────────────────────────────────────────────
  // FIN — fade out
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* hidePhase();
  yield* all(
    term().opacity(0, 0.5),
    term2().opacity(0, 0.5),
    sectionLabel().opacity(0, 0.4),
  );
});
