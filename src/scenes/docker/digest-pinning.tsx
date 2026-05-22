import {makeScene2D, Layout, Rect, Txt, Grid} from '@motion-canvas/2d';
import {createRef, createSignal, all, sequence, waitFor, waitUntil, cancel} from '@motion-canvas/core';
import {easeInOutCubic} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge, Zone, Callout, ConnectionArrow, Terminal} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const TAG_Y1 = view.height() * -0.11;
  const TAG_Y2 = view.height() *  0.13;
  const tagBadgeY = createSignal(TAG_Y1);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  // Beat 1 — tag mutable
  const registryZoneRef = createRef<Zone>();
  const imgV1Ref        = createRef<DiagramNode>();
  const imgV2Ref        = createRef<DiagramNode>();
  const tagBadgeRef     = createRef<Rect>();
  const tagArrowRef     = createRef<DiagramEdge>();
  const attackNoteRef   = createRef<Txt>();

  // Beat 2a — digest immutable (concept)
  const imgDigestRef     = createRef<DiagramNode>();
  const digestBadgeRef   = createRef<Rect>();
  const digestArrowRef   = createRef<DiagramEdge>();
  const digestCalloutRef = createRef<Callout>();
  const digestCArrowRef  = createRef<ConnectionArrow>();
  const digestCmdRef     = createRef<Txt>();

  // Beat 2b — avalanche visuel : signal → hash
  const fileTotoRef  = createRef<DiagramNode>();
  const fileTitiRef  = createRef<DiagramNode>();
  const beamTotoRef  = createRef<Rect>();
  const beamTitiRef  = createRef<Rect>();
  const hashTotoRef  = createRef<Txt>();
  const hashTitiRef  = createRef<Txt>();

  // Beat 3 — FROM digest dans Dockerfile
  const badFromPanelRef  = createRef<Rect>();
  const goodFromPanelRef = createRef<Rect>();
  const badFromLblRef    = createRef<Txt>();
  const goodFromLblRef   = createRef<Txt>();

  // Beat 4 — scan Trivy/Grype
  const terminalRef = createRef<Terminal>();

  // ── Scene tree ────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />
      <Grid
        key="bg-grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        spacing={() => vW() * 0.04}
        stroke={PALETTE.cream + '15'}
        lineWidth={1}
        opacity={0}
      />

      {/* ── Beat 1 : tag mutable ──────────────────────────────────────────── */}

      <Zone
        key="registry-zone"
        ref={registryZoneRef}
        preset="network"
        label="REGISTRY"
        width={() => vW() * 0.44}
        height={() => vH() * 0.65}
        x={() => vW() * -0.04}
        y={0}
        opacity={0}
      />
      <DiagramNode
        key="img-v1"
        ref={imgV1Ref}
        preset="file"
        label="nginx:1.31"
        sublabel="sha256:7f3a819c…"
        color={PALETTE.dsGreen}
        initialState="success"
        width={() => vW() * 0.20}
        height={() => vH() * 0.24}
        x={() => vW() * -0.13}
        y={() => vH() * -0.11}
        opacity={0}
      />
      <DiagramNode
        key="img-v2"
        ref={imgV2Ref}
        preset="file"
        label="nginx:1.31"
        sublabel="sha256:c8a1f03d…"
        color={PALETTE.dsRose}
        initialState="error"
        iconName="lucide:skull"
        width={() => vW() * 0.20}
        height={() => vH() * 0.24}
        x={() => vW() * -0.13}
        y={() => vH() * 0.13}
        opacity={0}
      />
      <Rect
        key="tag-badge"
        ref={tagBadgeRef}
        width={() => vW() * 0.115}
        height={() => vH() * 0.080}
        fill={PALETTE.amber + '22'}
        stroke={PALETTE.amber}
        lineWidth={2}
        radius={6}
        x={() => vW() * 0.285}
        y={() => tagBadgeY()}
        opacity={0}
      >
        <Txt
          key="tag-badge-label"
          text="nginx:1.31"
          fill={PALETTE.amber}
          fontSize={() => vW() * 0.012}
          fontFamily="JetBrains Mono, DM Mono, monospace"
          fontWeight={700}
        />
      </Rect>
      <DiagramEdge
        key="tag-arrow"
        ref={tagArrowRef}
        from={() => [vW() * 0.228, tagBadgeY()]}
        to={() =>   [vW() * -0.020, tagBadgeY()]}
        edgeDirection="uni"
        edgeStyle="solid"
        stroke={PALETTE.amber}
        lineWidth={2}
        end={0}
        opacity={0}
      />
      <Txt
        key="attack-note"
        ref={attackNoteRef}
        text="⚠  même tag, image différente — votre pull tire du malware"
        fill={PALETTE.dsRose}
        fontSize={() => vW() * 0.012}
        fontFamily="DM Sans, sans-serif"
        x={0}
        y={() => vH() * 0.39}
        opacity={0}
      />

      {/* ── Beat 2a : digest immutable (concept) ──────────────────────────── */}

      <DiagramNode
        key="img-digest"
        ref={imgDigestRef}
        preset="file"
        label="nginx@sha256:7f3a"
        sublabel="image immuable"
        color={PALETTE.dsGreen}
        initialState="success"
        width={() => vW() * 0.22}
        height={() => vH() * 0.26}
        x={0}
        y={() => vH() * -0.04}
        opacity={0}
      />
      <Rect
        key="digest-badge"
        ref={digestBadgeRef}
        width={() => vW() * 0.145}
        height={() => vH() * 0.080}
        fill={PALETTE.dsGreen + '1A'}
        stroke={PALETTE.dsGreen}
        lineWidth={2}
        radius={6}
        x={() => vW() * 0.35}
        y={() => vH() * -0.04}
        opacity={0}
      >
        <Txt
          key="digest-badge-label"
          text="sha256:7f3a…"
          fill={PALETTE.dsGreen}
          fontSize={() => vW() * 0.011}
          fontFamily="JetBrains Mono, DM Mono, monospace"
          fontWeight={700}
        />
      </Rect>
      <DiagramEdge
        key="digest-arrow"
        ref={digestArrowRef}
        from={() => [vW() * 0.278, vH() * -0.04]}
        to={() =>   [vW() * 0.113, vH() * -0.04]}
        edgeDirection="uni"
        edgeStyle="solid"
        stroke={PALETTE.dsGreen}
        lineWidth={2}
        end={0}
        opacity={0}
      />
      <Txt
        key="digest-cmd"
        ref={digestCmdRef}
        text="docker pull nginx@sha256:7f3a819c…"
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.013}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        x={0}
        y={() => vH() * 0.30}
        opacity={0}
      />
      <Callout
        key="digest-callout"
        ref={digestCalloutRef}
        title="Hash = empreinte du contenu"
        body="Si l'image change, le hash change · Insubstituable"
        color={PALETTE.dsGreen}
        width={() => vW() * 0.26}
        height={() => vH() * 0.14}
        x={() => vW() * 0.355}
        y={() => vH() * 0.12}
        opacity={0}
      />
      <ConnectionArrow
        key="digest-callout-arrow"
        ref={digestCArrowRef}
        from={() => [vW() * 0.240, vH() * 0.05]}
        to={() =>   [vW() * 0.113, vH() * 0.01]}
        stroke={PALETTE.dsGreen}
        lineWidth={1.5}
        end={0}
        opacity={0}
      />

      {/* ── Beat 2b : signal → hash (avalanche, visuel pur) ───────────────── */}

      <DiagramNode
        key="file-toto"
        ref={fileTotoRef}
        preset="file"
        label="toto"
        sublabel="fichier A"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.17}
        height={() => vH() * 0.26}
        x={() => vW() * -0.20}
        y={() => vH() * -0.07}
        opacity={0}
      />
      <DiagramNode
        key="file-titi"
        ref={fileTitiRef}
        preset="file"
        label="titi"
        sublabel="fichier B"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.17}
        height={() => vH() * 0.26}
        x={() => vW() * 0.20}
        y={() => vH() * -0.07}
        opacity={0}
      />

      {/* Faisceaux — lisent le fichier de haut en bas, comme une fonction de hash */}
      <Rect
        key="beam-toto"
        ref={beamTotoRef}
        width={() => vW() * 0.17}
        height={3}
        fill={PALETTE.dsGreen}
        shadowBlur={10}
        shadowColor={PALETTE.dsGreen + '99'}
        x={() => vW() * -0.20}
        y={() => vH() * -0.22}
        opacity={0}
      />
      <Rect
        key="beam-titi"
        ref={beamTitiRef}
        width={() => vW() * 0.17}
        height={3}
        fill={PALETTE.dsGreen}
        shadowBlur={10}
        shadowColor={PALETTE.dsGreen + '99'}
        x={() => vW() * 0.20}
        y={() => vH() * -0.22}
        opacity={0}
      />

      {/* Résultats — hashes plausibles, totalement différents */}
      <Txt
        key="hash-toto"
        ref={hashTotoRef}
        text="sha256:9c86a8e1d4f2c7b3a0e51982634…"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.011}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        x={() => vW() * -0.20}
        y={() => vH() * 0.19}
        opacity={0}
      />
      <Txt
        key="hash-titi"
        ref={hashTitiRef}
        text="sha256:9c86a8e1d4f2c7b3a0e51982634…"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.011}
        fontFamily="JetBrains Mono, DM Mono, monospace"
        x={() => vW() * 0.20}
        y={() => vH() * 0.19}
        opacity={0}
      />

      {/* ── Beat 3 : FROM digest dans Dockerfile ──────────────────────────── */}

      <Rect
        key="bad-from-panel"
        ref={badFromPanelRef}
        width={() => vW() * 0.37}
        height={() => vH() * 0.29}
        layout={true}
        direction="column"
        justifyContent="center"
        alignItems="start"
        gap={() => vH() * 0.010}
        paddingLeft={() => vW() * 0.016}
        fill={PALETTE.amber + '18'}
        stroke={PALETTE.amber}
        lineWidth={2}
        radius={8}
        x={() => vW() * -0.22}
        y={() => vH() * -0.05}
        opacity={0}
      >
        <Txt key="bf-header" text="# RISQUÉ"          fill={PALETTE.amber}   fontSize={() => vW() * 0.009} fontFamily="JetBrains Mono, DM Mono, monospace" />
        <Txt key="bf-cmd"    text="FROM node:20"       fill={PALETTE.cream}   fontSize={() => vW() * 0.018} fontFamily="JetBrains Mono, DM Mono, monospace" fontWeight={700} />
        <Txt key="bf-note"   text="↑  tag mutable"     fill={PALETTE.amber}   fontSize={() => vW() * 0.010} fontFamily="DM Sans, sans-serif" />
      </Rect>

      <Rect
        key="good-from-panel"
        ref={goodFromPanelRef}
        width={() => vW() * 0.37}
        height={() => vH() * 0.29}
        layout={true}
        direction="column"
        justifyContent="center"
        alignItems="start"
        gap={() => vH() * 0.010}
        paddingLeft={() => vW() * 0.016}
        fill={PALETTE.dsGreen + '18'}
        stroke={PALETTE.dsGreen}
        lineWidth={2}
        radius={8}
        x={() => vW() * 0.22}
        y={() => vH() * -0.05}
        opacity={0}
      >
        <Txt key="gf-header" text="# CORRECT"                fill={PALETTE.dsGreen} fontSize={() => vW() * 0.009} fontFamily="JetBrains Mono, DM Mono, monospace" />
        <Txt key="gf-cmd"    text="FROM node@sha256:[DIGEST]" fill={PALETTE.cream}   fontSize={() => vW() * 0.013} fontFamily="JetBrains Mono, DM Mono, monospace" fontWeight={700} />
        <Txt key="gf-note"   text="↑  digest immuable"        fill={PALETTE.dsGreen} fontSize={() => vW() * 0.010} fontFamily="DM Sans, sans-serif" />
      </Rect>

      <Txt
        key="bad-from-lbl"
        ref={badFromLblRef}
        text="tag peut être écrasé sur le registre"
        fill={PALETTE.amber}
        fontSize={() => vW() * 0.011}
        fontFamily="DM Sans, sans-serif"
        x={() => vW() * -0.22}
        y={() => vH() * 0.135}
        opacity={0}
      />
      <Txt
        key="good-from-lbl"
        ref={goodFromLblRef}
        text="image cryptographiquement épinglée"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.011}
        fontFamily="DM Sans, sans-serif"
        x={() => vW() * 0.22}
        y={() => vH() * 0.135}
        opacity={0}
      />

      {/* ── Beat 4 : scan Trivy / Grype ───────────────────────────────────── */}

      <Terminal
        key="terminal-scan"
        ref={terminalRef}
        title="bash"
        fontSize={() => vW() * 0.0095}
        maxLines={10}
        width={() => vW() * 0.68}
        height={() => vH() * 0.50}
        x={0}
        y={() => vH() * 0.07}
        opacity={0}
      />
    </Layout>
  );

  // ── Beat 1a — Registre + image saine ──────────────────────────────────────
  yield* waitUntil('showTagDanger');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    registryZoneRef().opacity(1, 0.4),
  );
  yield* imgV1Ref().opacity(1, 0.35);
  yield* waitFor(0.4);
  yield* tagBadgeRef().opacity(1, 0.30);
  tagArrowRef().opacity(1);
  yield* tagArrowRef().end(1, 0.40, easeInOutCubic);
  yield* waitFor(0.6);

  // ── Beat 1b — Attaquant push nginx:1.31 → badge glisse vers imgV2 ─────────
  yield* waitUntil('showAttackerPush');
  yield* imgV2Ref().opacity(1, 0.35);
  yield* waitFor(0.3);
  yield* all(
    tagBadgeY(TAG_Y2, 0.6, easeInOutCubic),
    imgV1Ref().setState('idle', 0.3),
  );
  yield* attackNoteRef().opacity(1, 0.30);
  yield* waitFor(0.8);

  // ── Beat 2a — Digest immutable (concept) ──────────────────────────────────
  yield* waitUntil('showDigest');
  yield* all(
    registryZoneRef().opacity(0, 0.30),
    imgV1Ref().opacity(0, 0.25),
    imgV2Ref().opacity(0, 0.25),
    tagBadgeRef().opacity(0, 0.25),
    tagArrowRef().opacity(0, 0.25),
    attackNoteRef().opacity(0, 0.25),
  );
  yield* imgDigestRef().opacity(1, 0.35);
  yield* waitFor(0.3);
  yield* digestBadgeRef().opacity(1, 0.30);
  digestArrowRef().opacity(1);
  yield* digestArrowRef().end(1, 0.40, easeInOutCubic);
  yield* digestCmdRef().opacity(1, 0.30);
  yield* waitFor(0.4);
  yield* digestCalloutRef().opacity(1, 0.25);
  digestCArrowRef().opacity(1);
  yield* digestCArrowRef().end(1, 0.40, easeInOutCubic);
  yield* waitFor(0.8);

  // ── Beat 2b — Signal → hash : l'avalanche en visuel ──────────────────────
  yield* waitUntil('showHashChange');
  yield* all(
    imgDigestRef().opacity(0, 0.25),
    digestBadgeRef().opacity(0, 0.25),
    digestArrowRef().opacity(0, 0.25),
    digestCmdRef().opacity(0, 0.25),
    digestCalloutRef().opacity(0, 0.25),
    digestCArrowRef().opacity(0, 0.25),
  );
  // Deux fichiers aux noms similaires, côte à côte
  yield* sequence(0.15,
    fileTotoRef().opacity(1, 0.30),
    fileTitiRef().opacity(1, 0.30),
  );

    yield* all(
    hashTotoRef().opacity(1, 0.10),
    hashTitiRef().opacity(1, 0.10),
  );

  yield* waitFor(0.4);
  // Les faisceaux tombent simultanément — lisent chaque fichier de haut en bas
  yield* all(
    beamTotoRef().opacity(1, 0.05),
    beamTitiRef().opacity(1, 0.05),
  );
  yield* all(
    beamTotoRef().y(vH() * 0.08, 0.55, easeInOutCubic),
    beamTitiRef().y(vH() * 0.08, 0.55, easeInOutCubic),
  );
  // Faisceaux disparaissent, hashes matérialisés dessous — totalement différents

  yield* all(
    beamTotoRef().opacity(0, 0.10),
    beamTitiRef().opacity(0, 0.10),
    hashTitiRef().text("sha256:f74b2c910d853a6e7b23f541c09…", 1.2)
  );
  yield* waitFor(1.2);

  // ── Beat 3 — FROM digest dans Dockerfile ─────────────────────────────────
  yield* waitUntil('showDockerfile');
  yield* all(
    fileTotoRef().opacity(0, 0.25),
    fileTitiRef().opacity(0, 0.25),
    hashTotoRef().opacity(0, 0.20),
    hashTitiRef().opacity(0, 0.20),
  );
  yield* sequence(0.2,
    badFromPanelRef().opacity(1, 0.35),
    goodFromPanelRef().opacity(1, 0.35),
  );
  yield* sequence(0.15,
    badFromLblRef().opacity(1, 0.30),
    goodFromLblRef().opacity(1, 0.30),
  );
  yield* waitFor(1.2);

  // ── Beat 4 — Scan Trivy ───────────────────────────────────────────────────
  yield* waitUntil('showScan');
  yield* all(
    badFromPanelRef().opacity(0, 0.25),
    goodFromPanelRef().opacity(0, 0.25),
    badFromLblRef().opacity(0, 0.20),
    goodFromLblRef().opacity(0, 0.20),
  );
  yield* terminalRef().opacity(1, 0.40);
  const blinkHandle = yield terminalRef().startBlink();
  yield* terminalRef().typewrite('trivy image mon-app:latest', {prompt: true, charDelay: 0.04});
  yield* waitFor(0.25);
  cancel(blinkHandle);
  yield* terminalRef().hideCursor();
  terminalRef().writeLine('', 'ghost');
  terminalRef().writeLine('Total: 3 (HIGH: 2, CRITICAL: 1)');
  terminalRef().writeLine('');
  terminalRef().writeLine('┌─────────────────┬─────────────┬──────────┬──────────────────┐', 'ghost');
  terminalRef().writeLine('│ CVE-2024-11053  │ openssl     │ CRITICAL │ fix: 3.3.2       │');
  terminalRef().writeLine('│ CVE-2024-6387   │ openssh     │ HIGH     │ fix: 9.8p1       │');
  terminalRef().writeLine('│ CVE-2024-8522   │ libcurl     │ HIGH     │ fix: 8.9.0       │');
  terminalRef().writeLine('└─────────────────┴─────────────┴──────────┴──────────────────┘', 'ghost');
  terminalRef().writeLine('# grype mon-app:latest  ← même résultat, open source', 'ghost');
  yield* waitFor(0.5);
  // Highlight ligne CRITICAL (0=cmd, 1=vide, 2=Total, 3=vide, 4=border, 5=CRITICAL)
  yield* terminalRef().line(5)!.fill(PALETTE.dsRose, 0.25);
  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    terminalRef().opacity(0, 0.3),
  );
});
