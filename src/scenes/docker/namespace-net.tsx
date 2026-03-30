import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, easeOutCubic, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg: '#0D1117',
    grid: '#21262D',
    cream: '#F9F9F6',
    ghostText: '#484F58',
    processBg: '#1C2128',
    processBorder: '#30363D',
    // Couleur par namespace
    pid:   '#58A6FF',
    net:   '#0099FF',
    mount: '#F59E0B',
    user:  '#FF3E6C',   // rose Passe-Tech - le plus critique
    ipc:   '#A78BFA',
    uts:   '#06B6D4',
    // Intérieur du card USER
    rootGreen: '#3FB950',
  };

  // ─── Refs ────────────────────────────────────────────────────────────────
  const gridRef     = createRef<Grid>();
  const titleRef    = createRef<Txt>();
  const subtitleRef = createRef<Txt>();
  const captionRef  = createRef<Txt>();

  const pidCard   = createRef<Rect>();
  const netCard   = createRef<Rect>();
  const mountCard = createRef<Rect>();
  const userCard  = createRef<Rect>();
  const ipcCard   = createRef<Rect>();
  const utsCard   = createRef<Rect>();

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

      {/* ─── En-tête ─────────────────────────────────────────────────────── */}
      <Txt
        ref={titleRef}
        text="LES NAMESPACES LINUX"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.030}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.43}
        opacity={0}
      />
      <Txt
        ref={subtitleRef}
        text="isoler la vue du processus"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.013}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.375}
        opacity={0}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          Grille 3 × 2 - toutes cartes : w=vW()*0.27  h=vH()*0.24
          Ligne 1  y=vH()*-0.14   x : -0.325 · 0 · +0.325
          Ligne 2  y=vH()*0.165   x : -0.325 · 0 · +0.325
      ════════════════════════════════════════════════════════════════════ */}

      {/* ─── PID ─────────────────────────────────────────────────────────── */}
      <Rect
        ref={pidCard}
        x={() => vW() * -0.325}
        y={() => vH() * -0.14}
        width={() => vW() * 0.27}
        height={() => vH() * 0.24}
        fill={COLORS.processBg}
        stroke={COLORS.pid}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        <Rect
          width={'100%'}
          height={() => vH() * 0.052}
          fill={COLORS.pid + '22'}
          layout
          direction={'row'}
          alignItems={'center'}
          padding={() => vW() * 0.012}
          gap={() => vW() * 0.007}
        >
          <Txt text="PID" fill={COLORS.pid} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Process" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>
        <Rect
          grow={1}
          width={'100%'}
          layout
          direction={'column'}
          gap={() => vH() * 0.012}
          padding={() => vW() * 0.014}
          alignItems={'flex-start'}
          justifyContent={'center'}
        >
          <Txt text="Isolation des processus" fill={COLORS.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt text="PID 1 dans le namespace" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Sans, Space Grotesk'} />
          <Txt text="Arbre de processus indépendant" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Sans, Space Grotesk'} />
          <Txt text="PID 242  →  PID 1" fill={COLORS.pid} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} opacity={0.8} />
        </Rect>
      </Rect>

      {/* ─── NET ─────────────────────────────────────────────────────────── */}
      <Rect
        ref={netCard}
        x={0}
        y={() => vH() * -0.14}
        width={() => vW() * 0.27}
        height={() => vH() * 0.24}
        fill={COLORS.processBg}
        stroke={COLORS.net}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        <Rect
          width={'100%'}
          height={() => vH() * 0.052}
          fill={COLORS.net + '22'}
          layout
          direction={'row'}
          alignItems={'center'}
          padding={() => vW() * 0.012}
          gap={() => vW() * 0.007}
        >
          <Txt text="NET" fill={COLORS.net} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Network" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>
        <Rect
          grow={1}
          width={'100%'}
          layout
          direction={'column'}
          gap={() => vH() * 0.012}
          padding={() => vW() * 0.014}
          alignItems={'flex-start'}
          justifyContent={'center'}
        >
          <Txt text="Interfaces réseau" fill={COLORS.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt text="Tables de routage" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Sans, Space Grotesk'} />
          <Txt text="Règles de pare-feu" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Sans, Space Grotesk'} />
          <Txt text="eth0  •  lo  •  docker0" fill={COLORS.net} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} opacity={0.8} />
        </Rect>
      </Rect>

      {/* ─── MOUNT ───────────────────────────────────────────────────────── */}
      <Rect
        ref={mountCard}
        x={() => vW() * 0.325}
        y={() => vH() * -0.14}
        width={() => vW() * 0.27}
        height={() => vH() * 0.24}
        fill={COLORS.processBg}
        stroke={COLORS.mount}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        <Rect
          width={'100%'}
          height={() => vH() * 0.052}
          fill={COLORS.mount + '22'}
          layout
          direction={'row'}
          alignItems={'center'}
          padding={() => vW() * 0.012}
          gap={() => vW() * 0.007}
        >
          <Txt text="MOUNT" fill={COLORS.mount} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Filesystem" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>
        <Rect
          grow={1}
          width={'100%'}
          layout
          direction={'column'}
          gap={() => vH() * 0.012}
          padding={() => vW() * 0.014}
          alignItems={'flex-start'}
          justifyContent={'center'}
        >
          <Txt text="Arbre de montage isolé" fill={COLORS.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt text="Fichiers visibles indépendants" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Sans, Space Grotesk'} />
          <Txt text="  /  →  /proc  →  /sys" fill={COLORS.mount} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} opacity={0.8} />
        </Rect>
      </Rect>

      {/* ─── USER (le plus important - glow rose) ────────────────────────── */}
      <Rect
        ref={userCard}
        x={() => vW() * -0.325}
        y={() => vH() * 0.165}
        width={() => vW() * 0.27}
        height={() => vH() * 0.24}
        fill={COLORS.processBg}
        stroke={COLORS.user}
        lineWidth={2}
        radius={() => vW() * 0.007}
        shadowColor={COLORS.user}
        shadowBlur={() => vW() * 0.012}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        <Rect
          width={'100%'}
          height={() => vH() * 0.052}
          fill={COLORS.user + '22'}
          layout
          direction={'row'}
          alignItems={'center'}
          padding={() => vW() * 0.012}
          gap={() => vW() * 0.007}
        >
          <Txt text="USER ★" fill={COLORS.user} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Utilisateur" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>

        {/* Corps : DEDANS (root) | DEHORS (non-root) */}
        <Layout
          grow={1}
          width={'100%'}
          direction={'row'}
          alignItems={'stretch'}
          gap={0}
        >
          {/* Intérieur du namespace → ROOT */}
          <Rect
            grow={1}
            fill={COLORS.rootGreen + '12'}
            layout
            direction={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            gap={() => vH() * 0.010}
          >
            <Txt
              text="DEDANS"
              fill={COLORS.ghostText}
              fontSize={() => vW() * 0.007}
              fontWeight={700}
              fontFamily={'Space Grotesk'}
            />
            <Txt
              text="ROOT"
              fill={COLORS.rootGreen}
              fontSize={() => vW() * 0.018}
              fontWeight={800}
              fontFamily={'Space Grotesk'}
            />
          </Rect>

          {/* Séparateur vertical */}
          <Rect width={2} fill={COLORS.processBorder} />

          {/* Extérieur du namespace → non-root */}
          <Rect
            grow={1}
            layout
            direction={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            gap={() => vH() * 0.010}
          >
            <Txt
              text="DEHORS"
              fill={COLORS.ghostText}
              fontSize={() => vW() * 0.007}
              fontWeight={700}
              fontFamily={'Space Grotesk'}
            />
            <Txt
              text="non-root"
              fill={COLORS.ghostText}
              fontSize={() => vW() * 0.013}
              fontWeight={600}
              fontFamily={'Space Grotesk'}
            />
          </Rect>
        </Layout>
      </Rect>

      {/* ─── IPC ─────────────────────────────────────────────────────────── */}
      <Rect
        ref={ipcCard}
        x={0}
        y={() => vH() * 0.165}
        width={() => vW() * 0.27}
        height={() => vH() * 0.24}
        fill={COLORS.processBg}
        stroke={COLORS.ipc}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        <Rect
          width={'100%'}
          height={() => vH() * 0.052}
          fill={COLORS.ipc + '22'}
          layout
          direction={'row'}
          alignItems={'center'}
          padding={() => vW() * 0.012}
          gap={() => vW() * 0.007}
        >
          <Txt text="IPC" fill={COLORS.ipc} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Inter-Process" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>
        <Rect
          grow={1}
          width={'100%'}
          layout
          direction={'column'}
          gap={() => vH() * 0.012}
          padding={() => vW() * 0.014}
          alignItems={'flex-start'}
          justifyContent={'center'}
        >
          <Txt text="Queues de messages" fill={COLORS.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt text="Sémaphores isolés" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Sans, Space Grotesk'} />
        </Rect>
      </Rect>

      {/* ─── UTS ─────────────────────────────────────────────────────────── */}
      <Rect
        ref={utsCard}
        x={() => vW() * 0.325}
        y={() => vH() * 0.165}
        width={() => vW() * 0.27}
        height={() => vH() * 0.24}
        fill={COLORS.processBg}
        stroke={COLORS.uts}
        lineWidth={2}
        radius={() => vW() * 0.007}
        opacity={0}
        clip
        layout
        direction={'column'}
        gap={0}
      >
        <Rect
          width={'100%'}
          height={() => vH() * 0.052}
          fill={COLORS.uts + '22'}
          layout
          direction={'row'}
          alignItems={'center'}
          padding={() => vW() * 0.012}
          gap={() => vW() * 0.007}
        >
          <Txt text="UTS" fill={COLORS.uts} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
          <Txt text="Hostname" fill={COLORS.cream} fontSize={() => vW() * 0.009} fontFamily={'Space Grotesk'} opacity={0.65} />
        </Rect>
        <Rect
          grow={1}
          width={'100%'}
          layout
          direction={'column'}
          gap={() => vH() * 0.012}
          padding={() => vW() * 0.014}
          alignItems={'flex-start'}
          justifyContent={'center'}
        >
          <Txt text="Hostname indépendant" fill={COLORS.cream} fontSize={() => vW() * 0.010} fontWeight={600} fontFamily={'Space Grotesk'} />
          <Txt text="machine:    alex-pc" fill={COLORS.ghostText} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
          <Txt text="container:  mon-app" fill={COLORS.uts} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
        </Rect>
      </Rect>

      {/* Caption */}
      <Txt
        ref={captionRef}
        text=""
        fill={COLORS.cream}
        fontSize={() => vW() * 0.013}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.435}
        opacity={0}
        textAlign={'center'}
      />
    </Layout>,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Intro ────────────────────────────────────────────────────────────────
  yield* waitUntil('introNamespaces');

  yield* all(
    gridRef().opacity(0.5, 0.8),
    titleRef().opacity(1, 0.6),
  );
  yield* subtitleRef().opacity(1, 0.5);

  // ─── PID ──────────────────────────────────────────────────────────────────
  yield* waitUntil('showPID');
  yield* pidCard().opacity(1, 0.5);

  // ─── NET ──────────────────────────────────────────────────────────────────
  yield* waitUntil('showNET');
  yield* netCard().opacity(1, 0.5);

  // ─── MOUNT ────────────────────────────────────────────────────────────────
  yield* waitUntil('showMount');
  yield* mountCard().opacity(1, 0.5);

  // ─── USER ─────────────────────────────────────────────────────────────────
  yield* waitUntil('showUser');
  yield* userCard().opacity(1, 0.5);

  // Pulse pour souligner l'importance
  yield* userCard().scale(1.05, 0.2, easeOutCubic);
  yield* userCard().scale(1.0, 0.2, easeOutCubic);

  // ─── Highlight rootless ───────────────────────────────────────────────────
  yield* waitUntil('showRootless');

  captionRef().text('→ technologie derrière les containers rootless');
  yield* all(
    captionRef().opacity(1, 0.5),
    userCard().lineWidth(4, 0.35),
  );
  yield* userCard().lineWidth(2, 0.35);

  yield* waitFor(1);
  yield* captionRef().opacity(0, 0.3);

  // ─── IPC ──────────────────────────────────────────────────────────────────
  yield* waitUntil('showIPC');
  yield* ipcCard().opacity(1, 0.5);

  // ─── UTS ──────────────────────────────────────────────────────────────────
  yield* waitUntil('showUTS');
  yield* utsCard().opacity(1, 0.5);

  yield* waitFor(0.3);

  captionRef().text('6 namespaces · isolation totale du processus');
  yield* captionRef().opacity(1, 0.5);

  yield* waitFor(1.5);

  // ─── Fin ──────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    titleRef().opacity(0, 0.5),
    subtitleRef().opacity(0, 0.5),
    pidCard().opacity(0, 0.5),
    netCard().opacity(0, 0.5),
    mountCard().opacity(0, 0.5),
    userCard().opacity(0, 0.5),
    ipcCard().opacity(0, 0.5),
    utsCard().opacity(0, 0.5),
    captionRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
