/**
 * @file retropropagation.tsx
 * @description Vidéo 1 LLM — Chapitre « L'entraînement », temps 4 : la rétro-propagation.
 *
 * Show, don't tell :
 *   1. Un réseau en couches (nœuds + connexions). Passe AVANT : une vague cyan
 *      parcourt entrée → sortie et produit une réponse.
 *   2. La sortie est comparée à la cible → ERREUR (rose) à droite.
 *   3. L'information d'erreur remonte EN SENS INVERSE, couche par couche, sortie →
 *      entrée. Chaque arête flashe et son poids s'ajuste (épaisseur qui bouge).
 *
 * Deux canaux : cyan = signal avant, rose = erreur qui remonte. Jamais mélangés.
 *
 * Note rendu : MC ne flatten pas les tableaux imbriqués → on rend des LISTES PLATES
 * (netNodeFlat / netEdgeFlat), sinon le groupe entier reste vide.
 */

import {makeScene2D, Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef, easeInOutCubic, easeOutCubic,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

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

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();
  const netGroup  = createRef<Layout>();

  const fwdLine     = createRef<Line>();
  const producedRef = createRef<Rect>();
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
        width={() => vW() * 0.13} height={() => vH() * 0.08}
        fill={PALETTE.nodeBg} stroke={PALETTE.rose} lineWidth={2}
        radius={() => vW() * 0.006}
        x={() => vW() * 0.34} y={() => vH() * -0.07}
        opacity={0}>
        <Txt text="produit" fill={PALETTE.secondary}
          fontSize={() => vW() * 0.011} fontFamily={MONO} y={() => vH() * -0.018} />
        <Txt text="ch# ?" fill={PALETTE.rose}
          fontSize={() => vW() * 0.018} fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.012} />
      </Rect>

      <Rect key="target" ref={targetRef}
        width={() => vW() * 0.13} height={() => vH() * 0.08}
        fill={PALETTE.nodeBg} stroke={PALETTE.vert} lineWidth={2}
        radius={() => vW() * 0.006}
        x={() => vW() * 0.34} y={() => vH() * 0.07}
        opacity={0}>
        <Txt text="attendu" fill={PALETTE.secondary}
          fontSize={() => vW() * 0.011} fontFamily={MONO} y={() => vH() * -0.018} />
        <Txt text="chat" fill={PALETTE.vert}
          fontSize={() => vW() * 0.018} fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.012} />
      </Rect>

      <Txt key="error-badge" ref={errorBadge}
        text="≠ erreur"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.016} fontFamily={MONO} fontWeight={700}
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
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  const flashGap = (g: number, color: string, dur = 0.3) =>
    all(...gapEdges(g).map(e =>
      e().stroke(color, dur * 0.4).to(PALETTE.ghost, dur * 0.6)));
  const adjustGap = (g: number) =>
    all(
      ...gapEdges(g).map(e =>
        e().stroke(PALETTE.rose, 0.15).to(PALETTE.ghost, 0.35)),
      ...gapEdges(g).map(e =>
        e().lineWidth(2.8, 0.15).to(1.5, 0.35)),
    );
  const lightLayer = (l: number, color: string, dur = 0.2) =>
    all(...nodes[l].map(n => all(n().fill(color, dur), n().stroke(color, dur))));
  const dimLayer = (l: number, dur = 0.3) =>
    all(...nodes[l].map(n =>
      all(n().fill(PALETTE.nodeBg, dur), n().stroke(PALETTE.secondary, dur))));

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
    netGroup().opacity(1, 0.5),
  );

  // ── Passe avant : vague cyan entrée → sortie ──────────────────────────────
  yield* waitUntil('forward');
  for (let l = 0; l < LAYERS.length; l++) {
    yield* lightLayer(l, PALETTE.cyan, 0.2);
    if (l < lastLayer) yield* flashGap(l, PALETTE.cyan, 0.3);
  }
  // la sortie produit une réponse, comparée à la cible
  yield* fwdLine().opacity(1, 0.01);
  yield* fwdLine().end(1, 0.4, easeOutCubic);
  yield* all(
    producedRef().opacity(1, 0.3),
    targetRef().opacity(1, 0.3),
  );
  yield* errorBadge().opacity(1, 0.3);
  yield* errorBadge().scale(1.2, 0.15).to(1, 0.15);
  // les couches retombent au neutre avant la passe arrière
  yield* all(...LAYERS.map((_, l) => dimLayer(l, 0.3)));

  // ── Passe arrière : l'erreur remonte sortie → entrée ──────────────────────
  yield* waitUntil('backward');
  yield* all(
    titleRef().text('PASSE ARRIÈRE', 0.4),
    fwdLine().opacity(0, 0.3),
  );
  // l'erreur repart du bloc produit vers la sortie du réseau
  yield* errArrow().opacity(1, 0.01);
  yield* errArrow().end(1, 0.4, easeOutCubic);
  // la couche de sortie s'allume en rose la première
  yield* lightLayer(lastLayer, PALETTE.rose, 0.2);
  for (let g = lastLayer - 1; g >= 0; g--) {
    yield* adjustGap(g);
    yield* lightLayer(g, PALETTE.rose, 0.2);
  }
  yield* waitFor(0.3);
  // les poids ajustés retombent, le réseau s'apaise
  yield* all(
    ...LAYERS.map((_, l) => dimLayer(l, 0.4)),
    errArrow().opacity(0.3, 0.4),
  );

  // « et on appelle ça la rétro-propagation »
  yield* waitUntil('name');
  yield* nameTag().opacity(1, 0.5);
  yield* waitFor(1.0);

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
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
