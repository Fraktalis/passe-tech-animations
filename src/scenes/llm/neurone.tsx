/**
 * @file neurone.tsx
 * @description Vidéo 1 LLM — Chapitre « L'entraînement », temps 1 : le perceptron.
 *
 * Un perceptron prend PLUSIEURS valeurs en entrée mais produit UNE SEULE valeur en sortie.
 *
 * Show, don't tell, en deux temps :
 *   A. SYMBOLIQUE — entrées x₁ x₂ x₃ (cyan), poids w₁ w₂ w₃ (jaune), biais b (ambre).
 *      On construit l'équation : z = x₁·w₁ + x₂·w₂ + x₃·w₃ + b, puis a = ƒ(z).
 *      Le calcul interne se résume à un seul scalaire z → une seule sortie a.
 *   B. NUMÉRIQUE — seulement APRÈS, on remplace les symboles par des valeurs, à la fois
 *      dans le neurone ET dans l'équation : z = 0.7·0.5 + 0.2·(−0.4) + 0.9·0.8 + 0.1 = 1.09,
 *      a = σ(1.09) ≈ 0.75.
 *
 *   C. Transition : le perceptron se démultiplie en réseau connecté → trois tâches.
 *
 * Quatre rôles, quatre couleurs : entrées = cyan, poids = jaune, biais = ambre, sortie = vert.
 * Arithmétique exacte : 0.7·0.5 + 0.2·(−0.4) + 0.9·0.8 + 0.1 = 1.09 ; σ(1.09) ≈ 0.75.
 */

import {makeScene2D, Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef,
  easeOutCubic, easeInOutCubic, easeOutBack,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // rôles → couleurs
  const C_IN   = PALETTE.cyan;   // entrées
  const C_W    = PALETTE.jaune;  // poids
  const C_BIAS = PALETTE.amber;  // biais
  const C_OUT  = PALETTE.vert;   // sortie

  // ── Géométrie du perceptron (neurone décalé vers le haut, équation en bas) ──
  const inputX = () => vW() * -0.40;
  const inputY = [() => vH() * -0.26, () => vH() * -0.12, () => vH() * 0.02];
  const rowY   = () => vH() * -0.12;          // ligne Σ / ƒ / sortie
  const biasX  = () => vW() * -0.40;
  const biasY  = () => vH() * 0.16;
  const sumX   = () => vW() * -0.07;
  const actX   = () => vW() * 0.18;
  const outX   = () => vW() * 0.40;
  const nodeR  = () => vW() * 0.026;

  // labels symboliques → valeurs numériques
  const IN_SYM = ['x₁', 'x₂', 'x₃'];
  const IN_VAL = ['0.7', '0.2', '0.9'];
  const W_SYM  = ['w₁', 'w₂', 'w₃'];
  const W_VAL  = ['0.5', '−0.4', '0.8'];

  const EQ_SYM     = 'z = x₁·w₁ + x₂·w₂ + x₃·w₃ + b';
  const EQ_NUM     = 'z = 0.7·0.5 + 0.2·(−0.4) + 0.9·0.8 + 0.1';
  const EQ_RESULT  = 'z = 1.09';
  const ACT_SYM    = 'a = ƒ(z)';
  const ACT_NUM    = 'a = σ(1.09) ≈ 0.75';

  // ── Refs : perceptron ─────────────────────────────────────────────────────
  const gridRef    = createRef<Grid>();
  const titleRef   = createRef<Txt>();

  const neuronGroup = createRef<Layout>();
  const inputNodes  = IN_SYM.map(() => createRef<Circle>());
  const inputLabels = IN_SYM.map(() => createRef<Txt>());
  const weightEdges = IN_SYM.map(() => createRef<Line>());
  const weightBadges = IN_SYM.map(() => createRef<Rect>());
  const weightLabels = IN_SYM.map(() => createRef<Txt>());

  const biasNode  = createRef<Circle>();
  const biasLabel = createRef<Txt>();
  const biasEdge  = createRef<Line>();

  const sumNode  = createRef<Circle>();
  const sumToAct = createRef<Line>();
  const actNode  = createRef<Rect>();
  const actCurve = createRef<Line>();
  const actToOut = createRef<Line>();
  const outNode  = createRef<Circle>();
  const outLabel = createRef<Txt>();

  const inputsNote = createRef<Txt>();
  const outNote    = createRef<Txt>();
  const eqMain     = createRef<Txt>();
  const eqAct      = createRef<Txt>();

  // sigmoïde pour la courbe de la fonction d'activation
  const curvePoints = (): [number, number][] => {
    const w = () => vW() * 0.045;
    const h = () => vH() * 0.05;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 20; k++) {
      const t = (k / 20) * 12 - 6;
      const s = 1 / (1 + Math.exp(-t));
      pts.push([(k / 20 - 0.5) * w(), (0.5 - s) * h()]);
    }
    return pts;
  };

  // ── Refs : réseau démultiplié (nœuds + connexions) ────────────────────────
  const netGroup = createRef<Layout>();
  const LAYER_SIZES = [4, 5, 5, 3];
  const netLayerX = (l: number) => () => vW() * (-0.34 + l * (0.68 / (LAYER_SIZES.length - 1)));
  const netNodeY  = (l: number, i: number) => () => vH() * (i - (LAYER_SIZES[l] - 1) / 2) * 0.115;
  const netNodeR  = () => vW() * 0.015;

  const netNodes: ReturnType<typeof createRef<Circle>>[][] =
    LAYER_SIZES.map(n => Array.from({length: n}, () => createRef<Circle>()));
  const netNodeFlat = LAYER_SIZES.flatMap((n, l) =>
    Array.from({length: n}, (_, i) => ({l, i, ref: netNodes[l][i]})));
  const netEdges: ReturnType<typeof createRef<Line>>[][] =
    LAYER_SIZES.slice(0, -1).map((n, g) =>
      Array.from({length: LAYER_SIZES[g] * LAYER_SIZES[g + 1]}, () => createRef<Line>()));
  const netEdgeFlat = LAYER_SIZES.slice(0, -1).flatMap((n, g) =>
    Array.from({length: LAYER_SIZES[g]}, (_, i) =>
      Array.from({length: LAYER_SIZES[g + 1]}, (_, j) => ({
        g, i, j, ref: netEdges[g][i * LAYER_SIZES[g + 1] + j],
      })),
    ).flat());

  // ── Refs : tâches ─────────────────────────────────────────────────────────
  const tasksGroup = createRef<Layout>();
  const TASKS = [
    {fr: 'JP → EN', sub: 'traduction'},
    {fr: 'tumeur', sub: 'segmentation'},
    {fr: 'piscines', sub: 'vue satellite'},
  ];
  const taskCards = TASKS.map(() => createRef<Rect>());

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
        text="UN PERCEPTRON"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.44}
        opacity={0} />

      {/* ── Le perceptron ─────────────────────────────────────────────────── */}
      <Layout key="neuron" ref={neuronGroup} opacity={0}>
        {/* arêtes entrée → Σ */}
        {IN_SYM.map((_, i) => (
          <Line key={`edge-${i}`} ref={weightEdges[i]}
            points={() => [
              [inputX() + nodeR(), inputY[i]()],
              [sumX() - nodeR(), rowY()],
            ]}
            stroke={PALETTE.secondary} lineWidth={2} endArrow arrowSize={8}
            end={0} opacity={0} />
        ))}
        {/* arête biais → Σ */}
        <Line key="bias-edge" ref={biasEdge}
          points={() => [
            [biasX() + nodeR() * 0.7, biasY()],
            [sumX() - nodeR(), rowY()],
          ]}
          stroke={C_BIAS} lineWidth={2} endArrow arrowSize={8}
          end={0} opacity={0} />

        <Line key="sum-to-act" ref={sumToAct}
          points={() => [[sumX() + nodeR(), rowY()], [actX() - vW() * 0.05, rowY()]]}
          stroke={PALETTE.secondary} lineWidth={3} endArrow arrowSize={9}
          end={0} opacity={0} />
        <Line key="act-to-out" ref={actToOut}
          points={() => [[actX() + vW() * 0.05, rowY()], [outX() - nodeR(), rowY()]]}
          stroke={C_OUT} lineWidth={3} endArrow arrowSize={9}
          end={0} opacity={0} />

        {/* nœuds d'entrée (cyan) — symboliques x₁ x₂ x₃ */}
        {IN_SYM.map((sym, i) => (
          <Circle key={`in-${i}`} ref={inputNodes[i]}
            width={() => nodeR() * 2} height={() => nodeR() * 2}
            fill={PALETTE.nodeBg} stroke={C_IN} lineWidth={3}
            x={inputX} y={inputY[i]}
            opacity={0}>
            <Txt ref={inputLabels[i]} text={sym} fill={PALETTE.cream}
              fontSize={() => vW() * 0.019} fontFamily={MONO} fontWeight={700} />
          </Circle>
        ))}

        {/* badges de POIDS (jaune) — symboliques w₁ w₂ w₃ */}
        {W_SYM.map((sym, i) => (
          <Rect key={`w-${i}`} ref={weightBadges[i]}
            width={() => vW() * 0.05} height={() => vH() * 0.05}
            fill={'#FFE14D22'} stroke={C_W} lineWidth={2}
            radius={() => vW() * 0.006}
            x={() => (inputX() + sumX()) / 2}
            y={() => (inputY[i]() + rowY()) / 2}
            opacity={0} scale={0.5}>
            <Txt ref={weightLabels[i]} text={sym} fill={C_W}
              fontSize={() => vW() * 0.017} fontFamily={MONO} fontWeight={700} />
          </Rect>
        ))}

        {/* biais (ambre) — symbolique b */}
        <Circle key="bias" ref={biasNode}
          width={() => nodeR() * 1.7} height={() => nodeR() * 1.7}
          fill={PALETTE.nodeBg} stroke={C_BIAS} lineWidth={3}
          x={biasX} y={biasY}
          opacity={0}>
          <Txt ref={biasLabel} text="b" fill={C_BIAS}
            fontSize={() => vW() * 0.018} fontFamily={MONO} fontWeight={700} />
        </Circle>

        {/* nœud somme Σ */}
        <Circle key="sum" ref={sumNode}
          width={() => nodeR() * 2.2} height={() => nodeR() * 2.2}
          fill={PALETTE.nodeActiveBg} stroke={PALETTE.cream} lineWidth={3}
          x={sumX} y={rowY}
          opacity={0}>
          <Txt text="Σ" fill={PALETTE.cream}
            fontSize={() => vW() * 0.026} fontFamily={MONO} fontWeight={700} />
        </Circle>

        {/* fonction d'activation ƒ */}
        <Rect key="act" ref={actNode}
          width={() => vW() * 0.085} height={() => vH() * 0.12}
          fill={PALETTE.nodeActiveBg} stroke={PALETTE.cream} lineWidth={2}
          radius={() => vW() * 0.008}
          x={actX} y={rowY}
          opacity={0}>
          <Line ref={actCurve} points={curvePoints}
            stroke={PALETTE.cream} lineWidth={3} end={0} />
          <Txt text="ƒ" fill={PALETTE.secondary}
            fontSize={() => vW() * 0.014} fontFamily={MONO} y={() => vH() * 0.04} />
        </Rect>

        {/* nœud de sortie unique (vert) — symbolique a */}
        <Circle key="out" ref={outNode}
          width={() => nodeR() * 2} height={() => nodeR() * 2}
          fill={PALETTE.nodeBg} stroke={C_OUT} lineWidth={3}
          x={outX} y={rowY}
          opacity={0}>
          <Txt ref={outLabel} text="a" fill={PALETTE.cream}
            fontSize={() => vW() * 0.019} fontFamily={MONO} fontWeight={700} />
        </Circle>

        {/* notes : plusieurs entrées → une seule sortie */}
        <Txt key="inputs-note" ref={inputsNote}
          text="plusieurs entrées" fill={C_IN}
          fontSize={() => vW() * 0.012} fontFamily={MONO}
          x={inputX} y={() => vH() * -0.38} opacity={0} />
        <Txt key="out-note" ref={outNote}
          text="une seule sortie" fill={C_OUT}
          fontSize={() => vW() * 0.012} fontFamily={MONO}
          x={outX} y={() => vH() * -0.26} opacity={0} />

        {/* équation : somme pondérée + biais, puis activation */}
        <Txt key="eq-main" ref={eqMain}
          text={EQ_SYM} fill={PALETTE.cream}
          fontSize={() => vW() * 0.022} fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.34} opacity={0} />
        <Txt key="eq-act" ref={eqAct}
          text={ACT_SYM} fill={C_OUT}
          fontSize={() => vW() * 0.02} fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.43} opacity={0} />
      </Layout>

      {/* ── Le réseau démultiplié ─────────────────────────────────────────── */}
      <Layout key="net" ref={netGroup} opacity={0}>
        {netEdgeFlat.map(({g, i, j, ref}) => (
          <Line key={`net-edge-${g}-${i}-${j}`} ref={ref}
            points={() => [
              [netLayerX(g)() + netNodeR(), netNodeY(g, i)()],
              [netLayerX(g + 1)() - netNodeR(), netNodeY(g + 1, j)()],
            ]}
            stroke={C_IN} lineWidth={1} opacity={0.3} end={0} />
        ))}
        {netNodeFlat.map(({l, i, ref}) => (
          <Circle key={`net-node-${l}-${i}`} ref={ref}
            width={() => netNodeR() * 2} height={() => netNodeR() * 2}
            fill={PALETTE.nodeBg} stroke={C_IN} lineWidth={2}
            x={netLayerX(l)} y={netNodeY(l, i)}
            scale={0} />
        ))}
      </Layout>

      {/* ── Trois tâches ──────────────────────────────────────────────────── */}
      <Layout key="tasks" ref={tasksGroup} opacity={0}>
        {TASKS.map((task, i) => (
          <Rect key={`task-${i}`} ref={taskCards[i]}
            width={() => vW() * 0.22} height={() => vH() * 0.18}
            fill={PALETTE.nodeBg} stroke={C_IN} lineWidth={2}
            radius={() => vW() * 0.01}
            x={() => (i - 1) * vW() * 0.26} y={() => vH() * 0.12}
            opacity={0} scale={0.85}>
            <Txt text={task.fr} fill={PALETTE.cream}
              fontSize={() => vW() * 0.026} fontFamily={MONO} fontWeight={700}
              y={() => vH() * -0.02} />
            <Txt text={task.sub} fill={PALETTE.secondary}
              fontSize={() => vW() * 0.014} fontFamily={SANS}
              y={() => vH() * 0.03} />
          </Rect>
        ))}
      </Layout>
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
    neuronGroup().opacity(1, 0.5),
  );

  // ── A · SYMBOLIQUE ────────────────────────────────────────────────────────

  // « plusieurs valeurs en entrée » → x₁ x₂ x₃
  yield* waitUntil('inputs');
  yield* all(
    sequence(0.12, ...inputNodes.map(n => n().opacity(1, 0.3))),
    inputsNote().opacity(1, 0.4),
  );

  // « un poids associé à chacune » → w₁ w₂ w₃
  yield* waitUntil('weights');
  yield* all(
    ...weightEdges.map(e => {
      e().opacity(1);
      return e().end(1, 0.4, easeOutCubic);
    }),
  );
  yield* sequence(0.12, ...weightBadges.map(b =>
    all(b().opacity(1, 0.3), b().scale(1, 0.35, easeOutBack))));
  yield* sequence(0.08, ...weightBadges.map(b => b().scale(1.12, 0.15).to(1, 0.15)));

  // « somme pondérée + biais » → Σ, biais, équation symbolique
  yield* waitUntil('sum');
  yield* sumNode().opacity(1, 0.3);
  yield* all(...weightEdges.map(e => e().stroke(C_W, 0.3)));
  // le biais entre dans la somme
  yield* biasNode().opacity(1, 0.3);
  biasEdge().opacity(1);
  yield* biasEdge().end(1, 0.4, easeOutCubic);
  // l'équation symbolique apparaît
  yield* eqMain().opacity(1, 0.5);

  // « passé dans une fonction d'activation » → ƒ, a = ƒ(z)
  yield* waitUntil('activation');
  yield* sumToAct().opacity(1, 0.01);
  yield* sumToAct().end(1, 0.4, easeOutCubic);
  yield* actNode().opacity(1, 0.3);
  yield* actCurve().end(1, 0.6, easeInOutCubic);
  yield* eqAct().opacity(1, 0.4);

  // « une seule valeur en sortie » → nœud a
  yield* waitUntil('output');
  yield* actToOut().opacity(1, 0.01);
  yield* actToOut().end(1, 0.4, easeOutCubic);
  yield* all(
    outNode().opacity(1, 0.3),
    outNote().opacity(1, 0.4),
  );
  yield* outNode().scale(1.15, 0.15).to(1, 0.15);
  yield* waitFor(0.4);

  // ── B · NUMÉRIQUE ─────────────────────────────────────────────────────────
  // « concrètement, avec des valeurs » → on remplace partout en même temps
  yield* waitUntil('substitute');
  yield* sequence(0.24,
    ...inputLabels.map((l, i) => l().text(IN_VAL[i], 0.4)),
    ...weightLabels.map((l, i) => l().text(W_VAL[i], 0.4)),
    biasLabel().text('0.1', 0.4),
    eqMain().text(EQ_NUM, 0.5),
  );
  yield* waitFor(0.3);
  // la somme pondérée se calcule → z = 1.09
  yield* all(
    eqMain().text(EQ_RESULT, 1),
    sumNode().scale(1.12, 0.5).to(1, 0.5),
  );
  // l'activation produit la sortie unique → a ≈ 0.75
  yield* waitFor(0.2);
  yield* all(
    eqAct().text(ACT_NUM, 0.5),
    outLabel().text('0.75', 0.4),
  );
  yield* outNode().scale(1.18, 0.15).to(1, 0.15);
  yield* waitFor(0.5);

  // ── C · TRANSITION vers le réseau ─────────────────────────────────────────
  yield* waitUntil('multiply');
  yield* titleRef().text('UN RÉSEAU', 0.4);
  yield* netGroup().opacity(1, 0.01);
  yield* all(
    neuronGroup().opacity(0, 0.7),
    (function* () {
      for (let l = 0; l < LAYER_SIZES.length; l++) {
        yield* all(...netNodes[l].map(n => n().scale(1, 0.3, easeOutBack)));
        if (l < LAYER_SIZES.length - 1) {
          yield* all(...netEdges[l].map(e => e().end(1, 0.35, easeOutCubic)));
        }
      }
    })(),
  );

  // « émerge de la même opération de base » → ondulation
  yield* waitUntil('arbitrary');
  yield* sequence(0.03,
    ...netNodeFlat.map(({ref}) => ref().fill(C_IN, 0.18).to(PALETTE.nodeBg, 0.4)));

  // « Traduire, segmenter, détecter » → trois tâches
  yield* waitUntil('tasks');
  yield* all(
    netGroup().position.y(vH() * -0.12, 0.5, easeInOutCubic),
    netGroup().scale(0.7, 0.5, easeInOutCubic),
  );
  yield* tasksGroup().opacity(1, 0.01);
  yield* sequence(0.18,
    ...taskCards.map(c => all(c().opacity(1, 0.4), c().scale(1, 0.4, easeOutCubic))));
  yield* waitFor(1.0);

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    netGroup().opacity(0, 0.5),
    tasksGroup().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
