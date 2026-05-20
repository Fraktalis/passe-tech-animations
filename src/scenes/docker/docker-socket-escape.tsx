import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {
  all,
  cancel,
  createRef,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';
import {Terminal} from '../../components/Terminal';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:            '#0D1117',
    grid:          '#21262D',
    cream:         '#F9F9F6',
    ghost:         '#30363D',
    ghostText:     '#7D8590',
    hostBg:        '#161B22',
    hostBorder:    '#30363D',
    containerBg:   '#0D1117',
    safe:          '#3FB950',
    socket:        '#FFE14D',
    breach:        '#FF3E6C',
  };

  // ─── Refs ────────────────────────────────────────────────────────────────
  const camera         = createRef<Layout>();
  const gridRef        = createRef<Grid>();
  const titleRef       = createRef<Txt>();

  // Hôte
  const hostBox        = createRef<Rect>();
  const hostLabel      = createRef<Txt>();

  // Col 1 — Filesystem tree
  const fsRoot         = createRef<Txt>();
  const fsHome         = createRef<Txt>();
  const fsDev          = createRef<Txt>();
  const fsEtc          = createRef<Txt>();
  const fsRootDir      = createRef<Txt>();
  const fsVar          = createRef<Txt>();
  const fsRun          = createRef<Txt>();
  const fsSock         = createRef<Txt>();

  // Col 3 — Container 1 (breached)
  const container1Box   = createRef<Rect>();
  const container1Label = createRef<Txt>();
  const c1FsRoot        = createRef<Txt>();
  const c1FsBin         = createRef<Txt>();
  const c1FsTmp         = createRef<Txt>();
  const c1Sock          = createRef<Txt>();   // docker.sock monté dans container 1
  const connectLine     = createRef<Line>();  // docker.sock → container 1 (phase 3)
  const mountCmd        = createRef<Txt>();   // flag -v en haut

  // Col 3 — Container 2 (évasion)
  const spawnArrow     = createRef<Line>();
  const spawnLabel     = createRef<Txt>();
  const container2Box  = createRef<Rect>();
  const c2Title        = createRef<Txt>();
  const c2Volume       = createRef<Txt>();
  const c2Host         = createRef<Txt>();
  const backArrow      = createRef<Line>();
  const backLabel      = createRef<Txt>();

  // Terminal
  const termRef        = createRef<Terminal>();

  // Caption
  const captionRef     = createRef<Txt>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCÈNE
  // ═══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout ref={camera} key="camera">
      <Rect key="bg" width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid
        ref={gridRef}
        key="grid"
        width={'100%'}
        height={'100%'}
        stroke={COLORS.grid}
        lineWidth={1}
        spacing={() => vW() * 0.031}
        opacity={0}
        zIndex={-1}
      />

      {/* Titre */}
      <Txt
        ref={titleRef}
        key="title"
        text="DOCKER SOCKET ESCAPE"
        fill={COLORS.breach}
        fontSize={() => vW() * 0.026}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.435}
        opacity={0}
      />

      {/* ── Hôte Linux ────────────────────────────────────────────────────── */}
      <Rect
        ref={hostBox}
        key="host-box"
        x={0}
        y={() => vH() * -0.015}
        width={() => vW() * 0.900}
        height={() => vH() * 0.740}
        fill={COLORS.hostBg}
        stroke={COLORS.hostBorder}
        lineWidth={2}
        radius={() => vW() * 0.008}
        opacity={0}
      />
      <Txt
        ref={hostLabel}
        key="host-label"
        text="Hôte Linux"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.013}
        fontFamily={'Space Grotesk'}
        fontWeight={600}
        x={() => vW() * -0.395}
        y={() => vH() * -0.360}
        opacity={0}
      />

      {/* ── Col 1 : Filesystem ────────────────────────────────────────────── */}
      <Txt
        ref={fsRoot}
        key="fs-root"
        text="/"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.018}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * -0.348}
        y={() => vH() * -0.285}
        opacity={0}
      />
      <Txt
        ref={fsHome}
        key="fs-home"
        text="├── /home"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.329}
        y={() => vH() * -0.228}
        opacity={0}
      />
      <Txt
        ref={fsDev}
        key="fs-dev"
        text="├── /dev"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.329}
        y={() => vH() * -0.183}
        opacity={0}
      />
      <Txt
        ref={fsEtc}
        key="fs-etc"
        text="├── /etc"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.329}
        y={() => vH() * -0.138}
        opacity={0}
      />
      <Txt
        ref={fsRootDir}
        key="fs-root-dir"
        text="├── /root"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.329}
        y={() => vH() * -0.093}
        opacity={0}
      />
      <Txt
        ref={fsVar}
        key="fs-var"
        text="└── /var"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.329}
        y={() => vH() * -0.048}
        opacity={0}
      />
      <Txt
        ref={fsRun}
        key="fs-run"
        text="    └── /run"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.313}
        y={() => vH() * -0.003}
        opacity={0}
      />
      <Txt
        ref={fsSock}
        key="fs-sock"
        text="        └── docker.sock"
        fill={COLORS.socket}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * -0.297}
        y={() => vH() * 0.042}
        opacity={0}
      />

      {/* Ligne directe docker.sock → Container 1 (L-shape, phase 3) */}
      <Line
        ref={connectLine}
        key="connect-line"
        points={() => [
          [vW() * -0.115, vH() * 0.042],
          [vW() * 0.185,  vH() * 0.042],
          [vW() * 0.185,  vH() * -0.005],
        ]}
        stroke={COLORS.socket}
        lineWidth={3}
        endArrow
        arrowSize={12}
        opacity={0}
        end={0}
      />

      {/* Flag -v (phase 3) */}
      <Txt
        ref={mountCmd}
        key="mount-cmd"
        text="-v /var/run/docker.sock:/var/run/docker.sock"
        fill={COLORS.socket}
        fontSize={() => vW() * 0.015}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        y={() => vH() * -0.388}
        opacity={0}
      />

      {/* ── Col 3 top : Container 1 ───────────────────────────────────────── */}
      <Txt
        ref={container1Label}
        key="c1-label"
        text="Container ubuntu"
        fill={COLORS.safe}
        fontSize={() => vW() * 0.013}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        x={() => vW() * 0.295}
        y={() => vH() * -0.278}
        opacity={0}
      />
      <Rect
        ref={container1Box}
        key="c1-box"
        x={() => vW() * 0.295}
        y={() => vH() * -0.130}
        width={() => vW() * 0.220}
        height={() => vH() * 0.270}
        fill={COLORS.containerBg}
        stroke={COLORS.safe}
        lineWidth={3}
        radius={() => vW() * 0.007}
        opacity={0}
        shadowColor={COLORS.safe}
        shadowBlur={() => vW() * 0.010}
      />

      {/* Mini-FS dans container 1 */}
      <Txt
        ref={c1FsRoot}
        key="c1-fs-root"
        text="/"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.015}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * 0.235}
        y={() => vH() * -0.215}
        opacity={0}
      />
      <Txt
        ref={c1FsBin}
        key="c1-fs-bin"
        text="├── /bin"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.248}
        y={() => vH() * -0.165}
        opacity={0}
      />
      <Txt
        ref={c1FsTmp}
        key="c1-fs-tmp"
        text="└── /tmp"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.248}
        y={() => vH() * -0.118}
        opacity={0}
      />

      {/* docker.sock à l'intérieur du container 1 (phase 3) */}
      <Txt
        ref={c1Sock}
        key="c1-sock"
        text="└── docker.sock"
        fill={COLORS.socket}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * 0.248}
        y={() => vH() * -0.060}
        opacity={0}
      />

      {/* ── Col 3 bottom : Container 2 (évasion) ─────────────────────────── */}

      {/* Flèche spawn : container 1 → container 2 */}
      <Line
        ref={spawnArrow}
        key="spawn-arrow"
        points={() => [
          [vW() * 0.295, vH() * -0.005],
          [vW() * 0.295, vH() * 0.095],
        ]}
        stroke={COLORS.breach}
        lineWidth={3}
        endArrow
        arrowSize={12}
        opacity={0}
        end={0}
      />
      <Txt
        ref={spawnLabel}
        key="spawn-label"
        text="docker run"
        fill={COLORS.breach}
        fontSize={() => vW() * 0.011}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.360}
        y={() => vH() * 0.045}
        opacity={0}
      />

      <Txt
        ref={c2Title}
        key="c2-title"
        text="Nouveau container ubuntu"
        fill={COLORS.breach}
        fontSize={() => vW() * 0.013}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        x={() => vW() * 0.215}
        y={() => vH() * 0.088}
        opacity={0}
      />
      <Rect
        ref={container2Box}
        key="c2-box"
        x={() => vW() * 0.295}
        y={() => vH() * 0.200}
        width={() => vW() * 0.280}
        height={() => vH() * 0.195}
        fill={'#FF3E6C08'}
        stroke={COLORS.breach}
        lineWidth={3}
        radius={() => vW() * 0.007}
        opacity={0}
        shadowColor={COLORS.breach}
        shadowBlur={() => vW() * 0.015}
      />
      <Txt
        ref={c2Volume}
        key="c2-volume"
        text="-v /:/host"
        fill={COLORS.socket}
        fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * 0.295}
        y={() => vH() * 0.175}
        opacity={0}
      />
      <Txt
        ref={c2Host}
        key="c2-host"
        text="/host → /"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.013}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.295}
        y={() => vH() * 0.225}
        opacity={0}
      />

      {/* Flèche retour : container 2 → FS tree root (L-shape dashed) */}
      <Line
        ref={backArrow}
        key="back-arrow"
        points={() => [
          [vW() * 0.155,  vH() * 0.200],
          [vW() * -0.200, vH() * 0.200],
          [vW() * -0.348, vH() * -0.285],
        ]}
        stroke={COLORS.breach}
        lineWidth={2}
        lineDash={[6, 4]}
        endArrow
        arrowSize={10}
        opacity={0}
        end={0}
      />
      <Txt
        ref={backLabel}
        key="back-label"
        text="accède au FS hôte"
        fill={COLORS.breach}
        fontSize={() => vW() * 0.011}
        fontFamily={'Space Grotesk'}
        x={() => vW() * -0.050}
        y={() => vH() * 0.183}
        opacity={0}
      />

      {/* ── Terminal ──────────────────────────────────────────────────────── */}
      <Terminal
        ref={termRef}
        key="terminal"
        title="root@container:/# bash"
        fontSize={() => vW() * 0.014}
        width={() => vW() * 0.780}
        height={() => vH() * 0.290}
        maxLines={8}
        x={0}
        y={() => vH() * 0.370}
        opacity={0}
        zIndex={10}
        stroke={COLORS.breach}
      />

      {/* ── Caption ───────────────────────────────────────────────────────── */}
      <Txt
        ref={captionRef}
        key="caption"
        text=""
        fill={COLORS.cream}
        fontSize={() => vW() * 0.015}
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

  // ─── Phase 1 : Hôte + FS ─────────────────────────────────────────────────
  yield* waitUntil('setupHost');

  yield* all(
    gridRef().opacity(0.4, 0.8),
    titleRef().opacity(1, 0.6),
  );
  yield* waitFor(0.2);

  yield* all(
    hostBox().opacity(1, 0.5),
    hostLabel().opacity(1, 0.5),
  );
  yield* waitFor(0.3);

  // FS tree apparaît nœud par nœud
  yield* fsRoot().opacity(1, 0.35);
  yield* sequence(0.06,
    fsHome().opacity(1, 0.28),
    fsDev().opacity(1, 0.28),
    fsEtc().opacity(1, 0.28),
    fsRootDir().opacity(1, 0.28),
    fsVar().opacity(1, 0.28),
    fsRun().opacity(1, 0.28),
    fsSock().opacity(1, 0.40),
  );
  yield* waitFor(0.8);

  // ─── Phase 2 : Container 1 isolé ─────────────────────────────────────────
  yield* waitUntil('showContainer');

  yield* all(
    container1Box().opacity(1, 0.5),
    container1Label().opacity(1, 0.5),
  );
  yield* sequence(0.1,
    c1FsRoot().opacity(1, 0.28),
    c1FsBin().opacity(1, 0.25),
    c1FsTmp().opacity(1, 0.25),
  );

  captionRef().text('Namespace actif — le container est isolé');
  yield* captionRef().opacity(1, 0.4);
  yield* waitFor(1.2);
  yield* captionRef().opacity(0, 0.3);

  // ─── Phase 3 : Montage du socket ─────────────────────────────────────────
  yield* waitUntil('mountSocket');

  yield* mountCmd().opacity(1, 0.5);
  yield* waitFor(0.4);

  // Flèche docker.sock → Container 1 se dessine
  connectLine().opacity(1);
  yield* connectLine().end(1, 0.55, easeInOutCubic);

  // Container 1 vire au rouge
  yield* all(
    container1Box().stroke(COLORS.breach, 0.4),
    container1Box().shadowColor(COLORS.breach, 0.4),
    container1Label().fill(COLORS.breach, 0.4),
  );

  // docker.sock apparaît dans container 1
  yield* c1Sock().opacity(1, 0.4);

  captionRef().text('L\'API Docker est maintenant accessible depuis l\'intérieur du container');
  yield* captionRef().opacity(1, 0.4);
  yield* waitFor(1.4);
  yield* captionRef().opacity(0, 0.3);

  // ─── Phase 4 : Terminal ───────────────────────────────────────────────────
  yield* waitUntil('showTerminal');

  yield* all(
    camera().position([0, -vH() * 0.168], 0.6, easeInOutCubic),
    termRef().opacity(1, 0.5),
  );

  const blink = yield termRef().startBlink();

  yield* termRef().typewrite(
    "curl -s --unix-socket /var/run/docker.sock http://localhost/containers/json | jq '.[].Names'",
    {prompt: true, charDelay: 0.022, color: 'cream'},
  );
  yield* waitFor(0.3);
  yield* termRef().typewrite('["webapp","db","redis","monitoring"]', {color: 'vert'});
  yield* waitFor(0.7);

  yield* termRef().typewrite('apt install -y docker.io', {prompt: true, charDelay: 0.038});
  yield* waitFor(0.2);
  yield* termRef().typewrite('Unpacking docker.io (24.0.7) ... done', {color: 'ghost'});
  yield* waitFor(0.5);

  yield* termRef().typewrite(
    'docker run -v /:/host -it ubuntu chroot /host',
    {prompt: true, charDelay: 0.042, color: 'jaune'},
  );

  cancel(blink);
  yield* termRef().hideCursor();
  yield* waitFor(0.7);

  // ─── Phase 5 : Évasion ───────────────────────────────────────────────────
  yield* waitUntil('escape');

  yield* all(
    camera().position([0, 0], 0.6, easeInOutCubic),
    termRef().opacity(0, 0.4),
  );

  // Flèche spawn + container 2 apparaît
  spawnArrow().opacity(1);
  yield* all(
    spawnArrow().end(1, 0.4, easeOutCubic),
    spawnLabel().opacity(1, 0.4),
  );
  yield* waitFor(0.1);

  yield* c2Title().opacity(1, 0.35);
  yield* container2Box().opacity(1, 0.45);
  yield* all(
    c2Volume().opacity(1, 0.35),
    c2Host().opacity(1, 0.35),
  );
  yield* waitFor(0.3);

  // Flèche retour vers FS hôte
  backArrow().opacity(1);
  backLabel().opacity(1);
  yield* backArrow().end(1, 0.7, easeInOutCubic);

  captionRef().text("Il n'a pas sauté la clôture — il a demandé poliment à Docker d'en ouvrir une.");
  yield* captionRef().opacity(1, 0.5);

  yield* waitFor(2.5);

  // ─── Fin ─────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    gridRef().opacity(0, 0.6),
    titleRef().opacity(0, 0.6),
    hostBox().opacity(0, 0.6),
    captionRef().opacity(0, 0.5),
  );
});
