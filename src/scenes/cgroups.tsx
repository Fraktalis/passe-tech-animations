import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, easeInOutCubic, easeOutCubic, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:            '#0D1117',
    grid:          '#21262D',
    cream:         '#F9F9F6',
    ghostText:     '#484F58',
    processBg:     '#1C2128',
    processBorder: '#30363D',
    // Cgroup colors
    mem:   '#EF4444',   // rouge  — danger, OOM
    cpu:   '#F59E0B',   // ambre  — throttle
    blkio: '#3B82F6',   // bleu   — I/O
    // Conclusion
    conc:  '#6DFF8A',   // vert Passe-Tech
  };

  // ─── Refs ────────────────────────────────────────────────────────────────
  const gridRef       = createRef<Grid>();
  const titleRef      = createRef<Txt>();
  const subtitleRef   = createRef<Txt>();

  // Cards
  const memCard       = createRef<Rect>();
  const cpuCard       = createRef<Rect>();
  const blkioCard     = createRef<Rect>();

  // Memory
  const memBarFill    = createRef<Rect>();
  const memBarLabel   = createRef<Txt>();
  const oomBadge      = createRef<Rect>();

  // CPU
  const cpuBarFill    = createRef<Rect>();
  const throttleBadge = createRef<Rect>();

  // Blkio queue
  const blkioQ1       = createRef<Rect>();
  const blkioQ2       = createRef<Rect>();
  const blkioQ3       = createRef<Rect>();
  const blkioArrow    = createRef<Txt>();

  // Conclusion
  const concContainer = createRef<Layout>();
  const concResult    = createRef<Rect>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCÈNE
  // ═══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout>
      {/* Fond */}
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
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

      {/* ─── Titre ───────────────────────────────────────────────────────── */}
      <Txt
        ref={titleRef}
        text="LES CGROUPS LINUX"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.030}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.43}
        opacity={0}
      />
      <Txt
        ref={subtitleRef}
        text="contrôler les ressources d'un processus"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.013}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.375}
        opacity={0}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          Trois cartes : MEMORY · CPU · BLKIO
          y = vH()*0.02    x : -0.325 · 0 · +0.325
          w = vW()*0.27    h = vH()*0.40
      ════════════════════════════════════════════════════════════════════ */}

      {/* ─── MEMORY ──────────────────────────────────────────────────────── */}
      <Rect
        ref={memCard}
        x={() => vW() * -0.325}
        y={() => vH() * 0.02}
        width={() => vW() * 0.27}
        height={() => vH() * 0.40}
        fill={COLORS.processBg}
        stroke={COLORS.mem}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        {/* Header */}
        <Rect width={'100%'} height={() => vH() * 0.052} fill={COLORS.mem + '22'}
          layout direction={'row'} alignItems={'center'}
          padding={() => vW() * 0.012} gap={() => vW() * 0.007}>
          <Txt text="MEMORY" fill={COLORS.mem} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Mémoire RAM" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>

        {/* Body */}
        <Rect grow={1} width={'100%'} layout direction={'column'} gap={() => vH() * 0.016}
          padding={() => vW() * 0.014} alignItems={'flex-start'} justifyContent={'center'}>

          <Txt text="Limite : 256 MB" fill={COLORS.cream}
            fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />

          {/* Barre de remplissage */}
          <Rect width={() => vW() * 0.22} height={() => vH() * 0.018}
            fill={COLORS.processBorder} radius={() => vW() * 0.003} clip
            layout direction={'row'}>
            <Rect ref={memBarFill} width={0} height={'100%'} fill={COLORS.mem + 'BB'} />
          </Rect>

          <Txt ref={memBarLabel} text="0 / 256 MB"
            fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />

          {/* Badge OOM Killer */}
          <Rect ref={oomBadge} opacity={0}
            fill={COLORS.mem + '15'} stroke={COLORS.mem} lineWidth={1}
            radius={() => vW() * 0.004} padding={() => vW() * 0.010}
            layout direction={'column'} gap={() => vH() * 0.007}>
            <Txt text="☠  OOM KILLER" fill={COLORS.mem}
              fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'Space Grotesk'} />
            <Txt text="SIGKILL → processus éliminé" fill={COLORS.ghostText}
              fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
          </Rect>
        </Rect>
      </Rect>

      {/* ─── CPU ─────────────────────────────────────────────────────────── */}
      <Rect
        ref={cpuCard}
        x={0}
        y={() => vH() * 0.02}
        width={() => vW() * 0.27}
        height={() => vH() * 0.40}
        fill={COLORS.processBg}
        stroke={COLORS.cpu}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        {/* Header */}
        <Rect width={'100%'} height={() => vH() * 0.052} fill={COLORS.cpu + '22'}
          layout direction={'row'} alignItems={'center'}
          padding={() => vW() * 0.012} gap={() => vW() * 0.007}>
          <Txt text="CPU" fill={COLORS.cpu} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Processeur" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>

        {/* Body */}
        <Rect grow={1} width={'100%'} layout direction={'column'} gap={() => vH() * 0.016}
          padding={() => vW() * 0.014} alignItems={'flex-start'} justifyContent={'center'}>

          <Txt text="Quota : 25% d'un cœur" fill={COLORS.cream}
            fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />

          {/* Barre CPU */}
          <Rect width={() => vW() * 0.22} height={() => vH() * 0.018}
            fill={COLORS.processBorder} radius={() => vW() * 0.003} clip
            layout direction={'row'}>
            <Rect ref={cpuBarFill} width={0} height={'100%'} fill={COLORS.cpu + 'BB'} />
          </Rect>

          <Txt text="25% quota · priorité 512" fill={COLORS.ghostText}
            fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />

          {/* Badge Throttle */}
          <Rect ref={throttleBadge} opacity={0}
            fill={COLORS.cpu + '15'} stroke={COLORS.cpu} lineWidth={1}
            radius={() => vW() * 0.004} padding={() => vW() * 0.010}
            layout direction={'column'} gap={() => vH() * 0.007}>
            <Txt text="⏸  THROTTLED" fill={COLORS.cpu}
              fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'Space Grotesk'} />
            <Txt text="Processus gelé — attend la prochaine période" fill={COLORS.ghostText}
              fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
          </Rect>
        </Rect>
      </Rect>

      {/* ─── BLKIO ───────────────────────────────────────────────────────── */}
      <Rect
        ref={blkioCard}
        x={() => vW() * 0.325}
        y={() => vH() * 0.02}
        width={() => vW() * 0.27}
        height={() => vH() * 0.40}
        fill={COLORS.processBg}
        stroke={COLORS.blkio}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        {/* Header */}
        <Rect width={'100%'} height={() => vH() * 0.052} fill={COLORS.blkio + '22'}
          layout direction={'row'} alignItems={'center'}
          padding={() => vW() * 0.012} gap={() => vW() * 0.007}>
          <Txt text="BLKIO" fill={COLORS.blkio} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Disque · Block I/O" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>

        {/* Body */}
        <Rect grow={1} width={'100%'} layout direction={'column'} gap={() => vH() * 0.016}
          padding={() => vW() * 0.014} alignItems={'flex-start'} justifyContent={'center'}>

          <Txt text="Débit max : 10 MB/s" fill={COLORS.cream}
            fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt text="Écritures excédentaires → file d'attente" fill={COLORS.ghostText}
            fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} />

          {/* Visualisation de la file d'attente */}
          <Layout direction={'row'} gap={() => vW() * 0.008} alignItems={'center'}>
            <Rect ref={blkioQ1} width={() => vW() * 0.042} height={() => vH() * 0.038}
              fill={COLORS.blkio + '28'} stroke={COLORS.blkio} lineWidth={1}
              radius={() => vW() * 0.003} opacity={0} layout
              alignItems={'center'} justifyContent={'center'}>
              <Txt text="req" fill={COLORS.blkio} fontSize={() => vW() * 0.007} fontFamily={'DM Mono, monospace'} />
            </Rect>
            <Rect ref={blkioQ2} width={() => vW() * 0.042} height={() => vH() * 0.038}
              fill={COLORS.blkio + '28'} stroke={COLORS.blkio} lineWidth={1}
              radius={() => vW() * 0.003} opacity={0} layout
              alignItems={'center'} justifyContent={'center'}>
              <Txt text="req" fill={COLORS.blkio} fontSize={() => vW() * 0.007} fontFamily={'DM Mono, monospace'} />
            </Rect>
            <Rect ref={blkioQ3} width={() => vW() * 0.042} height={() => vH() * 0.038}
              fill={COLORS.blkio + '28'} stroke={COLORS.blkio} lineWidth={1}
              radius={() => vW() * 0.003} opacity={0} layout
              alignItems={'center'} justifyContent={'center'}>
              <Txt text="req" fill={COLORS.blkio} fontSize={() => vW() * 0.007} fontFamily={'DM Mono, monospace'} />
            </Rect>
            <Txt ref={blkioArrow} text="→  [disk]"
              fill={COLORS.cream} fontSize={() => vW() * 0.009}
              fontFamily={'DM Mono, monospace'} opacity={0} />
          </Layout>

          <Txt text="10 MB/s · excédent mis en attente" fill={COLORS.blkio}
            fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} opacity={0.8} />
        </Rect>
      </Rect>

      {/* ─── Conclusion ──────────────────────────────────────────────────── */}
      <Layout
        ref={concContainer}
        direction={'row'}
        gap={() => vW() * 0.012}
        alignItems={'center'}
        y={() => vH() * 0.370}
        opacity={0}
      >
        <Rect fill={'#21262D'} stroke={COLORS.ghostText} lineWidth={1}
          radius={() => vW() * 0.005} padding={() => vW() * 0.012} layout>
          <Txt text="chroot" fill={COLORS.cream} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'DM Mono, monospace'} />
        </Rect>
        <Txt text="+" fill={COLORS.ghostText} fontSize={() => vW() * 0.014} fontFamily={'Space Grotesk'} />
        <Rect fill={'#21262D'} stroke={'#58A6FF'} lineWidth={1}
          radius={() => vW() * 0.005} padding={() => vW() * 0.012} layout>
          <Txt text="namespaces" fill={'#58A6FF'} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'DM Mono, monospace'} />
        </Rect>
        <Txt text="+" fill={COLORS.ghostText} fontSize={() => vW() * 0.014} fontFamily={'Space Grotesk'} />
        <Rect fill={'#21262D'} stroke={COLORS.conc} lineWidth={1}
          radius={() => vW() * 0.005} padding={() => vW() * 0.012} layout>
          <Txt text="cgroups" fill={COLORS.conc} fontSize={() => vW() * 0.011} fontWeight={600} fontFamily={'DM Mono, monospace'} />
        </Rect>
        <Txt text="=" fill={COLORS.ghostText} fontSize={() => vW() * 0.014} fontFamily={'Space Grotesk'} />
        <Rect ref={concResult} opacity={0}
          fill={COLORS.conc + '18'} stroke={COLORS.conc} lineWidth={2}
          radius={() => vW() * 0.005} padding={() => vW() * 0.014} layout
          shadowColor={COLORS.conc} shadowBlur={() => vW() * 0.010}>
          <Txt text="CONTAINER" fill={COLORS.conc} fontSize={() => vW() * 0.013} fontWeight={800} fontFamily={'Space Grotesk'} />
        </Rect>
      </Layout>
    </Layout>,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Intro ────────────────────────────────────────────────────────────────
  yield* waitUntil('introCgroups');

  yield* all(
    gridRef().opacity(0.5, 0.8),
    titleRef().opacity(1, 0.6),
  );
  yield* subtitleRef().opacity(1, 0.5);

  // ─── MEMORY ───────────────────────────────────────────────────────────────
  yield* waitUntil('showMemory');

  yield* memCard().opacity(1, 0.5);
  yield* waitFor(0.3);

  // Barre monte à 70% (180 / 256 MB)
  yield* memBarFill().width(vW() * 0.154, 1.8, easeInOutCubic);
  memBarLabel().text('180 / 256 MB');

  yield* waitFor(0.4);

  // ─── OOM ──────────────────────────────────────────────────────────────────
  yield* waitUntil('showOOM');

  // Barre dépasse la limite
  yield* memBarFill().width(vW() * 0.22, 0.35, easeInOutCubic);
  memBarLabel().text('265 / 256 MB  ⚠');
  memBarLabel().fill(COLORS.mem);

  yield* oomBadge().opacity(1, 0.4);
  yield* memCard().scale(1.03, 0.15, easeOutCubic);
  yield* memCard().scale(1.0, 0.15, easeOutCubic);

  yield* waitFor(0.5);

  // ─── CPU ──────────────────────────────────────────────────────────────────
  yield* waitUntil('showCPU');

  yield* cpuCard().opacity(1, 0.5);
  yield* waitFor(0.3);

  // Barre à 25% du quota
  yield* cpuBarFill().width(vW() * 0.055, 1.2, easeInOutCubic);

  yield* waitFor(0.3);
  yield* throttleBadge().opacity(1, 0.4);

  yield* waitFor(0.5);

  // ─── BLKIO ────────────────────────────────────────────────────────────────
  yield* waitUntil('showBlkio');

  yield* blkioCard().opacity(1, 0.5);
  yield* waitFor(0.4);

  // Requêtes s'accumulent dans la file
  yield* blkioQ1().opacity(1, 0.25);
  yield* blkioQ2().opacity(1, 0.25);
  yield* blkioQ3().opacity(1, 0.25);
  yield* blkioArrow().opacity(1, 0.3);

  yield* waitFor(0.5);

  // ─── CONCLUSION ───────────────────────────────────────────────────────────
  yield* waitUntil('showConclusion');

  // chroot + namespaces + cgroups apparaissent ensemble
  yield* concContainer().opacity(1, 0.6);
  yield* waitFor(0.3);

  // CONTAINER s'allume avec un pulse
  yield* concResult().opacity(1, 0.5, easeOutCubic);
  yield* concResult().scale(1.06, 0.22, easeOutCubic);
  yield* concResult().scale(1.0, 0.22, easeOutCubic);

  yield* waitFor(1.5);

  // ─── Fin ──────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    titleRef().opacity(0, 0.5),
    subtitleRef().opacity(0, 0.5),
    memCard().opacity(0, 0.5),
    cpuCard().opacity(0, 0.5),
    blkioCard().opacity(0, 0.5),
    concContainer().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
