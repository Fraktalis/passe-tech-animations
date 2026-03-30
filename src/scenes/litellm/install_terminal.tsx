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


  const term = createRef<Terminal>();

  view.add(
    <Terminal
      ref={term}
      title={'bash >~/ pip'}
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
  

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 8 — Deux terminaux côte à côte + clear() instantané
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('phase8');

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
      title={'bash >~/ uv'}
      fontSize={() => vW() * 0.015}
      width={() => vW() * 0.43}
      height={() => vH() * 0.52}
      x={() => vW() * 0.27}
      stroke={'#F85149'}          // surcharge RectProps — bordure rouge
      maxLines={7}
      opacity={0}
    />,
  );

  yield* term().opacity(1, 0.4, easeOutCubic);
  yield* term2().opacity(1, 0.4, easeOutCubic);

  // Les deux terminaux écrivent en parallèle
  const blinkL = yield term().startBlink();
  const blinkR = yield term2().startBlink();

  yield* all(
    term().typewrite('pip install quelquechose', {prompt: true, charDelay: 0.04}),
    term2().typewrite('uv add quelquechose', {prompt: true, charDelay: 0.04}),
  );

  yield* waitFor(1.5);

  term().writeLine("Collecting quelquechose...", "ghost");
  term().writeLine("Installing packages...", "ghost");
  term().writeLine("Successfully installed ✓", "vert");

  

  term2().writeLine("Using CPython 3.13.5", 'cream');
  term2().writeLine("Creating virtual environment at: .venv", 'cream');
  term2().writeLine("Resolved 1 package in 533ms", 'ghost');
  term2().writeLine("Prepared 1 package in 420ms", 'ghost');
  term2().writeLine("Installed 1 package in 156ms", 'ghost');
  term2().writeLine("quelquechose==1.2.3", 'vert');

  cancel(blinkL, blinkR);

  yield* waitFor(1.5);

  // ─────────────────────────────────────────────────────────────────────────
  // FIN — fade out
  // ─────────────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    term().opacity(0, 0.5),
    term2().opacity(0, 0.5),
  );
});
