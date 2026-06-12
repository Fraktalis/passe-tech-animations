/**
 * @file retropropagation.tsx
 * @description Vidéo 1 LLM — Chapitre « L'entraînement », temps 4 : la rétro-propagation.
 *
 * Show, don't tell :
 *   1. Un réseau en couches (nœuds + connexions). Passe AVANT : une vague cyan
 *      parcourt entrée → sortie et produit une réponse CHIFFRÉE (probabilité).
 *   2. La sortie est comparée à la cible (1.00) → ERREUR numérique (rose).
 *   3. L'information d'erreur remonte EN SENS INVERSE, couche par couche. Chaque
 *      arête flashe et son poids change DURABLEMENT (épaisseur figée à une nouvelle
 *      valeur — les poids ne reviennent PAS à l'état initial).
 *   4. On répète : 3 itérations (1 détaillée + 2 rapides). À chaque tour la
 *      prédiction grimpe (0.12 → 0.58 → 0.91), l'erreur fond, la couleur converge
 *      rose → jaune → vert. C'est ça, le côté itératif de l'entraînement.
 *
 * Deux canaux : cyan = signal avant, rose = erreur qui remonte. Jamais mélangés.
 *
 * Note rendu : MC ne flatten pas les tableaux imbriqués → on rend des LISTES PLATES
 * (nodeFlat / edgeFlat), sinon le groupe entier reste vide.
 */

import {makeScene2D, Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, waitFor, waitUntil, createRef, createSignal, easeOutCubic,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // RNG déterministe (seedé) pour des poids reproductibles au scrub
  let seed = 0x4c4d;
  const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

  // ── Réseau en couches ─────────────────────────────────────────────────────
  const LAYERS = [3, 4, 4, 2];
  const layerX = (l: number) => () => vW() * (-0.40 + l * (0.62 / (LAYERS.length - 1)));
  const nodeY  = (l: number, i: number) => () => vH() * (i - (LAYERS[l] - 1) / 2) * 0.15;
  const nodeR  = () => vW() * 0.016;
  const lastLayer = LAYERS.length - 1;

  // refs structurés (pour l'animation par couche / gap)
  const nodes = LAYERS.map(n => Array.from({length: n}, () => createRef<Circle>()));
  const edges = LAYERS.slice(0, -1).map((n, g) =>
    Array.from({length: LAYERS[g] * LAYERS[g + 1]}, () => createRef<Line>()));

  // listes plates (pour le rendu)
  const nodeFlat = LAYERS.flatMap((n, l) =>
    Array.from({length: n}, (_, i) => ({l, i, ref: nodes[l][i]})));
  const edgeFlat = LAYERS.slice(0, -1).flatMap((n, g) =>
    Array.from({length: LAYERS[g]}, (_, i) =>
      Array.from({length: LAYERS[g + 1]}, (_, j) => ({
        g, i, j, ref: edges[g][i * LAYERS[g + 1] + j],
      })),
    ).flat());
  const gapEdges = (g: number) => edges[g];

  // ── Signaux numériques ──────────────────────────────────────────────────
  // prediction = probabilité que le modèle attribue à « chat ». Cible fixe = 1.00.
  // L'erreur affichée en découle directement : err = cible − prédiction.
  const prediction = createSignal(0.0);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();
  const iterTag   = createRef<Txt>();
  const netGroup  = createRef<Layout>();

  const fwdLine     = createRef<Line>();
  const producedRef = createRef<Rect>();
  const predValRef  = createRef<Txt>();
  const targetRef   = createRef<Rect>();
  const errorBadge  = createRef<Txt>();
  const errArrow    = createRef<Line>();
  const nameTag     = createRef<Txt>();

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

      <Txt key="title" ref={titleRef}
        text="PASSE AVANT"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.43}
        opacity={0} />

      <Txt key="iter-tag" ref={iterTag}
        text="itération 1 / 3"
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.011}
        fontFamily={MONO} fontWeight={500}
        y={() => vH() * -0.395}
        opacity={0} />

      <Layout key="net" ref={netGroup} opacity={0}>
        {/* arêtes (sous les nœuds) — liste plate */}
        {edgeFlat.map(({g, i, j, ref}) => (
          <Line key={`edge-${g}-${i}-${j}`} ref={ref}
            points={() => [
              [layerX(g)() + nodeR(), nodeY(g, i)()],
              [layerX(g + 1)() - nodeR(), nodeY(g + 1, j)()],
            ]}
            stroke={PALETTE.ghost} lineWidth={1.5} opacity={0.55} />
        ))}
        {/* nœuds — liste plate */}
        {nodeFlat.map(({l, i, ref}) => (
          <Circle key={`node-${l}-${i}`} ref={ref}
            width={() => nodeR() * 2} height={() => nodeR() * 2}
            fill={PALETTE.nodeBg} stroke={PALETTE.secondary} lineWidth={2}
            x={layerX(l)} y={nodeY(l, i)} />
        ))}
      </Layout>

      {/* arête sortie réseau → bloc « produit » */}
      <Line key="fwd-line" ref={fwdLine}
        points={() => [
          [layerX(lastLayer)() + nodeR(), 0],
          [vW() * 0.27, vH() * -0.07],
        ]}
        stroke={PALETTE.cyan} lineWidth={2} endArrow arrowSize={8}
        end={0} opacity={0} />

      {/* sortie produite vs cible */}
      <Rect key="produced" ref={producedRef}
        width={() => vW() * 0.14} height={() => vH() * 0.085}
        fill={PALETTE.nodeBg} stroke={PALETTE.rose} lineWidth={2}
        radius={() => vW() * 0.006}
        x={() => vW() * 0.34} y={() => vH() * -0.075}
        opacity={0}>
        <Txt text="P(« chat »)" fill={PALETTE.secondary}
          fontSize={() => vW() * 0.011} fontFamily={MONO} y={() => vH() * -0.019} />
        <Txt ref={predValRef} text={() => prediction().toFixed(2)} fill={PALETTE.rose}
          fontSize={() => vW() * 0.022} fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.013} />
      </Rect>

      <Rect key="target" ref={targetRef}
        width={() => vW() * 0.14} height={() => vH() * 0.085}
        fill={PALETTE.nodeBg} stroke={PALETTE.vert} lineWidth={2}
        radius={() => vW() * 0.006}
        x={() => vW() * 0.34} y={() => vH() * 0.075}
        opacity={0}>
        <Txt text="cible (« chat »)" fill={PALETTE.secondary}
          fontSize={() => vW() * 0.011} fontFamily={MONO} y={() => vH() * -0.019} />
        <Txt text="1.00" fill={PALETTE.vert}
          fontSize={() => vW() * 0.022} fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.013} />
      </Rect>

      <Txt key="error-badge" ref={errorBadge}
        text={() => `erreur ${(1 - prediction()).toFixed(2)}`}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.015} fontFamily={MONO} fontWeight={700}
        x={() => vW() * 0.34} y={() => vH() * 0.0}
        opacity={0} />

      {/* flèche d'erreur : bloc produit → sortie réseau (sens inverse) */}
      <Line key="err-arrow" ref={errArrow}
        points={() => [
          [vW() * 0.27, vH() * 0.0],
          [layerX(lastLayer)() + nodeR(), 0],
        ]}
        stroke={PALETTE.rose} lineWidth={3} endArrow arrowSize={10}
        end={0} opacity={0} />

      <Txt key="name-tag" ref={nameTag}
        text="rétro-propagation"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.034} fontFamily={SANS} fontWeight={700}
        y={() => vH() * 0.38}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // HELPERS D'ANIMATION
  // ════════════════════════════════════════════════════════════════════════

  const flashGap = (g: number, color: string, dur = 0.3) =>
    all(...gapEdges(g).map(e =>
      e().stroke(color, dur * 0.4).to(PALETTE.ghost, dur * 0.6)));

  // Passe arrière : flashe l'arête en rose ET FIGE une nouvelle épaisseur (poids).
  // L'épaisseur ne revient pas — les poids ont durablement changé.
  const reweightGap = (g: number, dur = 0.3) =>
    all(
      ...gapEdges(g).map(e =>
        e().stroke(PALETTE.rose, dur * 0.4).to(PALETTE.ghost, dur * 0.6)),
      ...gapEdges(g).map(e => e().lineWidth(0.8 + rand() * 3.4, dur)),
    );

  const lightLayer = (l: number, color: string, dur = 0.2) =>
    all(...nodes[l].map(n => all(n().fill(color, dur), n().stroke(color, dur))));
  const dimLayer = (l: number, dur = 0.3) =>
    all(...nodes[l].map(n =>
      all(n().fill(PALETTE.nodeBg, dur), n().stroke(PALETTE.secondary, dur))));
  const dimAll = (dur = 0.3) => all(...LAYERS.map((_, l) => dimLayer(l, dur)));

  function* forwardSweep(step: number) {
    for (let l = 0; l < LAYERS.length; l++) {
      yield* lightLayer(l, PALETTE.cyan, step);
      if (l < lastLayer) yield* flashGap(l, PALETTE.cyan, step * 1.5);
    }
  }
  function* backwardSweep(step: number) {
    yield* lightLayer(lastLayer, PALETTE.rose, step);
    for (let g = lastLayer - 1; g >= 0; g--) {
      yield* reweightGap(g, step * 1.5);
      yield* lightLayer(g, PALETTE.rose, step);
    }
  }

  // Itération rapide : avant → la sortie s'améliore → arrière (poids réajustés).
  function* fastIteration(idx: number, pred: number, predColor: string, step: number) {
    yield* all(
      iterTag().text(`itération ${idx} / 3`, 0.3),
      titleRef().text('PASSE AVANT', 0.3),
      errArrow().opacity(0.15, 0.2),
    );
    yield* forwardSweep(step);
    // l'output bouge : la prédiction grimpe, l'erreur fond, la couleur converge
    yield* all(
      prediction(pred, 0.45),
      predValRef().fill(predColor, 0.45),
      producedRef().stroke(predColor, 0.45),
      errorBadge().fill(predColor, 0.45),
    );
    yield* dimAll(0.2);
    yield* all(titleRef().text('PASSE ARRIÈRE', 0.3), errArrow().opacity(1, 0.2));
    yield* backwardSweep(step);
    yield* all(dimAll(0.25), errArrow().opacity(0.3, 0.25));
  }

  // ════════════════════════════════════════════════════════════════════════
  // TIMELINE
  // ════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
    netGroup().opacity(1, 0.5),
  );

  // ── ITÉRATION 1 (détaillée) ───────────────────────────────────────────────
  // Passe avant : vague cyan entrée → sortie
  yield* waitUntil('forward');
  yield* iterTag().opacity(1, 0.4);
  yield* forwardSweep(0.2);
  // la sortie produit une réponse chiffrée, comparée à la cible
  yield* fwdLine().opacity(1, 0.01);
  yield* fwdLine().end(1, 0.4, easeOutCubic);
  yield* all(
    producedRef().opacity(1, 0.3),
    targetRef().opacity(1, 0.3),
  );
  yield* all(prediction(0.12, 0.5), errorBadge().opacity(1, 0.3));
  yield* errorBadge().scale(1.2, 0.15).to(1, 0.15);
  // les couches retombent au neutre avant la passe arrière
  yield* dimAll(0.3);

  // Passe arrière : l'erreur remonte sortie → entrée, les poids changent
  yield* waitUntil('backward');
  yield* all(
    titleRef().text('PASSE ARRIÈRE', 0.4),
    fwdLine().opacity(0, 0.3),
  );
  yield* errArrow().opacity(1, 0.01);
  yield* errArrow().end(1, 0.4, easeOutCubic);
  yield* backwardSweep(0.2);
  yield* waitFor(0.3);
  yield* all(dimAll(0.4), errArrow().opacity(0.3, 0.4));

  // ── ITÉRATIONS 2 & 3 (rapides) — le côté itératif ─────────────────────────
  yield* waitUntil('iter2');
  yield* fastIteration(2, 0.58, PALETTE.jaune, 0.09);

  yield* waitUntil('iter3');
  yield* fastIteration(3, 0.91, PALETTE.vert, 0.08);

  // la prédiction a convergé vers la cible : on souligne le résultat
  yield* all(
    predValRef().scale(1.25, 0.2).to(1, 0.2),
    producedRef().stroke(PALETTE.vert, 0.3),
  );

  // « et on appelle ça la rétro-propagation »
  yield* waitUntil('name');
  yield* nameTag().opacity(1, 0.5);
  yield* waitFor(1.0);

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    iterTag().opacity(0, 0.5),
    netGroup().opacity(0, 0.5),
    fwdLine().opacity(0, 0.5),
    producedRef().opacity(0, 0.5),
    targetRef().opacity(0, 0.5),
    errorBadge().opacity(0, 0.5),
    errArrow().opacity(0, 0.5),
    nameTag().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
