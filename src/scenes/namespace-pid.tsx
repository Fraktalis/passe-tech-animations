import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, easeInOutCubic, easeOutCubic, sequence, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg: '#0D1117',
    grid: '#21262D',
    cream: '#F9F9F6',
    ghost: '#3D444D',
    ghostText: '#484F58',
    pid1Color: '#58A6FF',   // bleu — racine
    pidNormal: '#3FB950',   // vert — processus ordinaire
    pidTarget: '#FFE14D',   // jaune — processus ciblé
    pidChild: '#6DFF8A',    // vert vif — enfants dans le namespace
    ns: '#FF3E6C',          // rose Passe-Tech — mur du namespace
    processBg: '#1C2128',
    processBorder: '#30363D',
  };

  // ─── Refs ────────────────────────────────────────────────────────────────
  const camera          = createRef<Layout>();   // wrapper "caméra" pour le zoom
  const gridRef         = createRef<Grid>();
  const titleRef        = createRef<Txt>();
  const subtitleRef     = createRef<Txt>();

  // Boîtes de processus
  const pid1Box         = createRef<Rect>();
  const pid42Box        = createRef<Rect>();
  const pid87Box        = createRef<Rect>();
  const pid156Box       = createRef<Rect>();
  const pid242Box       = createRef<Rect>();
  const pid242PIDLabel  = createRef<Txt>();

  // Enfants namespace
  const pid2Box         = createRef<Rect>();
  const pid3Box         = createRef<Rect>();

  // Lignes de connexion — arbre hôte
  const lineToP42       = createRef<Line>();
  const lineToP87       = createRef<Line>();
  const lineToP156      = createRef<Line>();
  const lineTo242       = createRef<Line>();

  // Lignes de connexion — enfants namespace
  const lineNs1         = createRef<Line>();
  const lineNs2         = createRef<Line>();

  // Mur du namespace
  const nsWall          = createRef<Rect>();

  // Légende bas de frame
  const captionRef      = createRef<Txt>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCÈNE
  // ═══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout ref={camera}>
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

      {/* Titre + sous-titre */}
      <Txt
        ref={titleRef}
        text="NAMESPACE PID"
        fill={COLORS.ns}
        fontSize={() => vW() * 0.035}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.426}
        opacity={0}
      />
      <Txt
        ref={subtitleRef}
        text="déformer la réalité d'un processus"
        fill={COLORS.ghostText}
        fontSize={() => vW() * 0.014}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.361}
        opacity={0}
      />

      {/* ─── Lignes — arbre hôte (dessinées sous les boîtes) ─────────────── */}
      <Line
        ref={lineToP42}
        points={() => [[0, vH() * -0.282], [vW() * -0.25, vH() * -0.181]]}
        stroke={COLORS.processBorder}
        lineWidth={2}
        opacity={0}
        end={0}
      />
      <Line
        ref={lineToP87}
        points={() => [[0, vH() * -0.282], [0, vH() * -0.181]]}
        stroke={COLORS.processBorder}
        lineWidth={2}
        opacity={0}
        end={0}
      />
      <Line
        ref={lineToP156}
        points={() => [[0, vH() * -0.282], [vW() * 0.25, vH() * -0.181]]}
        stroke={COLORS.processBorder}
        lineWidth={2}
        opacity={0}
        end={0}
      />
      <Line
        ref={lineTo242}
        points={() => [[vW() * 0.25, vH() * -0.116], [vW() * 0.25, vH() * 0.005]]}
        stroke={COLORS.processBorder}
        lineWidth={2}
        opacity={0}
        end={0}
      />

      {/* ─── Lignes — enfants namespace ──────────────────────────────────── */}
      <Line
        ref={lineNs1}
        points={() => [[vW() * 0.25, vH() * 0.069], [vW() * 0.182, vH() * 0.182]]}
        stroke={COLORS.pidChild}
        lineWidth={2}
        opacity={0}
        end={0}
      />
      <Line
        ref={lineNs2}
        points={() => [[vW() * 0.25, vH() * 0.069], [vW() * 0.318, vH() * 0.182]]}
        stroke={COLORS.pidChild}
        lineWidth={2}
        opacity={0}
        end={0}
      />

      {/* ─── PID 1 — systemd ─────────────────────────────────────────────── */}
      <Rect
        ref={pid1Box}
        x={0}
        y={() => vH() * -0.315}
        width={() => vW() * 0.109}
        height={() => vH() * 0.065}
        fill={COLORS.processBg}
        stroke={COLORS.pid1Color}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt
          text="PID 1"
          fill={COLORS.pid1Color}
          fontSize={() => vW() * 0.013}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="systemd"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.008}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ─── PID 42 — nginx ──────────────────────────────────────────────── */}
      <Rect
        ref={pid42Box}
        x={() => vW() * -0.25}
        y={() => vH() * -0.148}
        width={() => vW() * 0.096}
        height={() => vH() * 0.060}
        fill={COLORS.processBg}
        stroke={COLORS.processBorder}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt
          text="PID 42"
          fill={COLORS.pidNormal}
          fontSize={() => vW() * 0.011}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="nginx"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.008}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ─── PID 87 — sshd ───────────────────────────────────────────────── */}
      <Rect
        ref={pid87Box}
        x={0}
        y={() => vH() * -0.148}
        width={() => vW() * 0.096}
        height={() => vH() * 0.060}
        fill={COLORS.processBg}
        stroke={COLORS.processBorder}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt
          text="PID 87"
          fill={COLORS.pidNormal}
          fontSize={() => vW() * 0.011}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="sshd"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.008}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ─── PID 156 — bash ──────────────────────────────────────────────── */}
      <Rect
        ref={pid156Box}
        x={() => vW() * 0.25}
        y={() => vH() * -0.148}
        width={() => vW() * 0.096}
        height={() => vH() * 0.060}
        fill={COLORS.processBg}
        stroke={COLORS.processBorder}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt
          text="PID 156"
          fill={COLORS.pidNormal}
          fontSize={() => vW() * 0.011}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="bash"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.008}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ─── PID 242 — notre processus cible ─────────────────────────────── */}
      <Rect
        ref={pid242Box}
        x={() => vW() * 0.25}
        y={() => vH() * 0.037}
        width={() => vW() * 0.109}
        height={() => vH() * 0.065}
        fill={COLORS.processBg}
        stroke={COLORS.processBorder}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt
          ref={pid242PIDLabel}
          text="PID 242"
          fill={COLORS.pidTarget}
          fontSize={() => vW() * 0.013}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="bash"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.009}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.7}
        />
      </Rect>

      {/* ─── Mur du namespace — dessiné après les boîtes hôte, avant enfants ─ */}
      <Rect
        ref={nsWall}
        x={() => vW() * 0.25}
        y={() => vH() * 0.037}
        width={() => vW() * 0.130}
        height={() => vH() * 0.104}
        stroke={COLORS.ns}
        lineWidth={3}
        radius={() => vW() * 0.010}
        fill={'#FF3E6C0A'}
        opacity={0}
        shadowColor={COLORS.ns}
        shadowBlur={() => vW() * 0.015}
      />

      {/* ─── PID 2 — nginx (enfant namespace) ────────────────────────────── */}
      <Rect
        ref={pid2Box}
        x={() => vW() * 0.182}
        y={() => vH() * 0.213}
        width={() => vW() * 0.086}
        height={() => vH() * 0.060}
        fill={COLORS.processBg}
        stroke={COLORS.pidChild}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt
          text="PID 2"
          fill={COLORS.pidChild}
          fontSize={() => vW() * 0.011}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="nginx"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.008}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ─── PID 3 — bash (enfant namespace) ─────────────────────────────── */}
      <Rect
        ref={pid3Box}
        x={() => vW() * 0.318}
        y={() => vH() * 0.213}
        width={() => vW() * 0.086}
        height={() => vH() * 0.060}
        fill={COLORS.processBg}
        stroke={COLORS.pidChild}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout
        direction={'column'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vH() * 0.004}
      >
        <Txt
          text="PID 3"
          fill={COLORS.pidChild}
          fontSize={() => vW() * 0.011}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="bash"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.008}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ─── Légende bas de frame ─────────────────────────────────────────── */}
      <Txt
        ref={captionRef}
        text=""
        fill={COLORS.cream}
        fontSize={() => vW() * 0.015}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.407}
        opacity={0}
        textAlign={'center'}
      />
    </Layout>,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Intro : grille + titre ───────────────────────────────────────────────
  yield* waitUntil('introProcess');

  yield* all(
    gridRef().opacity(0.5, 0.8),
    titleRef().opacity(1, 0.6),
  );
  yield* subtitleRef().opacity(1, 0.5);

  // ─── PID 1 apparaît ───────────────────────────────────────────────────────
  yield* waitUntil('showPID1');

  yield* pid1Box().opacity(1, 0.5);
  yield* waitFor(0.5);

  // ─── Arbre de processus complet ───────────────────────────────────────────
  yield* waitUntil('showTree');

  // Lignes de PID 1 vers ses enfants
  lineToP42().opacity(1);
  lineToP87().opacity(1);
  lineToP156().opacity(1);

  yield* all(
    lineToP42().end(1, 0.4),
    lineToP87().end(1, 0.4),
    lineToP156().end(1, 0.4),
  );

  yield* sequence(0.08,
    pid42Box().opacity(1, 0.35),
    pid87Box().opacity(1, 0.35),
    pid156Box().opacity(1, 0.35),
  );

  yield* waitFor(0.4);

  // PID 242 — enfant de PID 156
  lineTo242().opacity(1);
  yield* lineTo242().end(1, 0.4);
  yield* pid242Box().opacity(1, 0.4);

  yield* waitFor(0.8);

  // ─── Activation du namespace ──────────────────────────────────────────────
  yield* waitUntil('namespaceActivate');

  // Mise en évidence du processus cible
  yield* all(
    pid242Box().stroke(COLORS.pidTarget, 0.4),
    pid242Box().lineWidth(3, 0.4),
  );

  // Bref pulse pour attirer l'œil
  yield* pid242Box().scale(1.07, 0.18, easeOutCubic);
  yield* pid242Box().scale(1.0, 0.18, easeOutCubic);

  yield* waitFor(0.2);

  // Tout le reste s'estompe
  yield* all(
    pid1Box().opacity(0.18, 0.6),
    pid42Box().opacity(0.18, 0.6),
    pid87Box().opacity(0.18, 0.6),
    pid156Box().opacity(0.18, 0.6),
    lineToP42().opacity(0.1, 0.6),
    lineToP87().opacity(0.1, 0.6),
    lineToP156().opacity(0.1, 0.6),
    lineTo242().opacity(0.1, 0.6),
    subtitleRef().opacity(0, 0.4),
  );

  // Mur du namespace apparaît
  yield* nsWall().opacity(1, 0.6);

  // Léger zoom caméra sur le processus ciblé
  // position = [-scale * targetX, -scale * targetY]
  let scale = 4;
  let pos = {width: -scale * pid242Box().x(), height: -scale * pid242Box().y()};

  yield* all(
    camera().scale(scale, 0.7, easeInOutCubic),
    camera().position(pos, 0.7, easeInOutCubic),
  );

  yield* waitFor(0.2);

  // ─── Transformation PID 242 → PID 1 ──────────────────────────────────────
  yield* waitUntil('pidTransform');

  // La bordure de la boîte prend la couleur du PID racine
  yield* pid242Box().stroke(COLORS.pid1Color, 0.5);

  // Le label "242" disparaît, "1" apparaît
  yield* pid242PIDLabel().opacity(0, 0.25);
  pid242PIDLabel().text('PID 1');
  pid242PIDLabel().fill(COLORS.pid1Color);
  yield* pid242PIDLabel().opacity(1, 0.35);

  yield* waitFor(0.2);

  // Caption
  captionRef().text("il s'imagine être le processus racine");
  yield* captionRef().opacity(1, 0.5);

  yield* waitFor(1);

  // ─── Enfants dans le namespace ────────────────────────────────────────────
  yield* waitUntil('showChildren');

  // Dézoom pour laisser la place aux enfants
  yield* all(
    camera().scale(1, 0.5, easeInOutCubic),
    camera().position([0, 0], 0.5, easeInOutCubic),
  );

  // Le mur s'étend pour englober les enfants
  yield* all(
    nsWall().y(vH() * 0.120, 0.5, easeInOutCubic),
    nsWall().height(vH() * 0.287, 0.5, easeInOutCubic),
    nsWall().width(vW() * 0.240, 0.5, easeInOutCubic),
  );

  // Lignes vers les enfants
  lineNs1().opacity(1);
  lineNs2().opacity(1);

  yield* all(
    lineNs1().end(1, 0.4),
    lineNs2().end(1, 0.4),
  );

  yield* all(
    pid2Box().opacity(1, 0.35),
    pid3Box().opacity(1, 0.35),
  );

  // Mise à jour du caption
  yield* captionRef().opacity(0, 0.3);
  captionRef().text('il ne voit que ses propres processus enfants');
  yield* captionRef().opacity(1, 0.4);

  yield* waitFor(1.5);

  // ─── Fin ──────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    pid242Box().opacity(0, 0.5),
    pid2Box().opacity(0, 0.5),
    pid3Box().opacity(0, 0.5),
    nsWall().opacity(0, 0.5),
    lineNs1().opacity(0, 0.5),
    lineNs2().opacity(0, 0.5),
    captionRef().opacity(0, 0.5),
    pid1Box().opacity(0, 0.5),
    pid42Box().opacity(0, 0.5),
    pid87Box().opacity(0, 0.5),
    pid156Box().opacity(0, 0.5),
    lineToP42().opacity(0, 0.5),
    lineToP87().opacity(0, 0.5),
    lineToP156().opacity(0, 0.5),
    lineTo242().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
