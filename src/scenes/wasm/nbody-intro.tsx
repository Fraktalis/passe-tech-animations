import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Latex, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, waitFor, waitUntil} from '@motion-canvas/core';

// ─────────────────────────────────────────────────────────────────────────────
// N-Body intro - illustre le problème des N corps
// 6 "étoiles" disséminées dans l'espace ; pour chaque particule active (bleue)
// on trace les N-1 lignes de force vers toutes les autres.
// Après le sweep, les particules bougent légèrement (étape d'intégration).
// ─────────────────────────────────────────────────────────────────────────────

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // Dimensions fixes (pas de resize pendant le rendu)
  const W = view.width();
  const H = view.height();

  const N = 6;

  const C = {
    bg:     '#0D1117',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    cream:  '#F9F9F6',
    ghost:  '#484F58',
    dim:    '#1C2128',
    self:   '#58A6FF',
    active: '#3FB950',
    star:   '#C9D1D9',
  };

  // Positions de base (fraction de W / H) et rayons (fraction de W)
  const PX = [-0.30,  0.22,  0.34,  0.04, -0.24,  0.01];
  const PY = [-0.18, -0.24,  0.09,  0.27,  0.21, -0.06];
  const PR = [ 0.022,0.022,0.022,0.022,0.022,0.022];

  // Décalages après calcul des forces (simule l'intégration de position)
  const DX = [ 0.035, -0.025,  -0.040, -0.030,  0.020, -0.015];
  const DY = [ 0.040,  0.050, -0.025,  -0.035, -0.030,  0.025];

  // ─── Refs ────────────────────────────────────────────────────────────────
  const gridBg      = createRef<Grid>();
  const titleRef    = createRef<Txt>();
  const subtitleRef = createRef<Txt>();
  const counterTxt  = createRef<Txt>();

  const latexRef  = createRef<Latex>();
  const massLabel = createRef<Txt>();

  // Légende - terme (coloré) + description (ghost), 4 lignes
  const LEGEND = [
    { term: 'F',        color: C.rose,  desc: '- force gravitationnelle entre deux corps' },
    { term: 'G',        color: C.vert,  desc: '- constante gravitationnelle  (6.674 × 10⁻¹¹)' },
    { term: 'm₁, m₂',  color: C.jaune, desc: '- masses des deux corps' },
    { term: 'r',        color: C.self,  desc: '- distance entre les corps' },
  ];
  const legendTerms = Array.from({length: LEGEND.length}, () => createRef<Txt>());
  const legendDescs = Array.from({length: LEGEND.length}, () => createRef<Txt>());

  const pRefs     = Array.from({length: N},     () => createRef<Rect>());
  const pLabels   = Array.from({length: N},     () => createRef<Txt>());
  const ringRefs  = Array.from({length: N},     () => createRef<Rect>());
  const connLines = Array.from({length: N - 1}, () => createRef<Line>());

  // ─── Scene tree ──────────────────────────────────────────────────────────
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid ref={gridBg} width={'100%'} height={'100%'} stroke={C.ghost} opacity={0} lineWidth={1} spacing={() => vW() * 0.055} zIndex={-1} />

      {/* Titles */}
      <Txt ref={titleRef}    text="N-BODY PROBLEM"                              fill={C.cream} fontSize={() => vW() * 0.038} fontWeight={800} fontFamily={'Space Grotesk'} y={() => vH() * -0.42} opacity={0} />
      <Txt ref={subtitleRef} text="N particules, toutes soumises à la gravité mutuelle" fill={C.ghost} fontSize={() => vW() * 0.017} fontFamily={'Space Grotesk'} y={() => vH() * -0.36} opacity={0} />

      {/* Formule de gravitation */}
      <Latex
        ref={latexRef}
        tex={['F',  '=', 'G', '\\cdot', '\\frac{ {{m_1 \\cdot m_2}} }{r^2}']}
        fill={C.cream}
        fontSize={160}
        y={H * -0.15}
        opacity={0}
      />

      {/* Légende - terme coloré à gauche, description ghost à droite */}
      <Txt ref={legendTerms[0]} text={LEGEND[0].term} fill={LEGEND[0].color} fontSize={() => vW()*0.018} fontWeight={700} fontFamily={'DM Mono, monospace'} x={W * -0.12} y={H * 0.08} opacity={0} />
      <Txt ref={legendDescs[0]} text={LEGEND[0].desc} fill={C.ghost}          fontSize={() => vW()*0.017}               fontFamily={'Space Grotesk'}       x={W *  0.06} y={H * 0.08} opacity={0} />

      <Txt ref={legendTerms[1]} text={LEGEND[1].term} fill={LEGEND[1].color} fontSize={() => vW()*0.018} fontWeight={700} fontFamily={'DM Mono, monospace'} x={W * -0.12} y={H * 0.16} opacity={0} />
      <Txt ref={legendDescs[1]} text={LEGEND[1].desc} fill={C.ghost}          fontSize={() => vW()*0.017}               fontFamily={'Space Grotesk'}       x={W *  0.06} y={H * 0.16} opacity={0} />

      <Txt ref={legendTerms[2]} text={LEGEND[2].term} fill={LEGEND[2].color} fontSize={() => vW()*0.018} fontWeight={700} fontFamily={'DM Mono, monospace'} x={W * -0.12} y={H * 0.24} opacity={0} />
      <Txt ref={legendDescs[2]} text={LEGEND[2].desc} fill={C.ghost}          fontSize={() => vW()*0.017}               fontFamily={'Space Grotesk'}       x={W *  0.06} y={H * 0.24} opacity={0} />

      <Txt ref={legendTerms[3]} text={LEGEND[3].term} fill={LEGEND[3].color} fontSize={() => vW()*0.018} fontWeight={700} fontFamily={'DM Mono, monospace'} x={W * -0.12} y={H * 0.32} opacity={0} />
      <Txt ref={legendDescs[3]} text={LEGEND[3].desc} fill={C.ghost}          fontSize={() => vW()*0.017}               fontFamily={'Space Grotesk'}       x={W *  0.06} y={H * 0.32} opacity={0} />

      <Txt
        ref={massLabel}
        text="on pose  m = 1"
        fill={C.jaune}
        fontSize={() => vW() * 0.021}
        fontWeight={600}
        fontFamily={'Space Grotesk'}
        y={H * 0.44}
        opacity={0}
      />

      {/* Counter */}
      <Txt ref={counterTxt} text="" fill={C.ghost} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} y={() => vH() * 0.42} opacity={0} />

      {/* Reusable connection lines */}
      <Line ref={connLines[0]} points={[[0,0],[1,1]]} stroke={C.vert} lineWidth={1} opacity={0} end={0} />
      <Line ref={connLines[1]} points={[[0,0],[1,1]]} stroke={C.vert} lineWidth={1} opacity={0} end={0} />
      <Line ref={connLines[2]} points={[[0,0],[1,1]]} stroke={C.vert} lineWidth={1} opacity={0} end={0} />
      <Line ref={connLines[3]} points={[[0,0],[1,1]]} stroke={C.vert} lineWidth={1} opacity={0} end={0} />
      <Line ref={connLines[4]} points={[[0,0],[1,1]]} stroke={C.vert} lineWidth={1} opacity={0} end={0} />

      {/* Active-particle rings - positions statiques pour correspondre aux pRefs */}
      <Rect ref={ringRefs[0]} x={W*PX[0]} y={H*PY[0]} width={W*(PR[0]*2+0.05)} height={W*(PR[0]*2+0.05)} radius={W*(PR[0]+0.025)} fill={null} stroke={C.self} lineWidth={2} opacity={0} />
      <Rect ref={ringRefs[1]} x={W*PX[1]} y={H*PY[1]} width={W*(PR[1]*2+0.05)} height={W*(PR[1]*2+0.05)} radius={W*(PR[1]+0.025)} fill={null} stroke={C.self} lineWidth={2} opacity={0} />
      <Rect ref={ringRefs[2]} x={W*PX[2]} y={H*PY[2]} width={W*(PR[2]*2+0.05)} height={W*(PR[2]*2+0.05)} radius={W*(PR[2]+0.025)} fill={null} stroke={C.self} lineWidth={2} opacity={0} />
      <Rect ref={ringRefs[3]} x={W*PX[3]} y={H*PY[3]} width={W*(PR[3]*2+0.05)} height={W*(PR[3]*2+0.05)} radius={W*(PR[3]+0.025)} fill={null} stroke={C.self} lineWidth={2} opacity={0} />
      <Rect ref={ringRefs[4]} x={W*PX[4]} y={H*PY[4]} width={W*(PR[4]*2+0.05)} height={W*(PR[4]*2+0.05)} radius={W*(PR[4]+0.025)} fill={null} stroke={C.self} lineWidth={2} opacity={0} />
      <Rect ref={ringRefs[5]} x={W*PX[5]} y={H*PY[5]} width={W*(PR[5]*2+0.05)} height={W*(PR[5]*2+0.05)} radius={W*(PR[5]+0.025)} fill={null} stroke={C.self} lineWidth={2} opacity={0} />

      {/* Particles - positions statiques, scale=0 pour apparition par croissance */}
      <Rect ref={pRefs[0]} x={W*PX[0]} y={H*PY[0]} width={W*PR[0]*2} height={W*PR[0]*2} radius={W*PR[0]} fill={C.star} scale={0} />
      <Rect ref={pRefs[1]} x={W*PX[1]} y={H*PY[1]} width={W*PR[1]*2} height={W*PR[1]*2} radius={W*PR[1]} fill={C.star} scale={0} />
      <Rect ref={pRefs[2]} x={W*PX[2]} y={H*PY[2]} width={W*PR[2]*2} height={W*PR[2]*2} radius={W*PR[2]} fill={C.star} scale={0} />
      <Rect ref={pRefs[3]} x={W*PX[3]} y={H*PY[3]} width={W*PR[3]*2} height={W*PR[3]*2} radius={W*PR[3]} fill={C.star} scale={0} />
      <Rect ref={pRefs[4]} x={W*PX[4]} y={H*PY[4]} width={W*PR[4]*2} height={W*PR[4]*2} radius={W*PR[4]} fill={C.star} scale={0} />
      <Rect ref={pRefs[5]} x={W*PX[5]} y={H*PY[5]} width={W*PR[5]*2} height={W*PR[5]*2} radius={W*PR[5]} fill={C.star} scale={0} />

      {/* Particle labels */}
      <Txt ref={pLabels[0]} text="P0" fill={C.ghost} fontSize={() => vW()*0.014} fontFamily={'DM Mono, monospace'} x={W*PX[0]} y={H*PY[0] - H*0.07} opacity={0} />
      <Txt ref={pLabels[1]} text="P1" fill={C.ghost} fontSize={() => vW()*0.014} fontFamily={'DM Mono, monospace'} x={W*PX[1]} y={H*PY[1] - H*0.07} opacity={0} />
      <Txt ref={pLabels[2]} text="P2" fill={C.ghost} fontSize={() => vW()*0.014} fontFamily={'DM Mono, monospace'} x={W*PX[2]} y={H*PY[2] - H*0.07} opacity={0} />
      <Txt ref={pLabels[3]} text="P3" fill={C.ghost} fontSize={() => vW()*0.014} fontFamily={'DM Mono, monospace'} x={W*PX[3]} y={H*PY[3] - H*0.07} opacity={0} />
      <Txt ref={pLabels[4]} text="P4" fill={C.ghost} fontSize={() => vW()*0.014} fontFamily={'DM Mono, monospace'} x={W*PX[4]} y={H*PY[4] - H*0.07} opacity={0} />
      <Txt ref={pLabels[5]} text="P5" fill={C.ghost} fontSize={() => vW()*0.014} fontFamily={'DM Mono, monospace'} x={W*PX[5]} y={H*PY[5] - H*0.07} opacity={0} />
    </Layout>,
  );

  // ══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ══════════════════════════════════════════════════════════════════════════

  // ─── Intro ───
  yield* waitUntil('intro');

  yield* gridBg().opacity(0.08, 0.8);
  yield* all(titleRef().opacity(1, 0.6), subtitleRef().opacity(1, 0.5));
  yield* waitFor(0.5);

  // ─── Formule de gravitation ───
  yield* waitUntil('formulaAppear');

  yield* latexRef().opacity(1, 0.6);
  yield* waitFor(0.6);

  // Légende : apparition terme par terme
  for (let i = 0; i < LEGEND.length; i++) {
    yield* all(
      legendTerms[i]().opacity(1, 0.3),
      legendDescs[i]().opacity(1, 0.3),
    );
    yield* waitFor(0.25);
  }
  yield* waitFor(0.8);

  // "on pose m = 1" - légende s'efface, label apparaît
  yield* all(
    ...legendTerms.map(r => r().opacity(0, 0.3)),
    ...legendDescs.map(r => r().opacity(0, 0.3)),
    massLabel().opacity(1, 0.4),
  );
  yield* waitFor(0.5);

  // Simplification : m₁·m₂ → 1
  yield* latexRef().tex(['F',  '=', 'G', '\\cdot', '\\dfrac{ {{1}} }{r^2}'], 0.7);
  yield* waitFor(1.2);

  yield* all(
    latexRef().opacity(0, 0.5),
    massLabel().opacity(0, 0.4),
  );
  yield* waitFor(0.6);

  // ─── Particles appear by growing ───
  yield* waitUntil('particlesAppear');

  for (let i = 0; i < N; i++) {
    yield* all(
      pRefs[i]().scale(1, 0.3),
      pLabels[i]().opacity(1, 0.3),
    );
    yield* waitFor(0.15);
  }
  yield* waitFor(0.6);

  // ─── Brute force sweep ───
  yield* waitUntil('bruteForce');

  counterTxt().opacity(1);
  let totalOps = 0;

  for (let a = 0; a < N; a++) {
    // Highlight active particle
    pRefs[a]().shadowColor(C.self);
    yield* all(
      pRefs[a]().fill(C.self, 0.15),
      pRefs[a]().shadowBlur(vW() * 0.02, 0.15),
      ringRefs[a]().opacity(1, 0.15),
    );

    // Draw lines to each other particle
    let lineIdx = 0;
    for (let b = 0; b < N; b++) {
      if (b === a) continue;

      // Highlight target particle briefly
      pRefs[b]().shadowColor(C.vert);
      yield* pRefs[b]().shadowBlur(vW() * 0.012, 0.06);

      // Set line points and animate
      connLines[lineIdx]().points([
        [W * PX[a], H * PY[a]],
        [W * PX[b], H * PY[b]],
      ]);
      connLines[lineIdx]().end(0);
      connLines[lineIdx]().opacity(0.75);
      yield* connLines[lineIdx]().end(1, 0.09);

      totalOps++;
      counterTxt().text(`P${a} → P${b}   [ ${totalOps} / ${N*(N-1)} calculs ]`);

      lineIdx++;
    }

    yield* waitFor(0.2);

    // Fade lines and ring, reset particles
    yield* all(
      ...connLines.map(l => l().opacity(0, 0.2)),
      ringRefs[a]().opacity(0, 0.2),
      pRefs[a]().fill(C.star, 0.2),
      pRefs[a]().shadowBlur(0, 0.2),
      ...pRefs.filter((_, b) => b !== a).map(p => p().shadowBlur(0, 0.15)),
    );

    connLines.forEach(l => { l().end(0); });
  }

  yield* counterTxt().opacity(0, 0.3);

  // ─── Position update - les particules bougent (intégration) ───
  yield* waitUntil('positionUpdate');

  yield* all(
    ...pRefs.map((p, i) => all(
      p().x(W * (PX[i] + DX[i]), 0.6),
      p().y(H * (PY[i] + DY[i]), 0.6),
    )),
    ...pLabels.map((l, i) => all(
      l().x(W * (PX[i] + DX[i]), 0.6),
      l().y(H * (PY[i] + DY[i]) - H * 0.07, 0.6),
    )),
  );

  yield* waitFor(1);

  // ─── End ───
  yield* waitUntil('endScene');

  yield* all(
    titleRef().opacity(0, 0.5),
    subtitleRef().opacity(0, 0.5),
    gridBg().opacity(0, 0.5),
    ...pRefs.map(p => p().scale(0, 0.4)),
    ...pLabels.map(l => l().opacity(0, 0.3)),
  );
});
