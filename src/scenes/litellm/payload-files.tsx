// litellm/payload-files.tsx
// CUT A - liste animée des fichiers aspirés (Étape 1)
// CUT B - chiffrement + exfil vers models.litellm.cloud (Étape 2)
// CUT C - porte dérobée sysmon.py + systemd (Étape 3)

import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
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

  // ── file categories ──────────────────────────────
  // [bullet color, left text, right label]
  const FILES = [
    { color: C.blue,   path: '~/.ssh/id_rsa  ·  ~/.ssh/config',           tag: 'clés SSH'              },
    { color: C.vert,   path: '.env  (tous vos projets)',                   tag: 'variables d\'env'      },
    { color: C.jaune,  path: '~/.aws/credentials',                         tag: 'Amazon Web Services'   },
    { color: C.jaune,  path: '~/.config/gcloud/  ·  ~/.azure/',            tag: 'GCP · Azure'           },
    { color: C.rose,   path: '~/.kube/config',                             tag: 'Kubernetes'            },
    { color: C.danger, path: 'DATABASE_URL  ·  *.conf  ·  db secrets',    tag: 'bases de données'      },
    { color: C.ghost,  path: '~/.bash_history  ·  ~/.zsh_history',        tag: 'historique shell'      },
    { color: C.cream,  path: 'wallets  ·  keystore  ·  seed phrases',     tag: 'crypto'                },
    { color: C.rose,   path: '~/.gitconfig',                               tag: 'tokens GitHub en clair'},
  ] as const;

  // ──────────────────────────────────────────────────────
  // REFS
  // ──────────────────────────────────────────────────────
  const grid    = createRef<Grid>();
  const title   = createRef<Txt>();

  // Phase 1 - file rows (9 individual refs)
  const r0 = createRef<Layout>(), r1 = createRef<Layout>(), r2 = createRef<Layout>();
  const r3 = createRef<Layout>(), r4 = createRef<Layout>(), r5 = createRef<Layout>();
  const r6 = createRef<Layout>(), r7 = createRef<Layout>(), r8 = createRef<Layout>();
  const rows = [r0, r1, r2, r3, r4, r5, r6, r7, r8];

  // Special annotation for .gitconfig row
  const gitconfigNote = createRef<Txt>();

  // Summary badge
  const summaryBadge = createRef<Rect>();

  // Phase 2 - encryption chain
  const archiveBox   = createRef<Rect>();
  const encryptBox   = createRef<Rect>();
  const domainBox    = createRef<Rect>();
  const arr2a        = createRef<Line>();
  const arr2b        = createRef<Line>();
  const p2Note       = createRef<Txt>();

  // Phase 3 - backdoor
  const sysmonPath   = createRef<Rect>();
  const systemdBadge = createRef<Rect>();
  const killSwitch   = createRef<Rect>();

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

      {/* ── TITLE (shared, text swaps between phases) ── */}
      <Txt
        ref={title}
        text="ÉTAPE 1 - ASPIRATION"
        fill={C.cream}
        fontSize={() => vW() * 0.038}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.41}
        opacity={0}
      />

      {/* ══════════════════════ PHASE 1 ══════════════════════ */}
      {/* Rows positioned independently - column Layout containers collapse to
          zero when children have opacity=0, so we use absolute y per row.
          Step: 0.055 vH · range: -0.225 → +0.215                           */}

      <Layout ref={r0} x={0} y={() => vH() * -0.225} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.blue} radius={4} />
        <Txt text="~/.ssh/id_rsa  ·  ~/.ssh/config" fill={C.blue} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- clés SSH" fill={`${C.blue}70`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r1} x={0} y={() => vH() * -0.170} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.vert} radius={4} />
        <Txt text=".env  (tous vos projets)" fill={C.vert} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- variables d'env" fill={`${C.vert}70`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r2} x={0} y={() => vH() * -0.115} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.jaune} radius={4} />
        <Txt text="~/.aws/credentials" fill={C.jaune} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- Amazon Web Services" fill={`${C.jaune}70`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r3} x={0} y={() => vH() * -0.060} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.jaune} radius={4} />
        <Txt text="~/.config/gcloud/  ·  ~/.azure/" fill={C.jaune} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- GCP · Azure" fill={`${C.jaune}70`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r4} x={0} y={() => vH() * -0.005} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.rose} radius={4} />
        <Txt text="~/.kube/config" fill={C.rose} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- Kubernetes" fill={`${C.rose}70`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r5} x={0} y={() => vH() * 0.050} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.danger} radius={4} />
        <Txt text="DATABASE_URL  ·  *.conf  ·  db secrets" fill={C.danger} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- bases de données" fill={`${C.danger}70`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r6} x={0} y={() => vH() * 0.105} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.ghost} radius={4} />
        <Txt text="~/.bash_history  ·  ~/.zsh_history" fill={C.ghost} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- historique shell" fill={`${C.ghost}80`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r7} x={0} y={() => vH() * 0.160} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.cream} radius={4} />
        <Txt text="wallets  ·  keystore  ·  seed phrases" fill={C.cream} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- crypto" fill={`${C.cream}70`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      <Layout ref={r8} x={0} y={() => vH() * 0.215} width={() => vW() * 0.85} direction={'row'} alignItems={'center'} justifyContent={'start'} gap={80} opacity={0}>
        <Rect width={9} height={9} fill={C.danger} radius={4} />
        <Txt text="~/.gitconfig" fill={C.danger} fontSize={() => vW() * 0.017} fontFamily={'DM Mono, monospace'} />
        <Txt text="- tokens GitHub en clair" fill={`${C.danger}B0`} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Layout>

      {/* .gitconfig note - "souvent oublié dans les audits" */}
      <Txt
        ref={gitconfigNote}
        text="souvent oublié dans les audits sécu - peut contenir des tokens GitHub en clair"
        fill={C.danger}
        fontSize={() => vW() * 0.014}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * 0.44}
        opacity={0}
      />

      {/* Summary badge */}
      <Rect
        ref={summaryBadge}
        x={0} y={() => vH() * 0.395}
        width={() => vW() * 0.38} height={() => vH() * 0.075}
        fill={`${C.danger}10`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={4}
      >
        <Txt text="9 CATÉGORIES" fill={C.danger} fontSize={() => vW() * 0.018} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="aspiration en cours…" fill={C.danger} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} opacity={0.8} />
      </Rect>

      {/* ══════════════════════ PHASE 2 - CHIFFREMENT ══════════════════════ */}

      {/* archive.tar.gz */}
      <Rect
        ref={archiveBox}
        x={() => vW() * -0.33} y={() => vH() * 0.055}
        width={() => vW() * 0.17} height={() => vH() * 0.145}
        fill={`${C.ghost}12`} stroke={C.ghost} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={7}
      >
        <Txt text="archive" fill={C.ghost} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text=".tar.gz" fill={C.ghost} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="9 catégories" fill={C.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      <Line
        ref={arr2a}
        stroke={C.ghost} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * -0.235, vH() * 0.055],
          [vW() * -0.125, vH() * 0.055],
        ]}
        end={0}
      />

      {/* RSA chiffré */}
      <Rect
        ref={encryptBox}
        x={0} y={() => vH() * 0.055}
        width={() => vW() * 0.17} height={() => vH() * 0.145}
        fill={`${C.jaune}12`} stroke={C.jaune} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={7}
      >
        <Txt text="RSA" fill={C.jaune} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="chiffré" fill={C.jaune} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="clé publique codée en dur" fill={C.jaune} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.65} />
      </Rect>

      <Line
        ref={arr2b}
        stroke={C.danger} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * 0.095, vH() * 0.055],
          [vW() * 0.21, vH() * 0.055],
        ]}
        end={0}
      />

      {/* models.litellm.cloud */}
      <Rect
        ref={domainBox}
        x={() => vW() * 0.335} y={() => vH() * 0.055}
        width={() => vW() * 0.21} height={() => vH() * 0.145}
        fill={`${C.danger}12`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={7}
      >
        <Txt text="models.litellm" fill={C.danger} fontSize={() => vW() * 0.015} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text=".cloud" fill={C.danger} fontSize={() => vW() * 0.015} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="ressemble à l'infra légitime" fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.65} />
      </Rect>

      <Txt
        ref={p2Note}
        text="sans la clé privée de l'attaquant - personne d'autre ne peut déchiffrer"
        fill={C.ghost}
        fontSize={() => vW() * 0.015}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * 0.175}
        opacity={0}
      />

      {/* ══════════════════════ PHASE 3 - PERSISTANCE ══════════════════════ */}

      {/* sysmon.py file path */}
      <Rect
        ref={sysmonPath}
        x={() => vW() * -0.13} y={() => vH() * -0.11}
        width={() => vW() * 0.5} height={() => vH() * 0.1}
        fill={C.term} stroke={C.ghost} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="~/.config/sysmon/sysmon.py" fill={C.rose} fontSize={() => vW() * 0.02} fontFamily={'DM Mono, monospace'} fontWeight={600} />
        <Txt text="porte dérobée" fill={C.ghost} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* systemd service */}
      <Rect
        ref={systemdBadge}
        x={() => vW() * -0.13} y={() => vH() * 0.045}
        width={() => vW() * 0.5} height={() => vH() * 0.1}
        fill={C.term} stroke={C.blue} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="[systemd]  sysmon.service" fill={C.blue} fontSize={() => vW() * 0.018} fontFamily={'DM Mono, monospace'} fontWeight={600} />
        <Txt text="relance automatique - nom choisi pour passer pour du monitoring" fill={C.ghost} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* kill switch */}
      <Rect
        ref={killSwitch}
        x={() => vW() * -0.13} y={() => vH() * 0.2}
        width={() => vW() * 0.5} height={() => vH() * 0.1}
        fill={`${C.vert}0C`} stroke={C.vert} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="kill switch  →  youtube.com" fill={C.vert} fontSize={() => vW() * 0.018} fontFamily={'DM Mono, monospace'} fontWeight={600} />
        <Txt text="si le C2 renvoie cette URL : exit() immédiat" fill={C.ghost} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Rect>
    </Layout>,
  );

  // ──────────────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* grid().opacity(0.12, 0.8);
  yield* title().opacity(1, 0.55);
  yield* waitFor(0.4);

  // ─── PHASE 1 - file list ───
  yield* waitUntil('aspiration');
  yield* sequence(0.09,
    r0().opacity(1, 0.35),
    r1().opacity(1, 0.35),
    r2().opacity(1, 0.35),
    r3().opacity(1, 0.35),
    r4().opacity(1, 0.35),
    r5().opacity(1, 0.35),
    r6().opacity(1, 0.35),
    r7().opacity(1, 0.35),
    r8().opacity(1, 0.35),
  );
  yield* waitFor(0.5);

  // .gitconfig note appears after a beat
  yield* waitUntil('gitconfigNote');
  yield* gitconfigNote().opacity(1, 0.45);
  yield* waitFor(0.7);

  // Summary badge
  yield* waitUntil('scanComplete');
  yield* summaryBadge().opacity(1, 0.5);
  yield* waitFor(1.8);

  // ─── PHASE 1 → 2 transition ───
  yield* waitUntil('chiffrement');
  yield* all(
    ...rows.map(r => r().opacity(0, 0.3)),
    gitconfigNote().opacity(0, 0.25),
    summaryBadge().opacity(0, 0.25),
  );
  // Title swap
  yield* title().opacity(0, 0.2);
  title().text('ÉTAPE 2 - CHIFFREMENT');
  yield* title().opacity(1, 0.35);
  yield* waitFor(0.3);

  // Archive → encrypted → domain chain
  yield* archiveBox().opacity(1, 0.4);
  yield* waitFor(0.2);
  yield* arr2a().opacity(1, 0.1);
  yield* arr2a().end(1, 0.3, easeOutCubic);
  yield* encryptBox().opacity(1, 0.4);
  yield* waitFor(0.2);
  yield* arr2b().opacity(1, 0.1);
  yield* arr2b().end(1, 0.3, easeOutCubic);
  yield* domainBox().opacity(1, 0.45);
  yield* waitFor(0.5);
  yield* p2Note().opacity(1, 0.45);
  yield* waitFor(2.0);

  // ─── PHASE 2 → 3 transition ───
  yield* waitUntil('persistance');
  yield* all(
    archiveBox().opacity(0, 0.3),
    arr2a().opacity(0, 0.25),
    encryptBox().opacity(0, 0.3),
    arr2b().opacity(0, 0.25),
    domainBox().opacity(0, 0.3),
    p2Note().opacity(0, 0.25),
  );
  // Title swap
  yield* title().opacity(0, 0.2);
  title().text('ÉTAPE 3 - PERSISTANCE');
  yield* title().opacity(1, 0.35);
  yield* waitFor(0.35);

  yield* sysmonPath().opacity(1, 0.45);
  yield* waitFor(0.6);
  yield* systemdBadge().opacity(1, 0.45);
  yield* waitFor(0.7);
  yield* killSwitch().opacity(1, 0.45);
  yield* waitFor(2.5);

  // ─── End ───
  yield* waitUntil('endScene');
  yield* all(
    grid().opacity(0, 0.5),
    title().opacity(0, 0.5),
    sysmonPath().opacity(0, 0.4),
    systemdBadge().opacity(0, 0.4),
    killSwitch().opacity(0, 0.4),
  );
});
