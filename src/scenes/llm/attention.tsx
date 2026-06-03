/**
 * @file attention.tsx
 * @description Vidéo 1 LLM — Chapitre 5 « Lire tout en même temps ».
 *
 * Show, don't tell — deux temps, contraste rythmique :
 *
 *   1. RNN — l'info de "animal" traverse la phrase mot à mot. Un point cyan
 *      voyage SÉQUENTIELLEMENT et se DILUE à chaque étape : il arrive tout pâle
 *      sur "il". Le lien animal→il est dégradé (flèche faible). Rythme lent.
 *
 *   2. ATTENTION (Vaswani 2017) — "il" devient la Query. Des flèches partent
 *      vers TOUS les tokens EN MÊME TEMPS (yield* all → parallèle). Le score
 *      vers "animal" est le plus fort (Key qui matche). La Value de "animal"
 *      file DIRECTEMENT vers "il", pleine intensité, sans dégradation.
 *
 * Couleur active unique = cyan (l'info en transit, la query, la value).
 * Le reste de la phrase reste neutre (gris) — la couleur porte le sens.
 */

import {makeScene2D, Grid, Layout, Rect, Txt, Circle} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef, easeInOutCubic, easeOutCubic,
} from '@motion-canvas/core';
import {Slot, Packet, Callout, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // tokens affichés (condensé fidèle) : animal = 0, il = 6 → 6 étapes entre les deux
  const TOKENS = ['animal', "n'a", 'traversé', 'la', 'route', 'car', 'il'];
  const ANIMAL = 0;
  const IL = 6;

  const spacing  = () => vW() * 0.142;
  const tokenX   = (i: number) => () => (i - 3) * spacing();
  const rowY     = () => vH() * -0.06;
  const slotW    = (frag: string) => () => vW() * (0.011 * frag.length + 0.035);
  const slotH    = () => vH() * 0.14;
  const ilDownY  = () => vH() * 0.28;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef     = createRef<Grid>();
  const sentenceRef = createRef<Txt>();
  const phaseLabel  = createRef<Txt>();

  const tokenSlots  = TOKENS.map(() => createRef<Slot>());

  // RNN
  const rnnDot      = createRef<Circle>();
  const rnnWeakArrow = createRef<ConnectionArrow>();

  // Attention
  const qBadge      = createRef<Txt>();
  const kBadges     = TOKENS.slice(0, IL).map(() => createRef<Txt>());
  const attnArrows  = TOKENS.slice(0, IL).map(() => createRef<ConnectionArrow>());
  const valuePacket = createRef<Packet>();
  const attnCallout = createRef<Callout>();
  const resolvedCallout = createRef<Callout>();

  // dégradation du point RNN sur 6 sauts
  const decay = [1.0, 0.85, 0.7, 0.56, 0.44, 0.34, 0.26];

  // ════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} zIndex={-2} />
      <Grid key="grid" ref={gridRef}
        width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost} lineWidth={1} opacity={0} zIndex={-1} />

      {/* phrase complète, contexte estompé */}
      <Txt key="sentence" ref={sentenceRef}
        text="L'animal n'a pas traversé la route parce qu'il était trop fatigué."
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.018}
        fontFamily={MONO}
        y={() => vH() * -0.36}
        opacity={0} />

      {/* label de phase (RNN / Attention) */}
      <Txt key="phase-label" ref={phaseLabel}
        text="RNN"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.016}
        fontFamily={MONO} fontWeight={700}
        x={() => vW() * -0.44} y={() => vH() * -0.42}
        opacity={0} />

      {/* rangée de tokens */}
      {TOKENS.map((frag, i) => (
        <Slot key={`token-${i}`} ref={tokenSlots[i]}
          index={i} content={frag} color={PALETTE.cyan} initialState="filled"
          width={slotW(frag)} height={slotH}
          x={tokenX(i)} y={rowY}
          opacity={0} />
      ))}

      {/* point d'état RNN (porte l'info de "animal") */}
      <Circle key="rnn-dot" ref={rnnDot}
        width={() => vW() * 0.022} height={() => vW() * 0.022}
        fill={PALETTE.cyan}
        shadowColor={PALETTE.cyan} shadowBlur={() => vW() * 0.01}
        x={tokenX(ANIMAL)} y={() => vH() * 0.05}
        opacity={0} />

      {/* flèche faible animal→il (lien dégradé) */}
      <ConnectionArrow key="rnn-weak" ref={rnnWeakArrow}
        from={() => [tokenX(IL)(), rowY() + vH() * 0.085]}
        to={() =>   [tokenX(ANIMAL)(), rowY() + vH() * 0.085]}
        stroke={PALETTE.ghost} lineWidth={1} dashed arrowSize={8}
        end={0} opacity={0} />

      {/* badges Q / K */}
      <Txt key="q-badge" ref={qBadge}
        text="Q" fill={PALETTE.cyan}
        fontSize={() => vW() * 0.016} fontFamily={MONO} fontWeight={700}
        x={0} y={() => ilDownY() - vH() * 0.1}
        opacity={0} />

      {TOKENS.slice(0, IL).map((_, i) => (
        <Txt key={`k-badge-${i}`} ref={kBadges[i]}
          text="K" fill={PALETTE.secondary}
          fontSize={() => vW() * 0.013} fontFamily={MONO} fontWeight={700}
          x={tokenX(i)} y={() => rowY() + vH() * 0.095}
          opacity={0} />
      ))}

      {/* flèches d'attention il → chaque token */}
      {TOKENS.slice(0, IL).map((_, i) => (
        <ConnectionArrow key={`attn-arrow-${i}`} ref={attnArrows[i]}
          from={() => [0, ilDownY() - vH() * 0.07]}
          to={() =>   [tokenX(i)(), rowY() + vH() * 0.075]}
          stroke={PALETTE.cyan} lineWidth={2} arrowSize={9}
          end={0} opacity={0} />
      ))}

      {/* Value de animal qui file vers il */}
      <Packet key="value-packet" ref={valuePacket}
        content="value" color={PALETTE.cyan} packetSize="sm"
        width={() => vW() * 0.07} height={() => vH() * 0.05}
        x={tokenX(ANIMAL)} y={rowY}
        opacity={0} />

      {/* Callout : ancrage du terme + source */}
      <Callout key="attn-callout" ref={attnCallout}
        title="Attention Is All You Need"
        body="Vaswani et al. · 2017"
        color={PALETTE.cyan}
        width={() => vW() * 0.28} height={() => vH() * 0.12}
        x={() => vW() * 0.32} y={() => vH() * -0.34}
        opacity={0} />

      {/* Callout final : il résolu */}
      <Callout key="resolved-callout" ref={resolvedCallout}
        title="« il » → animal"
        body="référence transmise directement"
        color={PALETTE.cyan}
        width={() => vW() * 0.26} height={() => vH() * 0.12}
        x={() => vW() * 0.28} y={() => vH() * 0.28}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    sentenceRef().opacity(1, 0.6),
  );

  // tokens apparaissent
  yield* waitUntil('tokens');
  yield* sequence(0.07, ...tokenSlots.map(s => s().opacity(1, 0.25)));

  // ── Phase 1 — RNN : dilution séquentielle ─────────────────────────────────
  yield* waitUntil('rnn');
  yield* phaseLabel().opacity(1, 0.3);
  // l'info naît sur "animal"
  yield* tokenSlots[ANIMAL]().setState('active', 0.2);
  rnnDot().position([tokenX(ANIMAL)(), vH() * 0.05]);
  yield* rnnDot().opacity(1, 0.3);
  yield* waitFor(0.3);

  // le point saute de token en token, en se dégradant (lent = séquentiel)
  yield* waitUntil('dilute');
  for (let step = ANIMAL + 1; step <= IL; step++) {
    yield* all(
      rnnDot().x(tokenX(step)(), 0.35, easeInOutCubic),
      rnnDot().opacity(decay[step], 0.35),
      rnnDot().fill(step >= IL ? PALETTE.ghost : PALETTE.cyan, 0.35),
      tokenSlots[step]().setState('active', 0.12),
      step > ANIMAL + 1 ? tokenSlots[step - 1]().setState('filled', 0.25) : waitFor(0),
    );
  }

  // arrivé sur "il" : pâle. Le lien vers animal est faible.
  yield* waitUntil('weakLink');
  rnnWeakArrow().opacity(0.5);
  yield* rnnWeakArrow().end(1, 0.6, easeOutCubic);
  yield* waitFor(0.7);

  // ── transition : on efface l'échec du RNN ─────────────────────────────────
  yield* waitUntil('attention');
  yield* all(
    rnnDot().opacity(0, 0.4),
    rnnWeakArrow().opacity(0, 0.4),
    tokenSlots[IL]().setState('filled', 0.2),
    phaseLabel().text('ATTENTION').fill(PALETTE.cyan, 0.3),
  );

  // "il" descend et devient la Query
  yield* tokenSlots[IL]().setState('active', 0.2);
  yield* all(
    tokenSlots[IL]().position([0, ilDownY()], 0.6, easeInOutCubic),
    qBadge().opacity(1, 0.4),
  );

  // les Keys s'allument sur tous les autres tokens
  yield* waitUntil('keys');
  yield* sequence(0.05, ...kBadges.map(k => k().opacity(0.8, 0.2)));

  // ── Phase 2 — fan d'attention EN PARALLÈLE ────────────────────────────────
  yield* waitUntil('scores');
  yield* all(
    ...attnArrows.map(a => {
      a().opacity(0.4);
      return a().end(1, 0.5, easeOutCubic);
    }),
  );
  yield* attnCallout().opacity(1, 0.3);

  // le score vers "animal" l'emporte : flèche épaisse et vive
  yield* waitUntil('match');
  yield* all(
    attnArrows[ANIMAL]().lineWidth(7, 0.4),
    attnArrows[ANIMAL]().opacity(1, 0.4),
    tokenSlots[ANIMAL]().setState('active', 0.3),
    // les autres scores s'estompent
    ...attnArrows.slice(1).map(a => a().opacity(0.12, 0.4)),
    ...kBadges.slice(1).map(k => k().opacity(0.25, 0.4)),
  );
  yield* waitFor(0.4);

  // ── la Value de animal file DIRECTEMENT vers il (plein, sans dégradation) ──
  yield* waitUntil('value');
  valuePacket().position([tokenX(ANIMAL)(), rowY()]);
  yield* valuePacket().opacity(1, 0.2);
  yield* valuePacket().flyTo([0, ilDownY()], 0.7);
  yield* all(
    valuePacket().opacity(0, 0.3),
    tokenSlots[IL]().setState('active', 0.2),
  );

  // "il" est résolu
  yield* waitUntil('resolved');
  yield* resolvedCallout().opacity(1, 0.4);
  yield* waitFor(1.0);

  // ── Fin ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    sentenceRef().opacity(0, 0.5),
    phaseLabel().opacity(0, 0.5),
    attnCallout().opacity(0, 0.5),
    resolvedCallout().opacity(0, 0.5),
    qBadge().opacity(0, 0.5),
    valuePacket().opacity(0, 0.3),
    ...tokenSlots.map(s => s().opacity(0, 0.5)),
    ...kBadges.map(k => k().opacity(0, 0.5)),
    ...attnArrows.map(a => a().opacity(0, 0.5)),
  );
  yield* waitFor(0.3);
});
