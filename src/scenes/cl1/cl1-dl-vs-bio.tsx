import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Rect, Txt, Layout, Line, Circle} from '@motion-canvas/2d/lib/components';
import {
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  easeInCubic,
  waitUntil,
  waitFor,
  all,
  sequence,
  chain,
  loop,
  createRefArray,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:     '#0D1117',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    cream:  '#F9F9F6',
    ghost:  '#484F58',
    blue:   '#58A6FF',
    danger: '#F85149',
    orange: '#FF9F43',
  };

  // ─── Background + Grid ───
  const gridRef = createRef<Grid>();
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        stroke={COLORS.ghost}
        opacity={0}
        lineWidth={1}
        spacing={() => vW() * 0.055}
        zIndex={-1}
      />
    </Layout>
  );

  // ═══════════════════════════════════════════════════════════
  //  SECTION 1 - DEEP LEARNING
  // ═══════════════════════════════════════════════════════════

  const dlTitle = createRef<Txt>();
  const networkContainer = createRef<Layout>();

  // Neural network config: 3 layers - shifted LEFT
  const layers = [4, 6, 3];
  const nodeRefs: ReturnType<typeof createRef<Circle>>[][] = [];
  const connectionRefs = createRefArray<Line>();

  // Network on the left side
  const layerX = [-0.38, -0.22, -0.06];
  const nodeSpacingY = 0.085;

  for (let l = 0; l < layers.length; l++) {
    nodeRefs[l] = [];
    for (let n = 0; n < layers[l]; n++) {
      nodeRefs[l][n] = createRef<Circle>();
    }
  }

  // Loss curve refs
  const lossContainer = createRef<Layout>();
  const lossCurve = createRef<Line>();
  const lossAxisX = createRef<Line>();
  const lossAxisY = createRef<Line>();
  const lossTitle = createRef<Txt>();
  const lossLabelY = createRef<Txt>();
  const lossLabelX = createRef<Txt>();

  // Build network nodes
  const networkNodes: any[] = [];
  for (let l = 0; l < layers.length; l++) {
    const count = layers[l];
    const startY = -(count - 1) * nodeSpacingY / 2;
    for (let n = 0; n < count; n++) {
      networkNodes.push(
        <Circle
          ref={nodeRefs[l][n]}
          x={() => vW() * layerX[l]}
          y={() => vH() * (startY + n * nodeSpacingY)}
          width={() => vW() * 0.03}
          height={() => vW() * 0.03}
          fill={l === 0 ? COLORS.blue : l === 1 ? COLORS.jaune : COLORS.vert}
          shadowColor={l === 0 ? COLORS.blue : l === 1 ? COLORS.jaune : COLORS.vert}
          shadowBlur={0}
          opacity={0}
          zIndex={2}
        />
      );
    }
  }

  // Build connections - each gets a signal for animated weight (lineWidth)
  const weightSignals: ReturnType<typeof createSignal<number>>[] = [];
  const connectionLines: any[] = [];
  for (let l = 0; l < layers.length - 1; l++) {
    const countA = layers[l];
    const countB = layers[l + 1];
    const startYA = -(countA - 1) * nodeSpacingY / 2;
    const startYB = -(countB - 1) * nodeSpacingY / 2;
    for (let a = 0; a < countA; a++) {
      for (let b = 0; b < countB; b++) {
        const w = createSignal(1);
        weightSignals.push(w);
        connectionLines.push(
          <Line
            ref={connectionRefs}
            points={() => [
              [vW() * layerX[l], vH() * (startYA + a * nodeSpacingY)],
              [vW() * layerX[l + 1], vH() * (startYB + b * nodeSpacingY)],
            ]}
            stroke={COLORS.ghost}
            lineWidth={() => w()}
            opacity={0}
            zIndex={1}
          />
        );
      }
    }
  }

  // Randomize connection weights (thickness 0.5–4) to visualize weight updates
  function* shuffleWeights(duration = 0.3) {
    yield* all(
      ...weightSignals.map(w => {
        const target = 0.5 + Math.random() * 3.5;
        return w(target, duration, easeInOutCubic);
      }),
    );
  }

  // Loss curve points (exponential decay)
  const lossProgress = createSignal(0);
  const lossPoints = () => {
    const pts: [number, number][] = [];
    const steps = 80;
    const prog = lossProgress();
    const visibleSteps = Math.floor(prog * steps);
    for (let i = 0; i <= visibleSteps; i++) {
      const t = i / steps;
      const x = t * vW() * 0.28;
      const y = -Math.exp(-t * 4) * vH() * 0.15;
      pts.push([x, y]);
    }
    return pts;
  };

  // DL section title
  view.add(
    <Txt
      ref={dlTitle}
      text={'DEEP LEARNING'}
      fontFamily={'Space Grotesk'}
      fontWeight={800}
      fontSize={() => vW() * 0.04}
      fill={COLORS.cream}
      y={() => vH() * -0.43}
      opacity={0}
    />
  );

  // Network container - centered vertically
  view.add(
    <Layout ref={networkContainer} y={() => vH() * -0.02} opacity={0}>
      {...connectionLines}
      {...networkNodes}
    </Layout>
  );

  // Layer labels
  const layerLabels = ['Entrée', 'Couche\ncachée', 'Sortie'];
  const layerLabelRefs = createRefArray<Txt>();
  for (let l = 0; l < 3; l++) {
    view.add(
      <Txt
        ref={layerLabelRefs}
        text={layerLabels[l]}
        fontFamily={'DM Sans, Space Grotesk'}
        fontWeight={600}
        fontSize={() => vW() * 0.013}
        fill={COLORS.ghost}
        x={() => vW() * layerX[l]}
        y={() => vH() * 0.26}
        opacity={0}
        textAlign={'center'}
      />
    );
  }

  // Loss curve section - on the RIGHT
  view.add(
    <Layout ref={lossContainer} x={() => vW() * 0.12} y={() => vH() * 0.02} opacity={0}>
      <Line
        ref={lossAxisY}
        points={() => [[0, vH() * -0.2], [0, vH() * 0.02]]}
        stroke={COLORS.ghost}
        lineWidth={2}
      />
      <Line
        ref={lossAxisX}
        points={() => [[0, vH() * 0.02], [vW() * 0.3, vH() * 0.02]]}
        stroke={COLORS.ghost}
        lineWidth={2}
      />
      <Txt
        ref={lossTitle}
        text={'FONCTION DE LOSS'}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        fontSize={() => vW() * 0.016}
        fill={COLORS.jaune}
        x={() => vW() * 0.14}
        y={() => vH() * -0.25}
      />
      <Txt
        ref={lossLabelY}
        text={'Erreur'}
        fontFamily={'DM Sans, Space Grotesk'}
        fontWeight={600}
        fontSize={() => vW() * 0.012}
        fill={COLORS.ghost}
        x={() => vW() * -0.04}
        y={() => vH() * -0.1}
        rotation={-90}
      />
      <Txt
        ref={lossLabelX}
        text={'Époques'}
        fontFamily={'DM Sans, Space Grotesk'}
        fontWeight={600}
        fontSize={() => vW() * 0.012}
        fill={COLORS.ghost}
        x={() => vW() * 0.15}
        y={() => vH() * 0.07}
      />
      <Line
        ref={lossCurve}
        points={lossPoints}
        stroke={COLORS.jaune}
        lineWidth={3}
        zIndex={2}
      />
    </Layout>
  );

  // "Encore et Encore" + cost labels
  const encoreLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={encoreLabel}
      text={'Encore… et encore.'}
      fontFamily={'Space Grotesk'}
      fontWeight={700}
      fontSize={() => vW() * 0.028}
      fill={COLORS.rose}
      y={() => vH() * 0.36}
      opacity={0}
    />
  );

  const costLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={costLabel}
      text={'💰 Millions d\'exemples   ⚡ Énorme énergie'}
      fontFamily={'DM Sans, Space Grotesk'}
      fontWeight={600}
      fontSize={() => vW() * 0.018}
      fill={COLORS.orange}
      y={() => vH() * 0.42}
      opacity={0}
    />
  );

  // ═══════════════════════════════════════════════════════════
  //  SECTION 2 - CL1 BIOLOGICAL LEARNING
  // ═══════════════════════════════════════════════════════════

  const cl1Title = createRef<Txt>();
  const signalContainer = createRef<Layout>();
  const signalLine = createRef<Line>();
  const signalLabel = createRef<Txt>();
  const noiseLabel = createRef<Txt>();
  const neuronCircle = createRef<Circle>();
  const neuronLabel = createRef<Txt>();
  const neuronGlow = createSignal(0.5);
  const comfortBox = createRef<Rect>();
  const discomfortBox = createRef<Rect>();
  const fepTitle = createRef<Txt>();
  const fepQuote = createRef<Txt>();

  // Signal wave parameters
  const signalPhase = createSignal(0);
  const noiseAmount = createSignal(0);

  // Reproducible noise seeds
  const noiseSeeds: number[] = [];
  for (let i = 0; i < 200; i++) {
    noiseSeeds.push(Math.random() * 2 - 1);
  }

  const cleanSignalPoints = () => {
    const pts: [number, number][] = [];
    const steps = 120;
    const phase = signalPhase();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = (t - 0.5) * vW() * 0.7;
      const sine = Math.sin(t * Math.PI * 6 + phase) * vH() * 0.06;
      const noise = noiseAmount() * noiseSeeds[i % noiseSeeds.length] * vH() * 0.1;
      const highFreqNoise = noiseAmount() * Math.sin(t * Math.PI * 30 + phase * 3) * vH() * 0.03;
      const y = sine + noise + highFreqNoise;
      pts.push([x, y]);
    }
    return pts;
  };

  // CL1 section elements
  view.add(
    <Txt
      ref={cl1Title}
      text={'CL1 - APPRENTISSAGE BIOLOGIQUE'}
      fontFamily={'Space Grotesk'}
      fontWeight={800}
      fontSize={() => vW() * 0.036}
      fill={COLORS.cream}
      y={() => vH() * -0.43}
      opacity={0}
    />
  );

  // Connection line neuron → signal
  const neuronToSignal = createRef<Line>();
  view.add(
    <Line
      ref={neuronToSignal}
      points={() => [
        [0, vH() * -0.17],
        [0, vH() * -0.04],
      ]}
      stroke={COLORS.vert}
      lineWidth={2}
      lineDash={[8, 6]}
      opacity={0}
      zIndex={1}
      endArrow
      arrowSize={() => vW() * 0.008}
    />
  );

  // Label "le neurone s'adapte" near the connection
  const adaptLabel = createRef<Txt>();
  view.add(
    <Txt
      ref={adaptLabel}
      text={'le neurone modifie\nson activité'}
      fontFamily={'DM Mono, monospace'}
      fontWeight={600}
      fontSize={() => vW() * 0.013}
      fill={COLORS.vert}
      x={() => vW() * 0.09}
      y={() => vH() * -0.1}
      opacity={0}
      textAlign={'left'}
    />
  );

  view.add(
    <Circle
      ref={neuronCircle}
      x={0}
      y={() => vH() * -0.22}
      width={() => vW() * 0.09}
      height={() => vW() * 0.09}
      fill={'#1a2a1a'}
      stroke={COLORS.vert}
      lineWidth={3}
      shadowColor={COLORS.vert}
      shadowBlur={() => neuronGlow() * vW() * 0.025}
      opacity={0}
      zIndex={2}
    />
  );
  view.add(
    <Txt
      ref={neuronLabel}
      text={'🧠'}
      fontSize={() => vW() * 0.038}
      x={0}
      y={() => vH() * -0.225}
      opacity={0}
      zIndex={3}
    />
  );

  view.add(
    <Layout ref={signalContainer} y={() => vH() * 0.08} opacity={0}>
      <Line
        ref={signalLine}
        points={cleanSignalPoints}
        stroke={COLORS.vert}
        lineWidth={3}
        zIndex={2}
      />
      <Txt
        ref={signalLabel}
        text={'Signal stable - prévisible'}
        fontFamily={'DM Mono, monospace'}
        fontWeight={600}
        fontSize={() => vW() * 0.016}
        fill={COLORS.vert}
        y={() => vH() * -0.12}
        opacity={0}
      />
      <Txt
        ref={noiseLabel}
        text={'⚡ BRUIT - imprévisible'}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        fontSize={() => vW() * 0.016}
        fill={COLORS.rose}
        y={() => vH() * -0.12}
        opacity={0}
      />
    </Layout>
  );

  view.add(
    <Rect
      ref={comfortBox}
      x={() => vW() * -0.25}
      y={() => vH() * 0.32}
      width={() => vW() * 0.22}
      height={() => vH() * 0.07}
      radius={() => vW() * 0.008}
      fill={'#112211'}
      stroke={COLORS.vert}
      lineWidth={2}
      opacity={0}
    >
      <Txt
        text={'✓ Confortable'}
        fontFamily={'DM Sans, Space Grotesk'}
        fontWeight={700}
        fontSize={() => vW() * 0.018}
        fill={COLORS.vert}
      />
    </Rect>
  );

  view.add(
    <Rect
      ref={discomfortBox}
      x={() => vW() * 0.25}
      y={() => vH() * 0.32}
      width={() => vW() * 0.22}
      height={() => vH() * 0.07}
      radius={() => vW() * 0.008}
      fill={'#221111'}
      stroke={COLORS.rose}
      lineWidth={2}
      opacity={0}
    >
      <Txt
        text={'✗ Inconfortable'}
        fontFamily={'DM Sans, Space Grotesk'}
        fontWeight={700}
        fontSize={() => vW() * 0.018}
        fill={COLORS.rose}
      />
    </Rect>
  );

  view.add(
    <Txt
      ref={fepTitle}
      text={'Principe d\'Énergie Libre - Karl Friston'}
      fontFamily={'Space Grotesk'}
      fontWeight={800}
      fontSize={() => vW() * 0.024}
      fill={COLORS.jaune}
      y={() => vH() * 0.28}
      opacity={0}
    />
  );
  view.add(
    <Txt
      ref={fepQuote}
      text={'« Le cerveau ne cherche pas à avoir raison.\nIl cherche à ne plus être surpris. »'}
      fontFamily={'DM Sans, Space Grotesk'}
      fontWeight={600}
      fontSize={() => vW() * 0.02}
      fill={COLORS.cream}
      y={() => vH() * 0.37}
      opacity={0}
      textAlign={'center'}
    />
  );

  // ═══════════════════════════════════════════════════════════
  //  HELPER - Backprop glow pulse through the network
  //  Signal lumineux rose qui remonte de la sortie vers l'entrée
  // ═══════════════════════════════════════════════════════════

  function* backpropPulse(duration = 0.2, glowSize = 0.015) {
    // Traverse layers from output → input
    for (let l = layers.length - 1; l >= 0; l--) {
      yield* all(
        ...nodeRefs[l].map(ref =>
          chain(
            all(
              ref().shadowBlur(vW() * glowSize, duration * 0.4, easeOutCubic),
              ref().fill(COLORS.rose, duration * 0.4),
              ref().scale(1.25, duration * 0.4, easeOutCubic),
            ),
            all(
              ref().shadowBlur(0, duration * 0.6, easeInOutCubic),
              ref().fill(
                l === 0 ? COLORS.blue : l === 1 ? COLORS.jaune : COLORS.vert,
                duration * 0.6,
              ),
              ref().scale(1, duration * 0.6, easeInOutCubic),
            ),
          )
        ),
      );
    }
    // Weights update after error propagates through the network
    yield* shuffleWeights(duration * 1.5);
  }

  // ═══════════════════════════════════════════════════════════
  //  ANIMATION SEQUENCE
  // ═══════════════════════════════════════════════════════════

  // ─── Grid fade in ───
  yield* gridRef().opacity(0.12, 0.6, easeOutCubic);

  // ─── Phase 1: DL Title ───
  yield* waitUntil('dl-title');
  yield* dlTitle().opacity(1, 0.5, easeOutCubic);

  // ─── Phase 2: Network appears ───
  yield* waitUntil('dl-network');
  yield* networkContainer().opacity(1, 0.3);

  // Nodes appear layer by layer
  for (let l = 0; l < layers.length; l++) {
    yield* sequence(
      0.05,
      ...nodeRefs[l].map(ref => ref().opacity(1, 0.3, easeOutCubic)),
    );
    if (l < layers.length - 1) {
      yield* waitFor(0.1);
    }
  }

  // Layer labels
  yield* sequence(0.1, ...layerLabelRefs.map(l => l.opacity(1, 0.3)));

  // Connections appear with initial random weights
  yield* sequence(
    0.02,
    ...connectionRefs.map(c => c.opacity(0.35, 0.2)),
  );
  yield* shuffleWeights(0.5);

  // ─── Phase 3: Forward pass (pulse through nodes) ───
  yield* waitUntil('dl-forward');

  for (let pass = 0; pass < 2; pass++) {
    for (let l = 0; l < layers.length; l++) {
      yield* all(
        ...nodeRefs[l].map(ref =>
          chain(
            ref().scale(1.3, 0.15, easeOutCubic),
            ref().scale(1, 0.2, easeInOutCubic),
          )
        ),
      );
    }
    yield* waitFor(0.15);
  }

  // ─── Phase 4: Backprop - signal lumineux qui remonte ───
  yield* waitUntil('dl-backprop');

  // First pass: slow, clearly visible
  yield* backpropPulse(0.35, 0.02);
  yield* waitFor(0.2);
  // Second pass
  yield* backpropPulse(0.3, 0.018);

  // ─── Phase 5: Loss curve ───
  yield* waitUntil('dl-loss');
  yield* lossContainer().opacity(1, 0.4);
  yield* lossProgress(1, 2.5, easeInOutCubic);

  // ─── Phase 6: "Encore et encore" - rapid loops ───
  yield* waitUntil('dl-encore');
  yield* encoreLabel().opacity(1, 0.4);
  yield* costLabel().opacity(1, 0.4);

  // Quick forward + backprop flashes
  for (let rep = 0; rep < 3; rep++) {
    // Forward
    for (let l = 0; l < layers.length; l++) {
      yield* all(
        ...nodeRefs[l].map(ref =>
          chain(
            ref().scale(1.15, 0.06),
            ref().scale(1, 0.06),
          )
        ),
      );
    }
    // Backprop glow (fast)
    yield* backpropPulse(0.12, 0.012);
  }

  // ─── Phase 7: Transition to CL1 ───
  yield* waitUntil('cl1-transition');

  yield* all(
    dlTitle().opacity(0, 0.5),
    networkContainer().opacity(0, 0.5),
    ...layerLabelRefs.map(l => l.opacity(0, 0.5)),
    lossContainer().opacity(0, 0.5),
    encoreLabel().opacity(0, 0.5),
    costLabel().opacity(0, 0.5),
  );

  // ─── Phase 8: CL1 title ───
  yield* waitUntil('cl1-title');
  yield* cl1Title().opacity(1, 0.5, easeOutCubic);

  // ─── Phase 9: Neuron appears ───
  yield* waitUntil('cl1-neuron');
  yield* all(
    neuronCircle().opacity(1, 0.4, easeOutCubic),
    neuronLabel().opacity(1, 0.4, easeOutCubic),
  );

  // Gentle glow pulse loop
  yield loop(Infinity, function* () {
    yield* neuronGlow(1.5, 0.8, easeInOutCubic);
    yield* neuronGlow(0.5, 0.8, easeInOutCubic);
  });

  // ─── Phase 10: Clean signal ───
  yield* waitUntil('cl1-signal-clean');
  yield* signalContainer().opacity(1, 0.4);
  yield* signalLabel().opacity(1, 0.3);
  yield* comfortBox().opacity(1, 0.3);

  yield* signalPhase(Math.PI * 8, 4, easeInOutCubic);

  // ─── Phase 11: Noise signal ───
  yield* waitUntil('cl1-signal-noise');

  yield* all(
    signalLabel().opacity(0, 0.2),
    comfortBox().opacity(0, 0.3),
  );
  yield* all(
    noiseLabel().opacity(1, 0.3),
    discomfortBox().opacity(1, 0.3),
  );

  yield* all(
    noiseAmount(1, 0.6, easeOutCubic),
    signalLine().stroke(COLORS.rose, 0.6),
    neuronCircle().stroke(COLORS.rose, 0.4),
    neuronCircle().shadowColor(COLORS.rose, 0.4),
  );

  yield* neuronGlow(3, 0.3, easeOutCubic);
  yield* signalPhase(Math.PI * 14, 3, easeInOutCubic);

  // ─── Phase 12: Neuron adapts - step by step ───
  yield* waitUntil('cl1-adapt');

  // Show connection neuron → signal + label
  yield* all(
    neuronToSignal().opacity(0.6, 0.4),
    adaptLabel().opacity(1, 0.4),
  );

  // Step-by-step adaptation: neuron pulses → noise decreases
  // Each step: neuron glow pulse, then noise drops a notch
  const adaptSteps = [
    { noise: 0.7, phase: Math.PI * 16 },
    { noise: 0.4, phase: Math.PI * 17.5 },
    { noise: 0.15, phase: Math.PI * 19 },
    { noise: 0.05, phase: Math.PI * 20 },
  ];

  for (let i = 0; i < adaptSteps.length; i++) {
    const step = adaptSteps[i];
    // Neuron pulses (it's "working")
    yield* all(
      neuronGlow(4, 0.2, easeOutCubic),
      neuronCircle().scale(1.15, 0.2, easeOutCubic),
    );
    // Noise drops + neuron settles
    yield* all(
      neuronGlow(1, 0.4, easeInOutCubic),
      neuronCircle().scale(1, 0.3, easeInOutCubic),
      noiseAmount(step.noise, 0.6, easeInOutCubic),
      signalPhase(step.phase, 0.6),
    );
    // Gradual color shift back to green as noise decreases
    if (i >= 1) {
      const blend = i / (adaptSteps.length - 1); // 0→1
      yield* all(
        signalLine().stroke(
          blend > 0.5 ? COLORS.vert : COLORS.rose, 0.3,
        ),
        neuronCircle().stroke(
          blend > 0.5 ? COLORS.vert : COLORS.rose, 0.3,
        ),
        neuronCircle().shadowColor(
          blend > 0.5 ? COLORS.vert : COLORS.rose, 0.3,
        ),
      );
    }
    yield* waitFor(0.15);
  }

  // Final state: fully green, clean signal
  yield* all(
    signalLine().stroke(COLORS.vert, 0.4),
    neuronCircle().stroke(COLORS.vert, 0.4),
    neuronCircle().shadowColor(COLORS.vert, 0.4),
  );

  yield* all(
    noiseLabel().opacity(0, 0.3),
    discomfortBox().opacity(0, 0.3),
    adaptLabel().opacity(0, 0.3),
    neuronToSignal().opacity(0, 0.3),
  );
  yield* all(
    signalLabel().opacity(1, 0.3),
    comfortBox().opacity(1, 0.3),
  );

  yield* neuronGlow(0.5, 0.5);

  // ─── Phase 13: Free Energy Principle ───
  yield* waitUntil('cl1-fep');

  yield* all(
    signalContainer().opacity(0.3, 0.4),
    neuronCircle().opacity(0.3, 0.4),
    neuronLabel().opacity(0.3, 0.4),
    comfortBox().opacity(0, 0.3),
  );

  yield* fepTitle().opacity(1, 0.5, easeOutCubic);
  yield* fepQuote().opacity(1, 0.6, easeOutCubic);

  // ─── End ───
  yield* waitUntil('end');
  yield* all(
    cl1Title().opacity(0, 0.6),
    fepTitle().opacity(0, 0.6),
    fepQuote().opacity(0, 0.6),
    signalContainer().opacity(0, 0.6),
    neuronCircle().opacity(0, 0.6),
    neuronLabel().opacity(0, 0.6),
    gridRef().opacity(0, 0.6),
  );
});
