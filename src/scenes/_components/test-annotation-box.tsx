import {makeScene2D, Rect, Txt, Layout, Grid} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil, easeInOutCubic} from '@motion-canvas/core';
import {AnnotationBox, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ──────────────────────────────────────────────────────────────
  const gridRef  = createRef<Grid>();
  const titleRef = createRef<Txt>();

  // Cible (élément annoté)
  const targetBoxRef   = createRef<Rect>();
  const targetLabelRef = createRef<Txt>();

  // Annotations
  const annotationOneRef   = createRef<AnnotationBox>();
  const annotationTwoRef   = createRef<AnnotationBox>();
  const annotationThreeRef = createRef<AnnotationBox>();

  // Flèches
  const arrowOneRef   = createRef<ConnectionArrow>();
  const arrowTwoRef   = createRef<ConnectionArrow>();
  const arrowThreeRef = createRef<ConnectionArrow>();

  // ── Scene tree ────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>

      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      <Grid key="grid" ref={gridRef} width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05} stroke={PALETTE.ghost} lineWidth={1} opacity={0} />

      <Txt key="title" ref={titleRef}
        text="AnnotationBox" fill={PALETTE.cream}
        fontSize={() => vW() * 0.035} fontFamily={'Space Grotesk, sans-serif'} fontWeight={700}
        y={() => vH() * -0.4} opacity={0} />

      {/* ── Élément cible central ── */}
      <Rect key="target" ref={targetBoxRef}
        width={() => vW() * 0.22} height={() => vH() * 0.2}
        fill={PALETTE.bgCard} stroke={PALETTE.ghost} lineWidth={2} radius={8}
        x={() => vW() * 0.0} y={() => vH() * 0.05}
        layout alignItems={'center'} justifyContent={'center'}
        opacity={0}>
        <Txt key="target-label" ref={targetLabelRef}
          text="payload.pth" fill={PALETTE.cream}
          fontSize={() => vW() * 0.018} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ── Annotation 1 — Double encodage (rose, gauche-haut) ── */}
      <AnnotationBox key="ann-1" ref={annotationOneRef}
        title="Double Base64"
        lines={['encode → encode', 'contourne les WAF']}
        color={PALETTE.rose}
        width={() => vW() * 0.22} height={() => vH() * 0.17}
        x={() => vW() * -0.32} y={() => vH() * -0.12}
        opacity={0} />

      <ConnectionArrow key="arrow-1" ref={arrowOneRef}
        from={() => [vW() * -0.21, vH() * -0.06]}
        to={() =>   [vW() * -0.11, vH() *  0.01]}
        stroke={PALETTE.rose} dashed end={0} opacity={0} />

      {/* ── Annotation 2 — Exec auto (jaune, droite-haut) ── */}
      <AnnotationBox key="ann-2" ref={annotationTwoRef}
        title="exec() auto"
        lines={['lancé au démarrage', 'via import hook']}
        color={PALETTE.jaune}
        width={() => vW() * 0.22} height={() => vH() * 0.17}
        x={() => vW() * 0.32} y={() => vH() * -0.12}
        opacity={0} />

      <ConnectionArrow key="arrow-2" ref={arrowTwoRef}
        from={() => [vW() * 0.21, vH() * -0.06]}
        to={() =>   [vW() * 0.11, vH() *  0.01]}
        stroke={PALETTE.jaune} dashed end={0} opacity={0} />

      {/* ── Annotation 3 — Persistance (vert, bas) ── */}
      <AnnotationBox key="ann-3" ref={annotationThreeRef}
        title="Persistance"
        lines={['survive au redémarrage', 'invisible dans pip list']}
        color={PALETTE.vert}
        width={() => vW() * 0.22} height={() => vH() * 0.17}
        x={() => vW() * 0.0} y={() => vH() * 0.35}
        opacity={0} />

      <ConnectionArrow key="arrow-3" ref={arrowThreeRef}
        from={() => [vW() * 0.0, vH() * 0.15]}
        to={() =>   [vW() * 0.0, vH() * 0.27]}
        stroke={PALETTE.vert} end={0} opacity={0} />

    </Layout>
  );

  // ── Animation ─────────────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    titleRef().opacity(1, 0.5),
  );

  // Cible
  yield* waitUntil('showTarget');
  yield* targetBoxRef().opacity(1, 0.45);

  // Annotation 1 + flèche
  yield* waitUntil('ann1');
  yield* annotationOneRef().opacity(1, 0.4);
  arrowOneRef().opacity(1);
  yield* arrowOneRef().end(1, 0.45, easeInOutCubic);

  // Annotation 2 + flèche
  yield* waitUntil('ann2');
  yield* annotationTwoRef().opacity(1, 0.4);
  arrowTwoRef().opacity(1);
  yield* arrowTwoRef().end(1, 0.45, easeInOutCubic);

  // Annotation 3 + flèche
  yield* waitUntil('ann3');
  yield* annotationThreeRef().opacity(1, 0.4);
  arrowThreeRef().opacity(1);
  yield* arrowThreeRef().end(1, 0.45, easeInOutCubic);

  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.4),
    targetBoxRef().opacity(0, 0.4),
    annotationOneRef().opacity(0, 0.4),
    annotationTwoRef().opacity(0, 0.4),
    annotationThreeRef().opacity(0, 0.4),
    arrowOneRef().opacity(0, 0.4),
    arrowTwoRef().opacity(0, 0.4),
    arrowThreeRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
