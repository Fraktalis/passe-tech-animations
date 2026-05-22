import {makeScene2D, Layout, Rect, Txt, Grid} from '@motion-canvas/2d';
import {createRef, createSignal, all, sequence, waitFor, waitUntil} from '@motion-canvas/core';
import {easeInOutCubic} from '@motion-canvas/core/lib/tweening';
import {DiagramNode, DiagramEdge, Zone} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // Constantes de position pour les slots (utilisées dans les signaux animables)
  const V131_Y  = view.height() * -0.14;
  const V132_Y  = view.height() *  0.02;
  const V1311_Y = view.height() *  0.18;

  // ── Signaux animables ─────────────────────────────────────────────────────
  const latestBadgeY = createSignal(V131_Y);  // badge glisse entre les versions
  const pullCount    = createSignal(0);        // compteur pulls en temps réel

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();

  // Beat 1 — trois images :latest
  const imgNginxRef  = createRef<DiagramNode>();
  const imgUbuntuRef = createRef<DiagramNode>();
  const imgNodeRef   = createRef<DiagramNode>();

  // Beat 2 — registre + latest qui glisse
  const registryZoneRef = createRef<Zone>();
  const slot131Ref      = createRef<DiagramNode>();
  const slot132Ref      = createRef<DiagramNode>();
  const slot1311Ref     = createRef<DiagramNode>();
  const latestBadgeRef  = createRef<Rect>();
  const latestArrowRef  = createRef<DiagramEdge>();
  const pushNotifRef    = createRef<Txt>();

  // Beat 3 — typosquatting + pull count
  const officialNodeRef = createRef<DiagramNode>();
  const fakeNodeRef     = createRef<DiagramNode>();
  const pullCountTxtRef = createRef<Txt>();

  // Beat 4 — supply chain LiteLLM
  const pypiNodeRef     = createRef<DiagramNode>();
  const containerRef    = createRef<DiagramNode>();
  const infectedEdgeRef = createRef<DiagramEdge>();
  const cleanNoteRef    = createRef<Txt>();

  // ── Scène ─────────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />
      <Grid
        key="grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        spacing={() => vW() * 0.04}
        stroke={PALETTE.cream + '15'}
        lineWidth={1}
        opacity={0}
      />

      {/* ── Beat 1 : trois images :latest ─────────────────────────────── */}

      <DiagramNode
        key="img-nginx"
        ref={imgNginxRef}
        preset="container"
        label="nginx:latest"
        sublabel="15M+ pulls / semaine"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.17}
        height={() => vH() * 0.26}
        x={() => vW() * -0.30}
        y={() => vH() * -0.05}
        opacity={0}
      />
      <DiagramNode
        key="img-ubuntu"
        ref={imgUbuntuRef}
        preset="container"
        label="ubuntu:latest"
        sublabel="6M+ pulls / semaine"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.17}
        height={() => vH() * 0.26}
        x={0}
        y={() => vH() * -0.05}
        opacity={0}
      />
      <DiagramNode
        key="img-node"
        ref={imgNodeRef}
        preset="container"
        label="node:latest"
        sublabel="12M+ pulls / semaine"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.17}
        height={() => vH() * 0.26}
        x={() => vW() * 0.30}
        y={() => vH() * -0.05}
        opacity={0}
      />

      {/* ── Beat 2 : registre + badge latest glissant ─────────────────── */}

      <Zone
        key="registry-zone"
        ref={registryZoneRef}
        preset="network"
        label="REGISTRY"
        width={() => vW() * 0.60}
        height={() => vH() * 0.80}
        x={0}
        y={0}
        opacity={0}
      />

      {/* Slots de version — trois pushs chronologiques */}
      <DiagramNode
        key="slot-131"
        ref={slot131Ref}
        preset="file"
        label="mon_image:1.31"
        sublabel="sha256:7f3a…"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.26}
        height={() => vH() * 0.17}
        x={() => vW() * -0.14}
        y={() => vH() * -0.14}
        opacity={0}
      />
      <DiagramNode
        key="slot-132"
        ref={slot132Ref}
        preset="file"
        label="mon_image:1.32"
        sublabel="sha256:b92d…"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.26}
        height={() => vH() * 0.17}
        x={() => vW() * -0.14}
        y={() => vH() * 0.02}
        opacity={0}
      />
      <DiagramNode
        key="slot-1311"
        ref={slot1311Ref}
        preset="file"
        label="mon_image:1.31.1"
        sublabel="sha256:c47e…"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.26}
        height={() => vH() * 0.17}
        x={() => vW() * -0.14}
        y={() => vH() * 0.18}
        opacity={0}
      />

      {/* Badge "latest" — position Y pilotée par signal → glissement animable */}
      <Rect
        key="latest-badge"
        ref={latestBadgeRef}
        width={() => vW() * 0.10}
        height={() => vH() * 0.08}
        fill={PALETTE.amber + '22'}
        stroke={PALETTE.amber}
        lineWidth={2}
        radius={6}
        x={() => vW() * 0.18}
        y={() => latestBadgeY()}
        opacity={0}
      >
        <Txt
          key="latest-badge-label"
          text="latest"
          fill={PALETTE.amber}
          fontSize={() => vW() * 0.013}
          fontFamily="DM Mono, monospace"
          fontWeight={700}
        />
      </Rect>

      {/* Flèche réactive — from/to lisent latestBadgeY() → suit le badge */}
      <DiagramEdge
        key="latest-arrow"
        ref={latestArrowRef}
        from={() => [vW() * 0.13, latestBadgeY()]}
        to={() =>   [vW() * -0.01, latestBadgeY()]}
        edgeDirection="uni"
        edgeStyle="solid"
        stroke={PALETTE.amber}
        lineWidth={2}
        end={0}
        opacity={0}
      />

      {/* Notification de push — texte swap entre les deux pushes */}
      <Txt
        key="push-notif"
        ref={pushNotifRef}
        text="↑  docker push mon_image:1.32"
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.013}
        fontFamily="DM Mono, monospace"
        x={0}
        y={() => vH() * -0.34}
        opacity={0}
      />

      {/* ── Beat 3 : typosquatting ─────────────────────────────────────── */}

      <DiagramNode
        key="official-node"
        ref={officialNodeRef}
        preset="container"
        label="library/nginx"
        sublabel="officielle · vérifiée"
        color={PALETTE.dsGreen}
        initialState="success"
        iconName="logos:nginx"
        width={() => vW() * 0.20}
        height={() => vH() * 0.30}
        x={() => vW() * -0.24}
        y={() => vH() * -0.05}
        opacity={0}
      />
      <DiagramNode
        key="fake-node"
        ref={fakeNodeRef}
        preset="container"
        label="nilux-optimized"
        sublabel="anonyme"
        color={PALETTE.rose}
        initialState="error"
        iconName="lucide:skull"
        width={() => vW() * 0.20}
        height={() => vH() * 0.30}
        x={() => vW() * 0.24}
        y={() => vH() * -0.05}
        opacity={0}
      />

      {/* Compteur de pulls animé */}
      <Txt
        key="pull-count"
        ref={pullCountTxtRef}
        text={() => `${Math.round(pullCount())} pulls`}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.020}
        fontFamily="DM Mono, monospace"
        fontWeight={700}
        x={() => vW() * 0.24}
        y={() => vH() * 0.21}
        opacity={0}
      />

      {/* ── Beat 4 : supply chain LiteLLM ─────────────────────────────── */}

      <DiagramNode
        key="pypi-node"
        ref={pypiNodeRef}
        preset="org"
        label="PyPI — litellm"
        sublabel="mars 2026"
        color={PALETTE.amber}
        initialState="idle"
        iconName="lucide:package"
        width={() => vW() * 0.20}
        height={() => vH() * 0.26}
        x={() => vW() * -0.26}
        y={0}
        opacity={0}
      />
      <DiagramNode
        key="build-container"
        ref={containerRef}
        preset="container"
        label="votre image"
        sublabel="pip install litellm"
        color={PALETTE.cyan}
        initialState="idle"
        width={() => vW() * 0.20}
        height={() => vH() * 0.26}
        x={() => vW() * 0.14}
        y={0}
        opacity={0}
      />
      <DiagramEdge
        key="infected-edge"
        ref={infectedEdgeRef}
        from={() => [vW() * -0.16, 0]}
        to={() =>   [vW() *  0.04, 0]}
        edgeDirection="uni"
        edgeStyle="animated"
        stroke={PALETTE.rose}
        end={0}
        opacity={0}
      />
      <Txt
        key="clean-note"
        ref={cleanNoteRef}
        text="images officielles LiteLLM : dépendances épinglées → propres"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.013}
        fontFamily="DM Sans, sans-serif"
        x={0}
        y={() => vH() * 0.36}
        opacity={0}
      />
    </Layout>
  );

  // ── Beat 1 — Trois images :latest ──────────────────────────────────────────
  yield* waitUntil('showImages');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    sequence(0.2,
      imgNginxRef().opacity(1, 0.35),
      imgUbuntuRef().opacity(1, 0.35),
      imgNodeRef().opacity(1, 0.35),
    ),
  );

  // ── Beat 2a — Registre + mon_image:1.31 active ────────────────────────────
  yield* waitUntil('showRegistry');
  yield* all(
    imgNginxRef().opacity(0, 0.3),
    imgUbuntuRef().opacity(0, 0.3),
    imgNodeRef().opacity(0, 0.3),
  );
  yield* registryZoneRef().opacity(1, 0.4);
  yield* slot131Ref().opacity(1, 0.35);
  yield* slot131Ref().setState('active', 0.15);
  yield* latestBadgeRef().opacity(1, 0.35);
  latestArrowRef().opacity(1);
  yield* latestArrowRef().end(1, 0.4, easeInOutCubic);
  yield* waitFor(0.8);

  // ── Beat 2b — Push mon_image:1.32, latest glisse ──────────────────────────
  yield* waitUntil('showPush');
  yield* pushNotifRef().opacity(1, 0.3);
  yield* slot132Ref().opacity(1, 0.35);
  yield* waitFor(0.35);
  yield* all(
    latestBadgeY(V132_Y, 0.6, easeInOutCubic),
    slot131Ref().setState('idle', 0.3),
    slot132Ref().setState('active', 0.3),
  );
  yield* pushNotifRef().opacity(0, 0.25);
  yield* waitFor(0.6);

  // ── Beat 2c — Push mon_image:1.31.1 (patch), latest re-glisse ────────────
  yield* waitUntil('showThirdPush');
  yield* pushNotifRef().opacity(0, 0);
  pushNotifRef().text('↑  docker push mon_image:1.31.1');
  yield* pushNotifRef().opacity(1, 0.3);
  yield* slot1311Ref().opacity(1, 0.35);
  yield* waitFor(0.35);
  yield* all(
    latestBadgeY(V1311_Y, 0.6, easeInOutCubic),
    slot132Ref().setState('idle', 0.3),
    slot1311Ref().setState('active', 0.3),
  );
  yield* pushNotifRef().opacity(0, 0.3);

  // ── Beat 3 — Typosquatting ─────────────────────────────────────────────────
  yield* waitUntil('showTyposquat');
  yield* all(
    registryZoneRef().opacity(0, 0.4),
    slot131Ref().opacity(0, 0.3),
    slot132Ref().opacity(0, 0.3),
    slot1311Ref().opacity(0, 0.3),
    latestBadgeRef().opacity(0, 0.3),
    latestArrowRef().opacity(0, 0.3),
  );
  yield* sequence(0.2,
    officialNodeRef().opacity(1, 0.35),
    fakeNodeRef().opacity(1, 0.35),
  );
  yield* pullCountTxtRef().opacity(1, 0.3);
  yield* pullCount(5000, 1.2, easeInOutCubic);

  // ── Beat 4 — Supply chain LiteLLM ─────────────────────────────────────────
  yield* waitUntil('showLitellm');
  yield* all(
    officialNodeRef().opacity(0, 0.3),
    fakeNodeRef().opacity(0, 0.3),
    pullCountTxtRef().opacity(0, 0.3),
  );
  yield* sequence(0.15,
    pypiNodeRef().opacity(1, 0.35),
    containerRef().opacity(1, 0.35),
  );
  yield* waitFor(0.3);
  yield* pypiNodeRef().setState('error', 0.08);  // empoisonnement — brutal intentionnel
  infectedEdgeRef().opacity(1);
  yield* infectedEdgeRef().end(1, 0.6, easeInOutCubic);
  yield* containerRef().setState('error', 0.08);
  yield* waitFor(0.4);
  yield* cleanNoteRef().opacity(1, 0.4);
  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    pypiNodeRef().opacity(0, 0.3),
    containerRef().opacity(0, 0.3),
    infectedEdgeRef().opacity(0, 0.3),
    cleanNoteRef().opacity(0, 0.3),
  );
});
