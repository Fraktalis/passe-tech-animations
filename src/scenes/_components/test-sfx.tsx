/**
 * @file test-sfx.tsx
 * @description Banc d'essai de la librairie de sound effects (≥ 2026-10-29).
 * Affiche chaque intention de `src/sfx` à son tour. Le son se génère à part :
 * `node scripts/render-sfx.mjs sfx/test-sfx.json` après avoir ouvert le preview.
 */
import {makeScene2D, Txt} from '@motion-canvas/2d';
import {createRef, waitFor, easeInOutCubic} from '@motion-canvas/core';
import {sfx, sfxFill, sfxReset, sfxFlush, SFX_INTENTS} from '../../sfx';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();
  view.fill(PALETTE.bg);

  const intentLabel = createRef<Txt>();
  const counterLabel = createRef<Txt>();

  view.add(<>
    <Txt key="intent-label" ref={intentLabel}
      text=""
      fill={PALETTE.cyan}
      fontSize={() => vW() * 0.05}
      fontFamily="JetBrains Mono, DM Mono, monospace"
      fontWeight={700}
    />
    <Txt key="counter-label" ref={counterLabel}
      text=""
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.014}
      fontFamily="JetBrains Mono, DM Mono, monospace"
      y={() => vH() * 0.08}
    />
  </>);

  sfxReset();
  yield* waitFor(0.5);
  for (const [intentIndex, intent] of SFX_INTENTS.entries()) {
    intentLabel().text(intent);
    counterLabel().text(`${intentIndex + 1} / ${SFX_INTENTS.length}`);
    sfx(intent);
    yield* waitFor(intent === 'fill' ? 3 : 1.6);
  }

  // Jauges : s'arrête à 60 %, puis se vide de 80 % à 20 %
  intentLabel().text('fill 0 → 60 %');
  counterLabel().text('');
  sfxFill(0, 0.6, 1.5);
  yield* waitFor(3);
  intentLabel().text('fill 80 → 20 %');
  sfxFill(0.8, 0.2, 1.5);
  yield* waitFor(3);
  intentLabel().text('fill easeInOutCubic');
  sfxFill(0, 1, 2, {ease: easeInOutCubic});
  yield* waitFor(3.5);
  intentLabel().text('fill 6 marches');
  sfxFill(0, 1, 1.5, {steps: 6});
  yield* waitFor(3);
  intentLabel().text('fill 18 marches');
  sfxFill(0, 1, 1.5, {steps: 18});
  yield* waitFor(3);
  sfxFlush('test-sfx');
});
