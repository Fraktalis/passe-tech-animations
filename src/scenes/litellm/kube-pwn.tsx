// litellm/kube-pwn.tsx
// CUT - séquence Kubernetes en 5 étapes
// ① Détection token  ② Aspiration secrets  ③ Déploiement alpine
// ④ Montage host FS  ⑤ Persistance sysmon

import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
import {
  all,
  chain,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:     '#0D1117',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    cream:  '#F9F9F6',
    ghost:  '#484F58',
    term:   '#161B22',
    blue:   '#58A6FF',
    danger: '#F85149',
  };

  // Step panel - x center of the 5 step boxes
  const SX = -0.275;
  // Step y centers - evenly spaced
  const SY = [-0.21, -0.105, 0.0, 0.105, 0.21] as const;
  const SW = 0.395; // step box width (vW fraction)
  const SH = 0.096; // step box height (vH fraction)

  // Cluster panel - right side
  const CX = 0.275; // cluster center x

  // glow signals per step (0 = dim, 1 = active)
  const g0 = createSignal(0), g1 = createSignal(0), g2 = createSignal(0);
  const g3 = createSignal(0), g4 = createSignal(0);

  // ──────────────────────────────────────────────────────
  // REFS
  // ──────────────────────────────────────────────────────
  const grid  = createRef<Grid>();
  const title = createRef<Txt>();
  const sub   = createRef<Txt>();

  // Step boxes (left panel)
  const s0 = createRef<Rect>(), s1 = createRef<Rect>(), s2 = createRef<Rect>();
  const s3 = createRef<Rect>(), s4 = createRef<Rect>();

  // Cluster elements (right panel)
  const clusterBox    = createRef<Rect>();
  const kubeSystemBox = createRef<Rect>();
  const kubeSystemLbl = createRef<Txt>();
  const hostLayer     = createRef<Rect>();
  const hostLayerLbl  = createRef<Txt>();

  // 3 worker "slot" labels inside HOST (hidden initially, shown in step 5)
  const hostSysmon0   = createRef<Txt>();
  const hostSysmon1   = createRef<Txt>();
  const hostSysmon2   = createRef<Txt>();

  // Dynamic elements activated by steps
  // Step 1 - service account token badge
  const tokenBadge    = createRef<Rect>();

  // Step 2 - secrets indicator
  const secretsBadge  = createRef<Rect>();

  // Step 3 - 3 alpine pods inside kube-system
  const pod0 = createRef<Rect>(), pod1 = createRef<Rect>(), pod2 = createRef<Rect>();

  // Step 4 - mount arrows from pods down to HOST layer
  const mArr0 = createRef<Line>(), mArr1 = createRef<Line>(), mArr2 = createRef<Line>();
  const hostHighlight = createRef<Rect>(); // overlay on HOST layer

  // Connector: active step → cluster (dotted line from step box right edge to cluster)
  const stepConnector = createRef<Line>();

  // Step 5 - siphon packets (2 waves × 3 nodes = 6 Rects)
  // Wave A labels: .ssh · .aws · .env
  const pac0a = createRef<Rect>(), pac1a = createRef<Rect>(), pac2a = createRef<Rect>();
  // Wave B labels: db pass · .kube · tokens
  const pac0b = createRef<Rect>(), pac1b = createRef<Rect>(), pac2b = createRef<Rect>();
  // Exfil arrow + C2 badge (exits cluster right side)
  const exfilArrow = createRef<Line>();
  const exfilBadge = createRef<Rect>();

  // ──────────────────────────────────────────────────────
  // GEOMETRY helpers
  // ──────────────────────────────────────────────────────
  // Cluster outer box: x=CX, y=0.02, w=0.41vW, h=0.60vH
  const CLUS_Y  =  0.02;
  const CLUS_W  =  0.41;
  const CLUS_H  =  0.60;

  // kube-system namespace: inside cluster, upper half
  // center y = CLUS_Y - 0.10
  const KS_Y    = CLUS_Y - 0.100;
  const KS_W    = 0.355;
  const KS_H    = 0.215;

  // HOST layer: inside cluster, lower area
  // center y = CLUS_Y + 0.215
  const HOST_Y  = CLUS_Y + 0.215;
  const HOST_W  = 0.355;
  const HOST_H  = 0.110;

  // 3 pod positions (x relative to view center, y = kube-system center)
  const POD_Y   = KS_Y;
  const POD_XS  = [CX - 0.095, CX, CX + 0.095] as const;
  const POD_W   = 0.075;
  const POD_H   = 0.085;

  // Token badge position - top-right inside cluster
  const TOK_X   = CX + 0.155;
  const TOK_Y   = CLUS_Y - 0.245;

  // Secrets badge - center of kube-system
  const SEC_X   = CX + 0.06;
  const SEC_Y   = KS_Y - 0.01;

  // Mount arrow y: from pod bottom to HOST layer top
  // pod bottom: POD_Y + POD_H/2 = KS_Y + 0.0425
  // HOST top: HOST_Y - HOST_H/2 = CLUS_Y + 0.215 - 0.055 = CLUS_Y + 0.16
  const MARR_Y0 = KS_Y  + POD_H / 2 + 0.005;  // slightly below pod
  const MARR_Y1 = HOST_Y - HOST_H / 2 - 0.005; // slightly above HOST

  // ──────────────────────────────────────────────────────
  // SCENE TREE
  // ──────────────────────────────────────────────────────
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        ref={grid}
        width={'100%'} height={'100%'}
        stroke={C.ghost} opacity={0} lineWidth={1}
        spacing={() => vW() * 0.055} zIndex={-1}
      />

      {/* ── TITLE ── */}
      <Txt
        ref={title}
        text="ESCALADE KUBERNETES"
        fill={C.cream}
        fontSize={() => vW() * 0.038}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.415}
        opacity={0}
      />
      <Txt
        ref={sub}
        text="quand un service account token traîne dans l'environnement"
        fill={C.ghost}
        fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * -0.345}
        opacity={0}
      />

      {/* ══════════════════════ STEP BOXES (left) ══════════════════════ */}

      {/* Step 0 - Détection */}
      <Rect
        ref={s0}
        x={() => vW() * SX} y={() => vH() * SY[0]}
        width={() => vW() * SW} height={() => vH() * SH}
        fill={`${C.ghost}10`} stroke={C.ghost} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        shadowColor={C.jaune} shadowBlur={() => g0() * vW() * 0.025}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="① DÉTECTION" fill={C.ghost} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="token service account trouvé dans l'env" fill={C.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* Step 1 - Aspiration secrets */}
      <Rect
        ref={s1}
        x={() => vW() * SX} y={() => vH() * SY[1]}
        width={() => vW() * SW} height={() => vH() * SH}
        fill={`${C.blue}10`} stroke={`${C.blue}60`} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        shadowColor={C.blue} shadowBlur={() => g1() * vW() * 0.025}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="② ASPIRATION SECRETS" fill={C.blue} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="tous les secrets · toutes les namespaces · tout" fill={C.blue} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* Step 2 - Déploiement */}
      <Rect
        ref={s2}
        x={() => vW() * SX} y={() => vH() * SY[2]}
        width={() => vW() * SW} height={() => vH() * SH}
        fill={`${C.rose}10`} stroke={`${C.rose}60`} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        shadowColor={C.rose} shadowBlur={() => g2() * vW() * 0.025}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="③ DÉPLOIEMENT" fill={C.rose} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="alpine:latest · kube-system · chaque nœud" fill={C.rose} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* Step 3 - Montage host FS */}
      <Rect
        ref={s3}
        x={() => vW() * SX} y={() => vH() * SY[3]}
        width={() => vW() * SW} height={() => vH() * SH}
        fill={`${C.jaune}10`} stroke={`${C.jaune}60`} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        shadowColor={C.jaune} shadowBlur={() => g3() * vW() * 0.025}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="④ MONTAGE HOST FS" fill={C.jaune} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="pas le container - la vraie machine physique" fill={C.jaune} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* Step 4 - Persistance */}
      <Rect
        ref={s4}
        x={() => vW() * SX} y={() => vH() * SY[4]}
        width={() => vW() * SW} height={() => vH() * SH}
        fill={`${C.danger}10`} stroke={`${C.danger}60`} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        shadowColor={C.danger} shadowBlur={() => g4() * vW() * 0.03}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="⑤ PERSISTANCE" fill={C.danger} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="sysmon.py + systemd sur chaque machine physique" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* ══════════════════════ CLUSTER DIAGRAM (right) ══════════════════════ */}

      {/* Outer cluster box */}
      <Rect
        ref={clusterBox}
        x={() => vW() * CX} y={() => vH() * CLUS_Y}
        width={() => vW() * CLUS_W} height={() => vH() * CLUS_H}
        fill={`${C.ghost}06`} stroke={C.ghost} lineWidth={1}
        radius={() => vW() * 0.007} opacity={0}
      />
      <Txt
        text="KUBERNETES CLUSTER"
        fill={C.ghost}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * CX}
        y={() => vH() * (CLUS_Y - CLUS_H / 2 + 0.025)}
        opacity={0}
      />

      {/* kube-system namespace box */}
      <Rect
        ref={kubeSystemBox}
        x={() => vW() * CX} y={() => vH() * KS_Y}
        width={() => vW() * KS_W} height={() => vH() * KS_H}
        fill={`${C.rose}08`} stroke={`${C.rose}50`} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
      />
      <Txt
        ref={kubeSystemLbl}
        text="kube-system"
        fill={`${C.rose}80`}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * CX}
        y={() => vH() * (KS_Y - KS_H / 2 + 0.022)}
        opacity={0}
      />

      {/* HOST layer box */}
      <Rect
        ref={hostLayer}
        x={() => vW() * CX} y={() => vH() * HOST_Y}
        width={() => vW() * HOST_W} height={() => vH() * HOST_H}
        fill={`${C.ghost}08`} stroke={`${C.ghost}50`} lineWidth={1}
        radius={() => vW() * 0.004} opacity={0}
      />
      <Txt
        ref={hostLayerLbl}
        text="HOST FILESYSTEM  (machines physiques)"
        fill={`${C.ghost}80`}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * CX}
        y={() => vH() * HOST_Y}
        opacity={0}
      />

      {/* ── Step 1 - token badge ── */}
      <Rect
        ref={tokenBadge}
        x={() => vW() * TOK_X} y={() => vH() * TOK_Y}
        width={() => vW() * 0.11} height={() => vH() * 0.065}
        fill={`${C.jaune}14`} stroke={C.jaune} lineWidth={2}
        radius={() => vW() * 0.004} opacity={0}
        shadowColor={C.jaune} shadowBlur={() => vW() * 0.018}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={4}
      >
        <Txt text="TOKEN" fill={C.jaune} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="service account" fill={C.jaune} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* ── Step 2 - secrets badge ── */}
      <Rect
        ref={secretsBadge}
        x={() => vW() * SEC_X} y={() => vH() * SEC_Y}
        width={() => vW() * 0.11} height={() => vH() * 0.065}
        fill={`${C.blue}14`} stroke={C.blue} lineWidth={2}
        radius={() => vW() * 0.004} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={4}
      >
        <Txt text="SECRETS" fill={C.blue} fontSize={() => vW() * 0.013} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="all namespaces" fill={C.blue} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      {/* ── Step 3 - alpine pods inside kube-system ── */}
      <Rect
        ref={pod0}
        x={() => vW() * POD_XS[0]} y={() => vH() * POD_Y}
        width={() => vW() * POD_W} height={() => vH() * POD_H}
        fill={`${C.rose}14`} stroke={C.rose} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={3}
      >
        <Txt text="alpine" fill={C.rose} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
        <Txt text=":latest" fill={C.rose} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>
      <Rect
        ref={pod1}
        x={() => vW() * POD_XS[1]} y={() => vH() * POD_Y}
        width={() => vW() * POD_W} height={() => vH() * POD_H}
        fill={`${C.rose}14`} stroke={C.rose} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={3}
      >
        <Txt text="alpine" fill={C.rose} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
        <Txt text=":latest" fill={C.rose} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>
      <Rect
        ref={pod2}
        x={() => vW() * POD_XS[2]} y={() => vH() * POD_Y}
        width={() => vW() * POD_W} height={() => vH() * POD_H}
        fill={`${C.rose}14`} stroke={C.rose} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={3}
      >
        <Txt text="alpine" fill={C.rose} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
        <Txt text=":latest" fill={C.rose} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* ── Step 4 - mount arrows ── */}
      <Line
        ref={mArr0}
        stroke={C.jaune} lineWidth={2} opacity={0}
        endArrow arrowSize={7}
        lineDash={[8, 4]}
        points={() => [
          [vW() * POD_XS[0], vH() * MARR_Y0],
          [vW() * POD_XS[0], vH() * MARR_Y1],
        ]}
        end={0}
      />
      <Line
        ref={mArr1}
        stroke={C.jaune} lineWidth={2} opacity={0}
        endArrow arrowSize={7}
        lineDash={[8, 4]}
        points={() => [
          [vW() * POD_XS[1], vH() * MARR_Y0],
          [vW() * POD_XS[1], vH() * MARR_Y1],
        ]}
        end={0}
      />
      <Line
        ref={mArr2}
        stroke={C.jaune} lineWidth={2} opacity={0}
        endArrow arrowSize={7}
        lineDash={[8, 4]}
        points={() => [
          [vW() * POD_XS[2], vH() * MARR_Y0],
          [vW() * POD_XS[2], vH() * MARR_Y1],
        ]}
        end={0}
      />

      {/* HOST highlight overlay (activated step 4) */}
      <Rect
        ref={hostHighlight}
        x={() => vW() * CX} y={() => vH() * HOST_Y}
        width={() => vW() * HOST_W} height={() => vH() * HOST_H}
        fill={'#00000000'} stroke={C.jaune} lineWidth={3}
        radius={() => vW() * 0.004} opacity={0}
        shadowColor={C.jaune} shadowBlur={() => vW() * 0.022}
      />

      {/* ── Step 5 - siphon packets: wave A ── */}
      {/* All start at HOST_Y, rise toward kube-system while fading */}
      <Rect
        ref={pac0a}
        x={() => vW() * POD_XS[0]} y={() => vH() * HOST_Y}
        width={() => vW() * 0.068} height={() => vH() * 0.048}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt text="~/.ssh" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={600} />
      </Rect>
      <Rect
        ref={pac1a}
        x={() => vW() * POD_XS[1]} y={() => vH() * HOST_Y}
        width={() => vW() * 0.068} height={() => vH() * 0.048}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt text="~/.aws" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={600} />
      </Rect>
      <Rect
        ref={pac2a}
        x={() => vW() * POD_XS[2]} y={() => vH() * HOST_Y}
        width={() => vW() * 0.068} height={() => vH() * 0.048}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt text=".env" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={600} />
      </Rect>

      {/* ── Step 5 - siphon packets: wave B ── */}
      <Rect
        ref={pac0b}
        x={() => vW() * POD_XS[0]} y={() => vH() * HOST_Y}
        width={() => vW() * 0.068} height={() => vH() * 0.048}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt text="db pass" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={600} />
      </Rect>
      <Rect
        ref={pac1b}
        x={() => vW() * POD_XS[1]} y={() => vH() * HOST_Y}
        width={() => vW() * 0.068} height={() => vH() * 0.048}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt text=".kube" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={600} />
      </Rect>
      <Rect
        ref={pac2b}
        x={() => vW() * POD_XS[2]} y={() => vH() * HOST_Y}
        width={() => vW() * 0.068} height={() => vH() * 0.048}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt text="tokens" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={600} />
      </Rect>

      {/* ── Step 5 - exfil arrow (exits cluster right side) ── */}
      {/* From HOST right edge → past cluster wall → off-screen right */}
      <Line
        ref={exfilArrow}
        stroke={C.danger} lineWidth={2} lineDash={[8, 4]} opacity={0}
        endArrow arrowSize={9}
        shadowColor={C.danger} shadowBlur={() => vW() * 0.015}
        points={() => [
          [vW() * (CX + HOST_W / 2),          vH() * HOST_Y],
          [vW() * (CX + CLUS_W / 2 + 0.06),   vH() * HOST_Y],
        ]}
        end={0}
      />
      {/* C2 badge - at the screen-right edge, partially visible */}
      <Rect
        ref={exfilBadge}
        x={() => vW() * 0.488} y={() => vH() * HOST_Y}
        width={() => vW() * 0.085} height={() => vH() * 0.06}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.004} opacity={0}
        shadowColor={C.danger} shadowBlur={() => vW() * 0.02}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={3}
      >
        <Txt text="C2" fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="litellm.cloud" fill={C.danger} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.75} />
      </Rect>

      {/* ── Step 5 - sysmon labels on HOST ──
           Positioned outside the HOST box (below it) to avoid overlap
           with the siphon packets that animate inside the HOST area.       */}
      <Txt
        ref={hostSysmon0}
        text="sysmon.py + systemd"
        fill={C.danger}
        fontSize={() => vW() * 0.013}
        fontFamily={'DM Mono, monospace'}
        fontWeight={600}
        x={() => vW() * CX}
        y={() => vH() * (HOST_Y + HOST_H / 2 + 0.028)}
        opacity={0}
      />
      <Txt
        ref={hostSysmon1}
        text="3 nœuds compromis"
        fill={C.danger}
        fontSize={() => vW() * 0.011}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * CX}
        y={() => vH() * (HOST_Y + HOST_H / 2 + 0.048)}
        opacity={0}
      />
    </Layout>,
  );

  // ──────────────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* grid().opacity(0.12, 0.8);
  yield* all(
    title().opacity(1, 0.55),
    sub().opacity(1, 0.45),
  );
  yield* waitFor(0.5);

  // Reveal cluster diagram skeleton
  yield* waitUntil('clusterReveal');
  yield* clusterBox().opacity(1, 0.5);
  // kube-system + HOST layer
  yield* all(
    kubeSystemBox().opacity(1, 0.4),
    kubeSystemLbl().opacity(1, 0.4),
    hostLayer().opacity(1, 0.4),
    hostLayerLbl().opacity(1, 0.4),
  );
  yield* waitFor(0.4);

  // Reveal all step boxes (dimmed) + cluster label
  yield* sequence(0.08,
    s0().opacity(1, 0.35),
    s1().opacity(1, 0.35),
    s2().opacity(1, 0.35),
    s3().opacity(1, 0.35),
    s4().opacity(1, 0.35),
  );
  yield* waitFor(0.5);

  // ── STEP 1 - Détection ──
  yield* waitUntil('step1');
  // Step box activates (glow)
  yield* chain(g0(1.8, 0.25, easeOutCubic), g0(1.0, 0.4, easeInOutCubic));
  // Token badge appears in cluster
  yield* tokenBadge().opacity(1, 0.45);
  yield* waitFor(1.2);
  g0(0);

  // ── STEP 2 - Aspiration secrets ──
  yield* waitUntil('step2');
  yield* chain(g1(1.8, 0.25, easeOutCubic), g1(1.0, 0.4, easeInOutCubic));
  // kube-system border gets more prominent, secrets badge appears
  yield* all(
    kubeSystemBox().stroke(C.blue, 0.4),
    secretsBadge().opacity(1, 0.4),
  );
  yield* waitFor(1.2);
  g1(0);

  // ── STEP 3 - Déploiement alpine ──
  yield* waitUntil('step3');
  yield* chain(g2(1.8, 0.25, easeOutCubic), g2(1.0, 0.4, easeInOutCubic));
  // Fade out secrets badge - replaced visually by the pods
  yield* secretsBadge().opacity(0, 0.3);
  // 3 alpine pod boxes appear inside kube-system
  yield* sequence(0.12,
    pod0().opacity(1, 0.35),
    pod1().opacity(1, 0.35),
    pod2().opacity(1, 0.35),
  );
  yield* waitFor(1.2);
  g2(0);

  // ── STEP 4 - Montage host FS ──
  yield* waitUntil('step4');
  yield* chain(g3(1.8, 0.25, easeOutCubic), g3(1.0, 0.4, easeInOutCubic));
  // Mount arrows draw downward from pods to HOST layer
  yield* all(
    mArr0().opacity(1, 0.1),
    mArr1().opacity(1, 0.1),
    mArr2().opacity(1, 0.1),
  );
  yield* all(
    mArr0().end(1, 0.5, easeInOutCubic),
    mArr1().end(1, 0.5, easeInOutCubic),
    mArr2().end(1, 0.5, easeInOutCubic),
  );
  // HOST layer lights up
  yield* all(
    hostLayer().stroke(C.jaune, 0.4),
    hostHighlight().opacity(1, 0.4),
  );
  yield* waitFor(1.2);
  g3(0);

  // ── STEP 5 - Persistance ──
  yield* waitUntil('step5');
  yield* chain(g4(2.2, 0.25, easeOutCubic), g4(1.2, 0.5, easeInOutCubic));
  // HOST layer turns danger red
  yield* all(
    hostLayer().stroke(C.danger, 0.4),
    hostHighlight().stroke(C.danger, 0.4),
    hostHighlight().shadowColor(C.danger, 0.4),
    hostLayerLbl().fill(C.danger, 0.4),
  );
  // sysmon labels appear
  yield* all(
    hostSysmon0().opacity(1, 0.45),
    hostSysmon1().opacity(1, 0.4),
  );
  // HOST label fades, sysmon label replaces
  yield* hostLayerLbl().opacity(0, 0.3);

  // ── Siphon animation - wave A (.ssh · .aws · .env) ──
  // First, clear the sysmon labels from the HOST interior so they don't
  // overlap with the siphon packets that animate in the same HOST area
  yield* all(
    hostSysmon0().opacity(0, 0.25),
    hostSysmon1().opacity(0, 0.25),
  );
  yield* waitFor(0.25);
  // Packets materialise inside the HOST layer
  yield* sequence(0.12,
    pac0a().opacity(1, 0.2),
    pac1a().opacity(1, 0.2),
    pac2a().opacity(1, 0.2),
  );
  yield* waitFor(0.25);
  // Packets rise along the mount paths and fade out simultaneously
  yield* sequence(0.14,
    all(
      pac0a().y(vH() * KS_Y, 0.62, easeInOutCubic),
      pac0a().opacity(0, 0.62),
    ),
    all(
      pac1a().y(vH() * KS_Y, 0.62, easeInOutCubic),
      pac1a().opacity(0, 0.62),
    ),
    all(
      pac2a().y(vH() * KS_Y, 0.62, easeInOutCubic),
      pac2a().opacity(0, 0.62),
    ),
  );
  yield* waitFor(0.15);

  // ── Siphon animation - wave B (db pass · .kube · tokens) ──
  yield* sequence(0.12,
    pac0b().opacity(1, 0.2),
    pac1b().opacity(1, 0.2),
    pac2b().opacity(1, 0.2),
  );
  yield* waitFor(0.25);
  yield* sequence(0.14,
    all(
      pac0b().y(vH() * KS_Y, 0.62, easeInOutCubic),
      pac0b().opacity(0, 0.62),
    ),
    all(
      pac1b().y(vH() * KS_Y, 0.62, easeInOutCubic),
      pac1b().opacity(0, 0.62),
    ),
    all(
      pac2b().y(vH() * KS_Y, 0.62, easeInOutCubic),
      pac2b().opacity(0, 0.62),
    ),
  );
  yield* waitFor(0.3);

  // Sysmon labels reappear below HOST once siphon waves are done
  yield* all(
    hostSysmon0().opacity(1, 0.35),
    hostSysmon1().opacity(1, 0.3),
  );
  yield* waitFor(0.4);

  // ── Exfil arrow exits the cluster toward C2 ──
  yield* waitUntil('exfil');
  yield* exfilBadge().opacity(1, 0.35);
  yield* exfilArrow().opacity(1, 0.1);
  yield* exfilArrow().end(1, 0.55, easeOutCubic);
  yield* waitFor(2.0);

  // ─── End ───
  yield* waitUntil('endScene');
  yield* all(
    grid().opacity(0, 0.5),
    title().opacity(0, 0.5),
    sub().opacity(0, 0.4),
    s0().opacity(0, 0.4), s1().opacity(0, 0.4), s2().opacity(0, 0.4),
    s3().opacity(0, 0.4), s4().opacity(0, 0.4),
    clusterBox().opacity(0, 0.4),
    kubeSystemBox().opacity(0, 0.4),
    hostLayer().opacity(0, 0.4),
    hostHighlight().opacity(0, 0.35),
    tokenBadge().opacity(0, 0.3),
    secretsBadge().opacity(0, 0.3),
    pod0().opacity(0, 0.3), pod1().opacity(0, 0.3), pod2().opacity(0, 0.3),
    mArr0().opacity(0, 0.3), mArr1().opacity(0, 0.3), mArr2().opacity(0, 0.3),
    hostSysmon0().opacity(0, 0.3), hostSysmon1().opacity(0, 0.3),
    exfilArrow().opacity(0, 0.3),
    exfilBadge().opacity(0, 0.3),
  );
});
