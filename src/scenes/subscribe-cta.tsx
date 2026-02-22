import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, easeInOutCubic, easeOutCubic, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:        '#0D1117',
    grid:      '#21262D',
    cream:     '#F9F9F6',
    ghostText: '#484F58',
    card:      '#1C2128',
    rose:      '#FF3E6C',
    vert:      '#6DFF8A',
    jaune:     '#FFE14D',
  };

  // ─── Refs ────────────────────────────────────────────────────────────────
  const bgRef       = createRef<Rect>();
  const gridRef     = createRef<Grid>();
  const headerRef   = createRef<Txt>();
  const likeCard    = createRef<Rect>();
  const commentCard = createRef<Rect>();
  const subCard     = createRef<Rect>();
  const brandMark   = createRef<Layout>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCÈNE
  // ═══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout>
      <Rect ref={bgRef} width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} opacity={0} />
      <Grid
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        stroke={COLORS.grid}
        lineWidth={1}
        spacing={() => vW() * 0.031}
        opacity={0}
        zIndex={-1}
      />

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <Txt
        ref={headerRef}
        text="si t'as apprécié cette vidéo :"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.013}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.27}
        opacity={0}
      />

      {/* ══════════════════════════════════════════════════════════════════
          Trois cartes CTA — scale=0 au départ → bounce-in séquentiel
          y = vH()*0.02    x : -0.295 · 0 · +0.295
          w = vW()*0.24    h = vH()*0.38
      ═══════════════════════════════════════════════════════════════════ */}

      {/* ─── LIKE ────────────────────────────────────────────────────────── */}
      <Rect
        ref={likeCard}
        x={() => vW() * -0.295}
        y={() => vH() * 0.02}
        width={() => vW() * 0.24}
        height={() => vH() * 0.38}
        fill={COLORS.card}
        stroke={COLORS.rose}
        lineWidth={2}
        radius={() => vW() * 0.008}
        shadowColor={COLORS.rose}
        shadowBlur={() => vW() * 0.014}
        scale={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.022}
      >
        <Txt text="▲" fill={COLORS.rose} fontSize={() => vW() * 0.048}
          fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="LIKE" fill={COLORS.rose} fontSize={() => vW() * 0.028}
          fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="si t'as aimé" fill={COLORS.ghostText} fontSize={() => vW() * 0.010}
          fontFamily={'DM Sans, Space Grotesk'} />
      </Rect>

      {/* ─── COMMENTE ────────────────────────────────────────────────────── */}
      <Rect
        ref={commentCard}
        x={0}
        y={() => vH() * 0.02}
        width={() => vW() * 0.24}
        height={() => vH() * 0.38}
        fill={COLORS.card}
        stroke={COLORS.vert}
        lineWidth={2}
        radius={() => vW() * 0.008}
        shadowColor={COLORS.vert}
        shadowBlur={() => vW() * 0.014}
        scale={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.022}
      >
        <Txt text="◆" fill={COLORS.vert} fontSize={() => vW() * 0.048}
          fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="COMMENTE" fill={COLORS.vert} fontSize={() => vW() * 0.022}
          fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="laisse ton avis" fill={COLORS.ghostText} fontSize={() => vW() * 0.010}
          fontFamily={'DM Sans, Space Grotesk'} />
      </Rect>

      {/* ─── ABONNE-TOI ──────────────────────────────────────────────────── */}
      <Rect
        ref={subCard}
        x={() => vW() * 0.295}
        y={() => vH() * 0.02}
        width={() => vW() * 0.24}
        height={() => vH() * 0.38}
        fill={COLORS.card}
        stroke={COLORS.jaune}
        lineWidth={2}
        radius={() => vW() * 0.008}
        shadowColor={COLORS.jaune}
        shadowBlur={() => vW() * 0.014}
        scale={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.022}
      >
        <Txt text="★" fill={COLORS.jaune} fontSize={() => vW() * 0.048}
          fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="ABONNE-TOI" fill={COLORS.jaune} fontSize={() => vW() * 0.020}
          fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="pour la suite" fill={COLORS.ghostText} fontSize={() => vW() * 0.010}
          fontFamily={'DM Sans, Space Grotesk'} />
      </Rect>

      {/* ─── Brand mark ──────────────────────────────────────────────────── */}
      <Layout
        ref={brandMark}
        direction={'row'}
        gap={() => vW() * 0.008}
        alignItems={'center'}
        y={() => vH() * 0.305}
        opacity={0}
      >
        <Txt text="🍉" fontSize={() => vW() * 0.018} fontFamily={'Space Grotesk'} />
        <Txt
          text="passe-tech"
          fill={COLORS.ghostText}
          fontSize={() => vW() * 0.014}
          fontWeight={700}
          fontFamily={'Space Grotesk'}
        />
      </Layout>
    </Layout>,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  yield* waitUntil('introCTA');

  // Fond + grille
  yield* all(
    bgRef().opacity(1, 0.35),
    gridRef().opacity(0.30, 0.60),
  );

  // Header
  yield* headerRef().opacity(1, 0.40);

  yield* waitFor(0.2);

  // ─── Bounce-in séquentiel ─────────────────────────────────────────────────

  // LIKE
  yield* likeCard().scale(1.12, 0.22, easeOutCubic);
  yield* likeCard().scale(1.0, 0.13, easeInOutCubic);

  // COMMENTE
  yield* commentCard().scale(1.12, 0.22, easeOutCubic);
  yield* commentCard().scale(1.0, 0.13, easeInOutCubic);

  // ABONNE-TOI
  yield* subCard().scale(1.12, 0.22, easeOutCubic);
  yield* subCard().scale(1.0, 0.13, easeInOutCubic);

  // Brand mark
  yield* brandMark().opacity(1, 0.45);

  // ─── Pulse global — les 3 cartes ensemble ────────────────────────────────
  yield* waitFor(0.8);

  yield* all(
    likeCard().scale(1.05, 0.20, easeOutCubic),
    commentCard().scale(1.05, 0.20, easeOutCubic),
    subCard().scale(1.05, 0.20, easeOutCubic),
  );
  yield* all(
    likeCard().scale(1.0, 0.18, easeInOutCubic),
    commentCard().scale(1.0, 0.18, easeInOutCubic),
    subCard().scale(1.0, 0.18, easeInOutCubic),
  );

  yield* waitFor(2.0);

  // ─── Fin ──────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    bgRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
    headerRef().opacity(0, 0.5),
    likeCard().opacity(0, 0.5),
    commentCard().opacity(0, 0.5),
    subCard().opacity(0, 0.5),
    brandMark().opacity(0, 0.5),
  );
});
