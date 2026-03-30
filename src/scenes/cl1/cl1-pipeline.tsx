import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
import {
  all,
  chain,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:       '#0D1117',
    rose:     '#FF3E6C',
    vert:     '#6DFF8A',
    jaune:    '#FFE14D',
    cream:    '#F9F9F6',
    ghost:    '#484F58',
    terminal: '#161B22',
    blue:     '#58A6FF',
    danger:   '#F85149',
  };

  // ─── Layout constants ───
  // 4 blocks, evenly spaced. Half-width = 0.07
  const BX = [-0.375, -0.125, 0.125, 0.375] as const;
  const BY = -0.04; // block center y (fraction of vH)

  // Signal for CL1 glow pulse
  const cl1Glow = createSignal(0.5);

  // ─── Refs ───
  const gridRef        = createRef<Grid>();
  const titleRef       = createRef<Txt>();
  const subtitleRef    = createRef<Txt>();

  const block1         = createRef<Rect>();
  const block2         = createRef<Rect>();
  const block3         = createRef<Rect>();
  const block4         = createRef<Rect>();

  const arrow12        = createRef<Line>();
  const arrow23        = createRef<Line>();
  const arrow34        = createRef<Line>();

  const dataLabel12    = createRef<Txt>();
  const dataLabel23    = createRef<Txt>();
  const dataLabel34    = createRef<Txt>();

  const feedbackLine   = createRef<Line>();
  const feedbackLabel  = createRef<Txt>();

  const bypassArrow    = createRef<Line>();
  const warningBox     = createRef<Rect>();

  const ablationTitle  = createRef<Txt>();
  const ablationSub    = createRef<Txt>();
  const ablationResult = createRef<Txt>();
  const cl1Highlight   = createRef<Rect>();

  // CL1 inner text refs (pour swap au moment de l'ablation)
  const cl1TitleRef    = createRef<Txt>();
  const cl1Sub1Ref     = createRef<Txt>();
  const cl1Sub2Ref     = createRef<Txt>();

  // Performance bar
  const perfLevel      = createSignal(1.0);
  const perfBarLabel   = createRef<Txt>();
  const perfContainer  = createRef<Rect>();
  const perfFill       = createRef<Rect>();
  const perfValueRef   = createRef<Txt>();

  // ═══════════════════════════════════════════
  // SCENE TREE
  // ═══════════════════════════════════════════
  view.add(
    <Layout>
      {/* Background */}
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

      {/* ── TITLE ── */}
      <Txt
        ref={titleRef}
        text="LE PIPELINE COMPLET"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.038}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.42}
        opacity={0}
      />
      <Txt
        ref={subtitleRef}
        text="4 blocs - 3 sur silicium classique, 1 biologique"
        fill={COLORS.ghost}
        fontSize={() => vW() * 0.018}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.345}
        opacity={0}
      />

      {/* ══ BLOCK 1 - FREEDOOM ══ */}
      <Rect
        ref={block1}
        x={() => vW() * BX[0]}
        y={() => vH() * BY}
        width={() => vW() * 0.14}
        height={() => vH() * 0.21}
        fill={`${COLORS.ghost}20`}
        stroke={COLORS.ghost}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="01" fill={COLORS.ghost} fontSize={() => vW() * 0.01} fontFamily={'DM Mono, monospace'} opacity={0.5} />
        <Txt text="FREEDOOM" fill={COLORS.cream} fontSize={() => vW() * 0.017} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="silicium" fill={COLORS.ghost} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ══ BLOCK 2 - ENCODEUR ══ */}
      <Rect
        ref={block2}
        x={() => vW() * BX[1]}
        y={() => vH() * BY}
        width={() => vW() * 0.14}
        height={() => vH() * 0.21}
        fill={`${COLORS.blue}15`}
        stroke={COLORS.blue}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="02" fill={COLORS.blue} fontSize={() => vW() * 0.01} fontFamily={'DM Mono, monospace'} opacity={0.5} />
        <Txt text="ENCODEUR" fill={COLORS.blue} fontSize={() => vW() * 0.017} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="PyTorch · GPU" fill={COLORS.blue} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* ══ BLOCK 3 - CL1 (neurones) ══ */}
      <Rect
        ref={block3}
        x={() => vW() * BX[2]}
        y={() => vH() * BY}
        width={() => vW() * 0.14}
        height={() => vH() * 0.21}
        fill={`${COLORS.rose}18`}
        stroke={COLORS.rose}
        lineWidth={3}
        radius={() => vW() * 0.006}
        opacity={0}
        shadowColor={COLORS.rose}
        shadowBlur={() => cl1Glow() * vW() * 0.03}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="03" fill={COLORS.rose} fontSize={() => vW() * 0.01} fontFamily={'DM Mono, monospace'} opacity={0.5} />
        <Txt ref={cl1TitleRef} text="CL1" fill={COLORS.rose} fontSize={() => vW() * 0.024} fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt ref={cl1Sub1Ref} text="200 000 neurones" fill={COLORS.rose} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.75} />
        <Txt ref={cl1Sub2Ref} text="59 électrodes" fill={COLORS.rose} fontSize={() => vW() * 0.01} fontFamily={'DM Mono, monospace'} opacity={0.5} />
      </Rect>

      {/* ══ BLOCK 4 - DÉCODEUR ══ */}
      <Rect
        ref={block4}
        x={() => vW() * BX[3]}
        y={() => vH() * BY}
        width={() => vW() * 0.14}
        height={() => vH() * 0.21}
        fill={`${COLORS.blue}15`}
        stroke={COLORS.blue}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="04" fill={COLORS.blue} fontSize={() => vW() * 0.01} fontFamily={'DM Mono, monospace'} opacity={0.5} />
        <Txt text="DÉCODEUR" fill={COLORS.blue} fontSize={() => vW() * 0.017} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="PyTorch · GPU" fill={COLORS.blue} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* ══ ARROWS block → block ══ */}
      <Line
        ref={arrow12}
        stroke={COLORS.ghost}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * (BX[0] + 0.075), vH() * BY],
          [vW() * (BX[1] - 0.075), vH() * BY],
        ]}
        end={0}
      />
      <Line
        ref={arrow23}
        stroke={COLORS.blue}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * (BX[1] + 0.075), vH() * BY],
          [vW() * (BX[2] - 0.075), vH() * BY],
        ]}
        end={0}
      />
      <Line
        ref={arrow34}
        stroke={COLORS.rose}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * (BX[2] + 0.075), vH() * BY],
          [vW() * (BX[3] - 0.075), vH() * BY],
        ]}
        end={0}
      />

      {/* ══ DATA FLOW LABELS (below arrows) ══ */}
      <Txt
        ref={dataLabel12}
        text="flux vidéo + état"
        fill={COLORS.ghost}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * ((BX[0] + BX[1]) / 2)}
        y={() => vH() * 0.115}
        opacity={0}
      />
      <Txt
        ref={dataLabel23}
        text="impulsions électriques"
        fill={COLORS.blue}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * ((BX[1] + BX[2]) / 2)}
        y={() => vH() * 0.115}
        opacity={0}
      />
      <Txt
        ref={dataLabel34}
        text="spikes"
        fill={COLORS.rose}
        fontSize={() => vW() * 0.013}
        fontFamily={'DM Mono, monospace'}
        fontWeight={600}
        x={() => vW() * ((BX[2] + BX[3]) / 2)}
        y={() => vH() * 0.115}
        opacity={0}
      />

      {/* ══ FEEDBACK LOOP (boucle fermée) ══ */}
      <Line
        ref={feedbackLine}
        stroke={COLORS.vert}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * (BX[3] + 0.075), vH() * BY],
          [vW() * (BX[3] + 0.075), vH() * 0.28],
          [vW() * (BX[0] - 0.075), vH() * 0.28],
          [vW() * (BX[0] - 0.075), vH() * BY],
        ]}
        end={0}
      />
      <Txt
        ref={feedbackLabel}
        text="actions → boucle fermée → retour au jeu"
        fill={COLORS.vert}
        fontSize={() => vW() * 0.014}
        fontWeight={600}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.345}
        opacity={0}
      />

      {/* ══ BYPASS ARROW (court-circuit, chemin rouge en tirets) ══ */}
      {/* Part of the decoder risk section - appears ABOVE blocks 2-4 */}
      <Line
        ref={bypassArrow}
        stroke={COLORS.danger}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        lineDash={[14, 7]}
        points={() => [
          [vW() * (BX[1] + 0.07),  vH() * (BY - 0.115)],
          [vW() * (BX[1] + 0.07),  vH() * -0.27],
          [vW() * (BX[3] - 0.07),  vH() * -0.27],
          [vW() * (BX[3] - 0.07),  vH() * (BY - 0.115)],
        ]}
        end={0}
      />

      {/* ══ WARNING BOX ══ */}
      <Rect
        ref={warningBox}
        x={() => vW() * 0.125}
        y={() => vH() * -0.38}
        width={() => vW() * 0.36}
        height={() => vH() * 0.1}
        fill={`${COLORS.danger}15`}
        stroke={COLORS.danger}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="⚠ RISQUE DOCUMENTÉ" fill={COLORS.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="le décodeur peut apprendre à ignorer les neurones" fill={COLORS.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.85} />
      </Rect>

      {/* ══ ABLATION SECTION ══ */}
      <Txt
        ref={ablationTitle}
        text="TEST D'ABLATION"
        fill={COLORS.jaune}
        fontSize={() => vW() * 0.038}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.42}
        opacity={0}
      />
      <Txt
        ref={ablationSub}
        text="on remplace les spikes par des valeurs aléatoires ou zéro…"
        fill={COLORS.ghost}
        fontSize={() => vW() * 0.018}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.345}
        opacity={0}
      />
      <Txt
        ref={ablationResult}
        text="les performances s'effondrent · le décodeur seul ne fait rien de cohérent"
        fill={COLORS.vert}
        fontSize={() => vW() * 0.018}
        fontWeight={600}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.36}
        opacity={0}
      />

      {/* ══ PERFORMANCE BAR (ablation phase) ══ */}
      <Txt
        ref={perfBarLabel}
        text="PERFORMANCE DÉCODEUR"
        fill={COLORS.ghost}
        fontSize={() => vW() * 0.013}
        fontWeight={600}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.175}
        opacity={0}
      />
      {/* Container (outline) */}
      <Rect
        ref={perfContainer}
        x={0}
        y={() => vH() * 0.215}
        width={() => vW() * 0.44}
        height={() => vH() * 0.044}
        fill={'#00000000'}
        stroke={COLORS.ghost}
        lineWidth={2}
        radius={() => vW() * 0.003}
        opacity={0}
      />
      {/* Fill bar - left-anchored via signal */}
      <Rect
        ref={perfFill}
        x={() => vW() * (-0.22 + 0.22 * perfLevel())}
        y={() => vH() * 0.215}
        width={() => vW() * 0.44 * perfLevel()}
        height={() => vH() * 0.038}
        fill={COLORS.vert}
        radius={() => vW() * 0.002}
        opacity={0}
      />
      {/* Percentage value label */}
      <Txt
        ref={perfValueRef}
        text="~100%"
        fill={COLORS.vert}
        fontSize={() => vW() * 0.016}
        fontWeight={700}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.255}
        y={() => vH() * 0.215}
        opacity={0}
      />

      {/* CL1 highlight ring (ablation phase) */}
      <Rect
        ref={cl1Highlight}
        x={() => vW() * BX[2]}
        y={() => vH() * BY}
        width={() => vW() * 0.155}
        height={() => vH() * 0.235}
        fill={'#00000000'}
        stroke={COLORS.rose}
        lineWidth={4}
        radius={() => vW() * 0.009}
        opacity={0}
        shadowColor={COLORS.rose}
        shadowBlur={() => vW() * 0.025}
      />
    </Layout>,
  );

  // ═══════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════

  // ─── Intro ───
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.12, 0.8);
  yield* all(
    titleRef().opacity(1, 0.6),
    subtitleRef().opacity(1, 0.5),
  );
  yield* waitFor(0.8);

  // ─── BLOC 1 : Le jeu ───
  yield* waitUntil('block1');
  yield* block1().opacity(1, 0.5);
  yield* waitFor(0.6);

  // ─── BLOC 2 : L'encodeur ───
  yield* waitUntil('block2');
  yield* arrow12().opacity(1, 0.1);
  yield* arrow12().end(1, 0.4, easeOutCubic);
  yield* block2().opacity(1, 0.4);
  yield* waitFor(0.6);

  // ─── BLOC 3 : La CL1 - mise en avant ───
  yield* waitUntil('block3');
  yield* arrow23().opacity(1, 0.1);
  yield* arrow23().end(1, 0.4, easeOutCubic);
  yield* block3().opacity(1, 0.5);
  // Glow pulse to draw attention to the CL1
  yield* chain(
    cl1Glow(2.0, 0.25, easeOutCubic),
    cl1Glow(0.5, 0.45, easeInOutCubic),
  );
  yield* waitFor(0.6);

  // ─── BLOC 4 : Le décodeur ───
  yield* waitUntil('block4');
  yield* arrow34().opacity(1, 0.1);
  yield* arrow34().end(1, 0.4, easeOutCubic);
  yield* block4().opacity(1, 0.4);
  yield* waitFor(0.6);

  // ─── Boucle fermée ───
  yield* waitUntil('feedbackLoop');
  yield* feedbackLine().opacity(1, 0.1);
  yield* feedbackLine().end(1, 0.9, easeInOutCubic);
  yield* feedbackLabel().opacity(1, 0.4);
  yield* waitFor(0.6);

  // ─── Labels de données ───
  yield* waitUntil('dataLabels');
  yield* sequence(0.15,
    dataLabel12().opacity(1, 0.4),
    dataLabel23().opacity(1, 0.4),
    dataLabel34().opacity(1, 0.4),
  );
  yield* waitFor(1.5);

  // ─── RISQUE : court-circuit du décodeur ───
  yield* waitUntil('courtCircuit');

  // Fade out header and data labels
  yield* all(
    titleRef().opacity(0, 0.3),
    subtitleRef().opacity(0, 0.3),
    dataLabel12().opacity(0, 0.3),
    dataLabel23().opacity(0, 0.3),
    dataLabel34().opacity(0, 0.3),
    feedbackLabel().opacity(0, 0.3),
  );

  // Bypass arrow draws across blocks 2→4 (skipping CL1)
  yield* bypassArrow().opacity(1, 0.1);
  yield* bypassArrow().end(1, 0.7, easeOutCubic);
  // Warning box
  yield* warningBox().opacity(1, 0.5);
  yield* waitFor(2.5);

  // ─── TEST D'ABLATION ───
  yield* waitUntil('ablation');

  yield* all(
    bypassArrow().opacity(0, 0.3),
    warningBox().opacity(0, 0.3),
    feedbackLine().opacity(0, 0.3),
    arrow12().opacity(0.25, 0.4),
    arrow23().opacity(0.25, 0.4),
    arrow34().opacity(0.25, 0.4),
  );

  yield* all(
    ablationTitle().opacity(1, 0.5),
    ablationSub().opacity(1, 0.4),
  );
  yield* waitFor(0.5);

  // Dim blocks 1, 2, 4 - spotlight CL1
  yield* all(
    block1().opacity(0.2, 0.5),
    block2().opacity(0.2, 0.5),
    block4().opacity(0.2, 0.5),
    cl1Glow(1.5, 0.5),
    cl1Highlight().opacity(1, 0.5),
  );

  yield* waitFor(0.8);

  // CL1 drain + textes internes swap en parallèle
  yield* all(
    block3().stroke(COLORS.ghost, 0.45),
    cl1Highlight().stroke(COLORS.danger, 0.4),
    cl1Highlight().shadowColor(COLORS.danger, 0.4),
    cl1Glow(0, 0.45),
    all(
      cl1TitleRef().opacity(0, 0.2),
      cl1Sub1Ref().opacity(0, 0.2),
      cl1Sub2Ref().opacity(0, 0.2),
    ),
  );
  // Swap textes + couleurs (instantané, bloc déjà "éteint")
  cl1TitleRef().text('???');
  cl1TitleRef().fill(COLORS.ghost);
  cl1Sub1Ref().text('bruit aléatoire');
  cl1Sub1Ref().fill(COLORS.danger);
  cl1Sub2Ref().text('signal = 0');
  cl1Sub2Ref().fill(COLORS.ghost);
  yield* all(
    cl1TitleRef().opacity(1, 0.3),
    cl1Sub1Ref().opacity(0.9, 0.3),
    cl1Sub2Ref().opacity(0.6, 0.3),
  );

  yield* waitFor(0.5);

  // Barre de performance - apparaît à 100%
  yield* all(
    perfBarLabel().opacity(1, 0.4),
    perfContainer().opacity(1, 0.4),
    perfFill().opacity(1, 0.4),
    perfValueRef().opacity(1, 0.4),
  );
  yield* waitFor(0.6);

  // Effondrement - barre s'écrase vers zéro
  yield* all(
    perfLevel(0.05, 0.9, easeInOutCubic),
    perfFill().fill(COLORS.danger, 0.9),
    perfValueRef().fill(COLORS.danger, 0.9),
  );
  yield* perfValueRef().text('~5%', 0);

  yield* waitFor(0.5);

  // Résultat final
  yield* ablationResult().opacity(1, 0.6);
  yield* waitFor(2.5);

  // ─── End ───
  yield* waitUntil('endScene');
  yield* all(
    block1().opacity(0, 0.5),
    block2().opacity(0, 0.5),
    block3().opacity(0, 0.5),
    block4().opacity(0, 0.5),
    arrow12().opacity(0, 0.5),
    arrow23().opacity(0, 0.5),
    arrow34().opacity(0, 0.5),
    cl1Highlight().opacity(0, 0.5),
    ablationTitle().opacity(0, 0.5),
    ablationSub().opacity(0, 0.5),
    ablationResult().opacity(0, 0.5),
    perfBarLabel().opacity(0, 0.5),
    perfContainer().opacity(0, 0.5),
    perfFill().opacity(0, 0.5),
    perfValueRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
