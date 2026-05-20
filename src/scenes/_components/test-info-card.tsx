import {makeScene2D, Rect, Txt, Layout, Grid} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil, easeInOutCubic} from '@motion-canvas/core';
import {InfoCard} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ──────────────────────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();

  const memCardRef    = createRef<InfoCard>();
  const cpuCardRef    = createRef<InfoCard>();
  const netCardRef    = createRef<InfoCard>();

  // Barres de progression à l'intérieur des cartes
  const memBarRef     = createRef<Rect>();
  const cpuBarRef     = createRef<Rect>();

  // ── Scene tree ────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>

      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      <Grid key="grid" ref={gridRef} width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05} stroke={PALETTE.ghost} lineWidth={1} opacity={0} />

      <Txt key="title" ref={titleRef}
        text="InfoCard" fill={PALETTE.cream}
        fontSize={() => vW() * 0.035} fontFamily={'Space Grotesk, sans-serif'} fontWeight={700}
        y={() => vH() * -0.4} opacity={0} />

      {/* ── Carte MEMORY (blue) — avec barre de progression ── */}
      <InfoCard key="card-mem" ref={memCardRef}
        title="MEMORY" subtitle="Mémoire RAM"
        color={PALETTE.blue}
        width={() => vW() * 0.24} height={() => vH() * 0.42}
        x={() => vW() * -0.29} opacity={0}>

        {/* Barre de remplissage */}
        <Rect key="mem-bar-track" width={'100%'} height={() => vH() * 0.03}
          fill={'#00000000'} stroke={PALETTE.ghost} lineWidth={1} radius={4}
          layout alignItems={'center'} justifyContent={'start'}>
          <Rect key="mem-bar-fill" ref={memBarRef}
            width={0} height={'100%'}
            fill={PALETTE.blue} radius={4} />
        </Rect>

        <Txt key="mem-label"
          text="180 / 256 MB" fill={PALETTE.cream}
          fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'}
          marginTop={() => vH() * 0.01} />

        <Txt key="mem-limit"
          text="limite : 256 MB" fill={PALETTE.ghost}
          fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
      </InfoCard>

      {/* ── Carte CPU (rose) — avec barre + valeur ── */}
      <InfoCard key="card-cpu" ref={cpuCardRef}
        title="CPU" subtitle="Quota de cycles"
        color={PALETTE.rose}
        width={() => vW() * 0.24} height={() => vH() * 0.42}
        x={() => vW() * 0.0} opacity={0}>

        <Rect key="cpu-bar-track" width={'100%'} height={() => vH() * 0.03}
          fill={'#00000000'} stroke={PALETTE.ghost} lineWidth={1} radius={4}
          layout alignItems={'center'} justifyContent={'start'}>
          <Rect key="cpu-bar-fill" ref={cpuBarRef}
            width={0} height={'100%'}
            fill={PALETTE.rose} radius={4} />
        </Rect>

        <Txt key="cpu-label"
          text="0.5 / 2.0 vCPU" fill={PALETTE.cream}
          fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'}
          marginTop={() => vH() * 0.01} />

        <Txt key="cpu-limit"
          text="throttle au-delà" fill={PALETTE.ghost}
          fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
      </InfoCard>

      {/* ── Carte NETWORK (vert) — children texte ── */}
      <InfoCard key="card-net" ref={netCardRef}
        title="NETWORK" subtitle="Namespace réseau"
        color={PALETTE.vert}
        width={() => vW() * 0.24} height={() => vH() * 0.42}
        x={() => vW() * 0.29} opacity={0}>

        <Txt key="net-iface"
          text="eth0" fill={PALETTE.vert}
          fontSize={() => vW() * 0.022} fontFamily={'DM Mono, monospace'} fontWeight={700} />

        <Txt key="net-ip"
          text="172.17.0.4/16" fill={PALETTE.cream}
          fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'}
          marginTop={() => vH() * 0.01} />

        <Txt key="net-isolated"
          text="isolé du host" fill={PALETTE.ghost}
          fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
      </InfoCard>

    </Layout>
  );

  // ── Animation ─────────────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    titleRef().opacity(1, 0.5),
  );

  // Cartes apparaissent en séquence
  yield* waitUntil('showCards');
  yield* sequence(0.15,
    memCardRef().opacity(1, 0.45),
    cpuCardRef().opacity(1, 0.45),
    netCardRef().opacity(1, 0.45),
  );

  // Barres se remplissent
  yield* waitUntil('fillBars');
  yield* all(
    memBarRef().width('70%', 0.9, easeInOutCubic),
    cpuBarRef().width('25%', 0.9, easeInOutCubic),
  );

  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.4),
    memCardRef().opacity(0, 0.4),
    cpuCardRef().opacity(0, 0.4),
    netCardRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
