import {makeScene2D, Layout, Rect, Txt, Grid, Icon} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil} from '@motion-canvas/core';
import {DiagramNode} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Geometry constants ─────────────────────────────────────────────────────
  const COLS        = 6;
  const CELL_W      = 0.095;  // fraction of vW per cell
  const CELL_H      = 0.055;  // fraction of vH per cell
  const GAP_W       = 0.008;
  const GAP_H       = 0.010;
  const GRID_Y_FRAC = -0.02;  // vertical center of the grid (slight upward offset)

  // Indices granted by Docker by default — 14 capabilities
  const DOCKER_DEFAULT_INDICES = new Set([0, 1, 3, 4, 5, 6, 7, 8, 10, 13, 18, 27, 29, 31]);

  // 41 Linux capabilities, shortened for display (CAP_ prefix implicit)
  const CAPS = [
    'CHOWN',      'DAC_OVERRD', 'DAC_READ',   'FOWNER',     'FSETID',     'KILL',
    'SETGID',     'SETUID',     'SETPCAP',    'LINUX_IMM',  'NET_BIND',   'NET_BCAST',
    'NET_ADMIN',  'NET_RAW',    'IPC_LOCK',   'IPC_OWNER',  'SYS_MODULE', 'SYS_RAWIO',
    'SYS_CHROOT', 'SYS_PTRACE', 'SYS_PACCT',  'SYS_ADMIN',  'SYS_BOOT',   'SYS_NICE',
    'SYS_RSRC',   'SYS_TIME',   'SYS_TTY',    'MKNOD',      'LEASE',      'AUDIT_WRITE',
    'AUDIT_CTRL', 'SETFCAP',   'MAC_OVERRD',  'MAC_ADMIN',  'SYSLOG',     'WAKE_ALARM',
    'BLK_SUSPEND','AUDIT_READ', 'PERFMON',    'BPF',        'CHECKPOINT',
  ];

  const TOTAL_ROWS = Math.ceil(CAPS.length / COLS); // 7

  // Position helpers — return vW/vH fractions, multiplied in JSX
  function capCellX(capIndex: number): number {
    const col = capIndex % COLS;
    return (col - (COLS - 1) / 2) * (CELL_W + GAP_W);
  }
  function capCellY(capIndex: number): number {
    const row = Math.floor(capIndex / COLS);
    return GRID_Y_FRAC + (row - (TOTAL_ROWS - 1) / 2) * (CELL_H + GAP_H);
  }

  // ── Refs ──────────────────────────────────────────────────────────────────
  const bgGridRef = createRef<Grid>();

  // Beat 1 — binary model
  const rootNodeRef  = createRef<DiagramNode>();
  const userNodeRef  = createRef<DiagramNode>();
  const rootPowerRef = createRef<Txt>();
  const userPowerRef = createRef<Txt>();

  // Beat 2 — capabilities grid (one ref per cell + one per label)
  const capsTitleRef = createRef<Txt>();
  const capCellRefs  = CAPS.map(() => createRef<Rect>());
  const capTxtRefs   = CAPS.map(() => createRef<Txt>());

  // Beat 3 — Docker default counter
  const dockerCounterRef = createRef<Txt>();

  // Beat 4 — --privileged
  const privilegedLabelRef = createRef<Txt>();
  const seccompWarningRef  = createRef<Layout>();
  const appArmorWarningRef = createRef<Layout>();
  const devMountWarningRef = createRef<Layout>();

  // ── Scene tree ────────────────────────────────────────────────────────────
  view.add(
    <Layout key="scene-root" width={'100%'} height={'100%'}>
      <Rect key="scene-bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />
      <Grid
        key="scene-bg-grid"
        ref={bgGridRef}
        width={'100%'}
        height={'100%'}
        spacing={() => vW() * 0.04}
        stroke={PALETTE.cream + '10'}
        lineWidth={1}
        opacity={0}
      />

      {/* ── Beat 1: modèle binaire root / user ───────────────────────── */}
      <DiagramNode
        key="binary-root"
        ref={rootNodeRef}
        preset="person"
        iconName="lucide:skull"
        label="root"
        sublabel="UID 0"
        color={PALETTE.dsRose}
        initialState="error"
        width={() => vW() * 0.18}
        height={() => vH() * 0.28}
        x={() => vW() * -0.22}
        y={() => vH() * -0.07}
        opacity={0}
      />
      <DiagramNode
        key="binary-user"
        ref={userNodeRef}
        preset="person"
        label="user"
        sublabel="UID 1000"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.18}
        height={() => vH() * 0.28}
        x={() => vW() * 0.22}
        y={() => vH() * -0.07}
        opacity={0}
      />
      <Txt
        key="root-power"
        ref={rootPowerRef}
        text="TOUT"
        fill={PALETTE.dsRose}
        fontSize={() => vW() * 0.045}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        fontWeight={700}
        x={() => vW() * -0.22}
        y={() => vH() * 0.13}
        opacity={0}
      />
      <Txt
        key="user-power"
        ref={userPowerRef}
        text="RIEN"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.045}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        fontWeight={700}
        x={() => vW() * 0.22}
        y={() => vH() * 0.13}
        opacity={0}
      />

      {/* ── Beat 2: grille des 41 capabilities ───────────────────────── */}
      <Txt
        key="caps-header"
        ref={capsTitleRef}
        text="# 41 LINUX CAPABILITIES"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.011}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        x={0}
        y={() => vH() * -0.37}
        opacity={0}
      />

      {CAPS.map((capName, capIndex) => (
        <Rect
          key={`cap-cell-${capName}`}
          ref={capCellRefs[capIndex]}
          width={() => vW() * CELL_W}
          height={() => vH() * CELL_H}
          x={() => vW() * capCellX(capIndex)}
          y={() => vH() * capCellY(capIndex)}
          fill={PALETTE.nodeBg}
          stroke={PALETTE.secondary + '44'}
          lineWidth={1}
          radius={4}
          opacity={0}
        >
          <Txt
            key={`cap-txt-${capName}`}
            ref={capTxtRefs[capIndex]}
            text={capName}
            fill={PALETTE.secondary}
            fontSize={() => vW() * 0.0078}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
        </Rect>
      ))}

      {/* ── Beat 3: compteur Docker default ──────────────────────────── */}
      <Txt
        key="docker-counter"
        ref={dockerCounterRef}
        text="14 / 41"
        fill={PALETTE.cyan}
        fontSize={() => vW() * 0.020}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        fontWeight={700}
        x={() => vW() * 0.40}
        y={() => vH() * -0.37}
        opacity={0}
      />

      {/* ── Beat 4: --privileged label + avertissements ───────────────── */}
      <Txt
        key="privileged-label"
        ref={privilegedLabelRef}
        text="--privileged"
        fill={PALETTE.dsRose}
        fontSize={() => vW() * 0.020}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        fontWeight={700}
        x={() => vW() * 0.40}
        y={() => vH() * -0.37}
        opacity={0}
      />

      <Layout
        key="seccomp-warning"
        ref={seccompWarningRef}
        layout
        direction="row"
        alignItems="center"
        gap={() => vW() * 0.010}
        x={() => vW() * -0.26}
        y={() => vH() * 0.31}
        opacity={0}
      >
        <Icon
          key="seccomp-icon"
          icon="lucide:shield-off"
          size={() => vW() * 0.018}
          color={PALETTE.dsRose}
        />
        <Txt
          key="seccomp-txt"
          text="seccomp : off"
          fill={PALETTE.dsRose}
          fontSize={() => vW() * 0.011}
          fontFamily="JetBrains Mono, DM Mono, monospace"
        />
      </Layout>

      <Layout
        key="apparmor-warning"
        ref={appArmorWarningRef}
        layout
        direction="row"
        alignItems="center"
        gap={() => vW() * 0.010}
        x={0}
        y={() => vH() * 0.31}
        opacity={0}
      >
        <Icon
          key="apparmor-icon"
          icon="lucide:shield-off"
          size={() => vW() * 0.018}
          color={PALETTE.dsRose}
        />
        <Txt
          key="apparmor-txt"
          text="AppArmor : off"
          fill={PALETTE.dsRose}
          fontSize={() => vW() * 0.011}
          fontFamily="JetBrains Mono, DM Mono, monospace"
        />
      </Layout>

      <Layout
        key="devmount-warning"
        ref={devMountWarningRef}
        layout
        direction="row"
        alignItems="center"
        gap={() => vW() * 0.010}
        x={() => vW() * 0.26}
        y={() => vH() * 0.31}
        opacity={0}
      >
        <Icon
          key="devmount-icon"
          icon="lucide:hard-drive"
          size={() => vW() * 0.018}
          color={PALETTE.dsRose}
        />
        <Txt
          key="devmount-txt"
          text="/dev/* monté"
          fill={PALETTE.dsRose}
          fontSize={() => vW() * 0.011}
          fontFamily="JetBrains Mono, DM Mono, monospace"
        />
      </Layout>
    </Layout>
  );

  // ── Beat 1 — modèle binaire ───────────────────────────────────────────────
  yield* waitUntil('showBinary');
  yield* bgGridRef().opacity(0.12, 0.5);
  yield* sequence(0.2,
    rootNodeRef().opacity(1, 0.35),
    userNodeRef().opacity(1, 0.35),
  );
  yield* waitFor(0.3);
  yield* sequence(0.2,
    rootPowerRef().opacity(1, 0.35),
    userPowerRef().opacity(1, 0.35),
  );

  // ── Beat 2 — grille des capabilities ─────────────────────────────────────
  yield* waitUntil('showCaps');
  yield* all(
    rootNodeRef().opacity(0, 0.3),
    userNodeRef().opacity(0, 0.3),
    rootPowerRef().opacity(0, 0.25),
    userPowerRef().opacity(0, 0.25),
  );
  yield* capsTitleRef().opacity(1, 0.3);
  // Cascade row par row — chaque ligne apparaît ensemble puis on attend
  for (let rowIndex = 0; rowIndex < TOTAL_ROWS; rowIndex++) {
    const rowStart = rowIndex * COLS;
    const rowEnd   = Math.min(rowStart + COLS, CAPS.length);
    yield* all(...capCellRefs.slice(rowStart, rowEnd).map(ref => ref().opacity(1, 0.22)));
    yield* waitFor(0.06);
  }

  // ── Beat 3 — Docker default set ───────────────────────────────────────────
  yield* waitUntil('showDockerDefault');
  yield* dockerCounterRef().opacity(1, 0.3);
  // Les 14 caps Docker s'allument séquentiellement en cyan
  yield* sequence(0.055,
    ...Array.from(DOCKER_DEFAULT_INDICES).map(capIndex =>
      all(
        capCellRefs[capIndex]().fill(PALETTE.cyan + '22', 0.12),
        capCellRefs[capIndex]().stroke(PALETTE.cyan, 0.12),
        capTxtRefs[capIndex]().fill(PALETTE.cyan, 0.12),
      )
    ),
  );

  // ── Beat 4 — --privileged ─────────────────────────────────────────────────
  yield* waitUntil('showPrivileged');
  yield* dockerCounterRef().opacity(0, 0.2);
  yield* privilegedLabelRef().opacity(1, 0.25);
  // Toutes les capabilities basculent en rouge simultanément — effet brutal voulu
  yield* all(
    ...CAPS.map((_, capIndex) =>
      all(
        capCellRefs[capIndex]().fill(PALETTE.dsRose + '22', 0.08),
        capCellRefs[capIndex]().stroke(PALETTE.dsRose, 0.08),
        capTxtRefs[capIndex]().fill(PALETTE.dsRose, 0.08),
      )
    ),
  );
  yield* waitFor(0.3);
  // Les trois mécanismes de sécurité désactivés apparaissent en séquence
  yield* sequence(0.15,
    seccompWarningRef().opacity(1, 0.3),
    appArmorWarningRef().opacity(1, 0.3),
    devMountWarningRef().opacity(1, 0.3),
  );
  yield* waitFor(1.5);

  // ── End ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    bgGridRef().opacity(0, 0.4),
    capsTitleRef().opacity(0, 0.3),
    privilegedLabelRef().opacity(0, 0.3),
    seccompWarningRef().opacity(0, 0.3),
    appArmorWarningRef().opacity(0, 0.3),
    devMountWarningRef().opacity(0, 0.3),
    ...capCellRefs.map(ref => ref().opacity(0, 0.25)),
  );
});
