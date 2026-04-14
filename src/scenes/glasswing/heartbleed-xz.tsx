// glasswing/heartbleed-xz.tsx
// Beat 1 — Heartbleed : le paquet heartbeat qui ment sur sa taille
// Beat 2 — Heartbleed : la bande mémoire qui saigne (64 KB)
// Beat 3 — XZ Utils : le graphe de dépendances empoisonné
// Beat 4 — XZ Utils : 2 ans de commits légitimes, un seul rouge
// Beat 5 — XZ Utils : les 500ms qui remontent jusqu'à liblzma

import {makeScene2D} from '@motion-canvas/2d';
import {Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:       '#0D1117',
    rose:     '#FF3E6C',
    vert:     '#6DFF8A',
    jaune:    '#FFE14D',
    cream:    '#F9F9F6',
    ghost:    '#484F58',
    blue:     '#58A6FF',
    danger:   '#F85149',
    terminal: '#161B22',
  };

  // ── Shared ────────────────────────────────────
  const gridRef      = createRef<Grid>();
  const flashOverlay = createRef<Rect>();

  // ── Beat 1 | Heartbleed protocol ─────────────
  const hbTitle         = createRef<Txt>();
  const clientBox       = createRef<Rect>();
  const serverBox       = createRef<Rect>();
  const wireRef         = createRef<Line>();
  const packetNormal    = createRef<Layout>();
  const pnLenField      = createRef<Rect>();
  const responseNormal  = createRef<Rect>();
  const packetEvil      = createRef<Layout>();
  const peLenField      = createRef<Rect>();
  const responseEvil    = createRef<Rect>();
  const punchlineTxt    = createRef<Txt>();

  // ── Beat 2 | Memory strip ─────────────────────
  const memTitle     = createRef<Txt>();
  const memStrip     = createRef<Rect>();
  const memCursor    = createRef<Rect>();
  const memLegitZone = createRef<Txt>();
  const memPrivZone  = createRef<Txt>();
  const leak1        = createRef<Rect>();
  const leak2        = createRef<Rect>();
  const leak3        = createRef<Rect>();
  const leak4        = createRef<Rect>();

  // ── Beat 3 | XZ dependency graph ─────────────
  const xzTitle         = createRef<Txt>();
  const nodeXZ          = createRef<Rect>();
  const nodeSystemd     = createRef<Rect>();
  const nodeSshd        = createRef<Rect>();
  const nodeClient      = createRef<Rect>();
  const lineXZSd        = createRef<Line>();
  const lineSdSshd      = createRef<Line>();
  const lineSshdClient  = createRef<Line>();
  const xzPunchline     = createRef<Txt>();

  // ── Beat 4 | Commit grid ─────────────────────
  const COLS = 20;
  const ROWS = 4;
  const BDOOR = 72; // index du commit backdoor
  const cells = Array.from({length: COLS * ROWS}, () => createRef<Rect>());
  const gridContainer  = createRef<Layout>();
  const commitTitle    = createRef<Txt>();
  const commitSub      = createRef<Txt>();
  const bdoorLabel     = createRef<Layout>();

  // ── Beat 5 | Discovery ───────────────────────
  const discTitle    = createRef<Txt>();
  const termBox      = createRef<Rect>();
  const flameSSH     = createRef<Rect>();
  const flameRSA     = createRef<Rect>();
  const flameLzma    = createRef<Rect>();
  const labelSSH     = createRef<Txt>();
  const labelRSA     = createRef<Txt>();
  const labelLzma    = createRef<Txt>();
  const weekBanner   = createRef<Rect>();

  // ════════════════════════════════════════════
  // SCENE TREE
  // ════════════════════════════════════════════
  view.add(
    <Layout key="root">
      <Rect key="bg" width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        key="grid" ref={gridRef}
        width={'100%'} height={'100%'}
        stroke={C.ghost} lineWidth={1} opacity={0}
        spacing={() => vW() * 0.055} zIndex={-1}
      />
      <Rect key="flash" ref={flashOverlay}
        width={'100%'} height={'100%'} fill={C.danger} opacity={0} zIndex={20}
      />

      {/* ══ BEAT 1 | HEARTBLEED PROTOCOL ══ */}
      <Txt key="hb-title" ref={hbTitle}
        text="HEARTBLEED · LE MENSONGE DE 4 OCTETS"
        fill={C.danger} fontSize={() => vW() * 0.028} fontWeight={800}
        fontFamily={'Space Grotesk'} y={() => vH() * -0.38} opacity={0}
      />

      <Rect key="client-box" ref={clientBox}
        x={() => vW() * -0.37} y={() => vH() * -0.04}
        width={() => vW() * 0.13} height={() => vH() * 0.20}
        fill={`${C.danger}12`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt key="c-icon"     text="◈"           fill={C.danger} fontSize={() => vW() * 0.028} />
        <Txt key="c-label"    text="ATTAQUANT"   fill={C.danger} fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt key="c-sublabel" text="(client TLS)" fill={C.ghost}  fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Rect key="server-box" ref={serverBox}
        x={() => vW() * 0.37} y={() => vH() * -0.04}
        width={() => vW() * 0.13} height={() => vH() * 0.20}
        fill={`${C.vert}10`} stroke={C.vert} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt key="s-icon"     text="◫"           fill={C.vert}  fontSize={() => vW() * 0.028} />
        <Txt key="s-label"    text="SERVEUR"     fill={C.vert}  fontSize={() => vW() * 0.011} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt key="s-sublabel" text="OpenSSL"      fill={C.ghost} fontSize={() => vW() * 0.009} fontFamily={'DM Mono, monospace'} />
      </Rect>

      <Line key="wire" ref={wireRef}
        stroke={C.ghost} lineWidth={2} opacity={0}
        lineDash={[14, 8]}
        points={() => [[vW() * -0.3, vH() * -0.04], [vW() * 0.3, vH() * -0.04]]}
      />

      {/* Paquet normal (CLIENT → SERVER) */}
      <Layout key="packet-normal" ref={packetNormal}
        x={() => vW() * -0.3} y={() => vH() * -0.04}
        direction={'row'} gap={3} opacity={0}
      >
        <Rect key="pn-len" ref={pnLenField}
           y={200} width={() => vW() * 0.065} height={() => vH() * 0.07}
          fill={`${C.vert}35`} stroke={C.vert} lineWidth={2} radius={6}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt key="pn-len-val" text={"len: 4"} fill={C.vert} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={700} />
        </Rect>
        <Rect key="pn-data"
          width={() => vW() * 0.075} height={() => vH() * 0.07}
          fill={`${C.blue}25`} stroke={C.blue} lineWidth={2} radius={6}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt key="pn-data-val" text={'"BIRD"'} fill={C.blue} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={700} />
        </Rect>
      </Layout>

      {/* Réponse normale */}
      <Rect key="resp-normal" ref={responseNormal}
        x={() => vW() * 0.3} y={() => vH() * 0.1}
        width={() => vW() * 0.15} height={() => vH() * 0.065}
        fill={`${C.vert}25`} stroke={C.vert} lineWidth={2} radius={6} opacity={0}
        layout alignItems={'center'} justifyContent={'center'}
      >
        <Txt key="rn-val" text={'"BIRD"  ✓'} fill={C.vert} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} fontWeight={700} />
      </Rect>

      {/* Paquet malveillant */}
      <Layout key="packet-evil" ref={packetEvil}
        x={() => vW() * -0.3} y={() => vH() * -0.04}
        direction={'row'} gap={3} opacity={0}
      >
        <Rect key="pe-len" ref={peLenField}
          y={200} width={() => vW() * 0.065} height={() => vH() * 0.07}
          fill={`${C.danger}35`} stroke={C.danger} lineWidth={2} radius={6}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt key="pe-len-val" text={"len: 65535"} fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} fontWeight={700} />
        </Rect>
        <Rect key="pe-data"
          width={() => vW() * 0.055} height={() => vH() * 0.07}
          fill={`${C.blue}15`} stroke={C.ghost} lineWidth={1} radius={6}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt key="pe-data-val" text={'"HI"'} fill={C.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} />
        </Rect>
      </Layout>

      {/* Réponse malveillante — énorme */}
      <Rect key="resp-evil" ref={responseEvil}
        x={() => vW() * 0.3} y={() => vH() * 0.13}
        width={() => vW() * 0.42} height={() => vH() * 0.065}
        fill={`${C.danger}20`} stroke={C.danger} lineWidth={3} radius={6} opacity={0}
        shadowColor={C.danger} shadowBlur={() => vW() * 0.015}
        layout direction={'row'} alignItems={'center'} justifyContent={'center'} gap={10}
      >
        <Txt key="re-data"  text={'"HI"'} fill={C.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} />
        <Txt key="re-plus"  text={'+'} fill={C.danger} fontSize={() => vW() * 0.014} fontFamily={'DM Mono, monospace'} />
        <Txt key="re-leak"  text={'65 533 B de RAM  ██████████'} fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={700} />
      </Rect>

      <Txt key="punchline" ref={punchlineTxt}
        text={"Un bug d'une ligne. Pas de shellcode — juste une soustraction oubliée."}
        fill={C.ghost} fontSize={() => vW() * 0.014} fontFamily={'DM Mono, monospace'}
        y={() => vH() * 0.35} opacity={0} textAlign={'center'}
        width={() => vW() * 0.72} textWrap
      />

      {/* ══ BEAT 2 | MEMORY STRIP ══ */}
      <Txt key="mem-title" ref={memTitle}
        text="LA RAM QUI SAIGNE"
        fill={C.danger} fontSize={() => vW() * 0.032} fontWeight={800}
        fontFamily={'Space Grotesk'} y={() => vH() * -0.38} opacity={0}
      />

      {/* Bande mémoire horizontale */}
      <Rect key="mem-strip" ref={memStrip}
        y={() => vH() * -0.05}
        width={() => vW() * 0.84} height={() => vH() * 0.14}
        fill={'#00000000'} stroke={C.ghost} lineWidth={1}
        radius={() => vW() * 0.003} opacity={0}
        layout direction={'row'} clip
      >
        {/* Payload légitime — minuscule (2 octets sur 65535) */}
        <Rect key="mem-legit" width={() => vW() * 0.02} height={'100%'} fill={`${C.vert}70`} />
        {/* Zone RAM privée — rouge dégradé */}
        <Rect key="mem-priv" width={() => vW() * 0.82} height={'100%'}
          fill={'#00000000'} layout direction={'row'} gap={2} padding={4}
        >
          {Array.from({length: 28}, (_, i) => (
            <Rect
              key={`cell-${i}`}
              grow={1} height={'100%'}
              fill={
                i < 4  ? `${C.jaune}50` :
                i < 14 ? `${C.danger}38` :
                         `${C.rose}22`
              }
              radius={3}
            />
          ))}
        </Rect>
      </Rect>

      {/* Labels sous la bande */}
      <Txt key="mem-legit-lbl" ref={memLegitZone}
        text={"payload réel (2 B)"}
        fill={C.vert} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.395} y={() => vH() * 0.09} opacity={0}
      />
      <Txt key="mem-priv-lbl" ref={memPrivZone}
        text={"mémoire adjacente → mots de passe · clés TLS · sessions · clés privées"}
        fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.1} y={() => vH() * 0.09} opacity={0}
      />

      {/* Curseur de lecture */}
      <Rect key="mem-cursor" ref={memCursor}
        x={() => vW() * -0.415} y={() => vH() * -0.05}
        width={() => vW() * 0.005} height={() => vH() * 0.15}
        fill={C.cream}
        shadowColor={C.cream} shadowBlur={() => vW() * 0.008}
        opacity={0}
      />

      {/* Blocs qui fuient vers le haut */}
      {([
        [leak1, 'PWD ••••',  C.danger, -0.24],
        [leak2, 'KEY:4f3a',  C.rose,   -0.06],
        [leak3, 'TK:8a92c',  C.danger,  0.12],
        [leak4, 'CERT:...',  C.rose,    0.30],
      ] as const).map(([ref, label, color, xOff], i) => (
        <Rect
          key={`leak-${i}`}
          ref={ref as ReturnType<typeof createRef<Rect>>}
          x={() => vW() * xOff}
          y={() => vH() * -0.05}
          width={() => vW() * 0.11}
          height={() => vH() * 0.065}
          fill={`${color}40`} stroke={color} lineWidth={2}
          radius={() => vW() * 0.004} opacity={0}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt key={`leak-txt-${i}`} text={label as string}
            fill={color} fontSize={() => vW() * 0.011}
            fontFamily={'DM Mono, monospace'} fontWeight={700}
          />
        </Rect>
      ))}

      {/* ══ BEAT 3 | XZ DEPENDENCY GRAPH ══ */}
      <Txt key="xz-title" ref={xzTitle}
        text="XZ UTILS · LA DÉPENDANCE INVISIBLE"
        fill={C.rose} fontSize={() => vW() * 0.028} fontWeight={800}
        fontFamily={'Space Grotesk'} y={() => vH() * -0.38} opacity={0}
      />

      {/* Nœuds : du bas vers le haut */}
      <Rect key="node-xz" ref={nodeXZ}
        y={() => vH() * 0.28}
        width={() => vW() * 0.24} height={() => vH() * 0.12}
        fill={`${C.ghost}14`} stroke={C.ghost} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        shadowColor={'#00000000'} shadowBlur={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt key="xz-nname" text="liblzma"        fill={C.ghost} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt key="xz-nsub"  text="XZ Utils · compression" fill={C.ghost} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      <Rect key="node-sd" ref={nodeSystemd}
        y={() => vH() * 0.10}
        width={() => vW() * 0.24} height={() => vH() * 0.12}
        fill={`${C.blue}10`} stroke={C.blue} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt key="sd-nname" text="libsystemd"     fill={C.blue} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt key="sd-nsub"  text="process manager" fill={C.blue} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      <Rect key="node-sshd" ref={nodeSshd}
        y={() => vH() * -0.08}
        width={() => vW() * 0.24} height={() => vH() * 0.12}
        fill={`${C.vert}10`} stroke={C.vert} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt key="sshd-nname" text="sshd"           fill={C.vert} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt key="sshd-nsub"  text="OpenSSH daemon" fill={C.vert} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      <Rect key="node-client" ref={nodeClient}
        y={() => vH() * -0.26}
        width={() => vW() * 0.24} height={() => vH() * 0.12}
        fill={`${C.cream}08`} stroke={C.cream} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt key="cli-nname" text="SSH client"             fill={C.cream} fontSize={() => vW() * 0.016} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt key="cli-nsub"  text="n'importe qui / internet" fill={C.cream} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} opacity={0.7} />
      </Rect>

      <Line key="line-xz-sd" ref={lineXZSd}
        stroke={C.ghost} lineWidth={2} opacity={0} endArrow arrowSize={10}
        points={() => [[0, vH() * 0.22], [0, vH() * 0.16]]} end={0}
      />
      <Line key="line-sd-sshd" ref={lineSdSshd}
        stroke={C.blue} lineWidth={2} opacity={0} endArrow arrowSize={10}
        points={() => [[0, vH() * 0.04], [0, vH() * -0.02]]} end={0}
      />
      <Line key="line-sshd-cli" ref={lineSshdClient}
        stroke={C.vert} lineWidth={2} opacity={0} endArrow arrowSize={10}
        points={() => [[0, vH() * -0.14], [0, vH() * -0.20]]} end={0}
      />

      <Txt key="xz-punch" ref={xzPunchline}
        text={"Un outil de compression dans votre daemon SSH. Backdoor = RCE root avant authentification."}
        fill={C.danger} fontSize={() => vW() * 0.014} fontFamily={'DM Mono, monospace'}
        y={() => vH() * 0.43} opacity={0} textAlign={'center'}
        width={() => vW() * 0.70} textWrap
      />

      {/* ══ BEAT 4 | COMMIT GRID ══ */}
      <Txt key="commit-title" ref={commitTitle}
        text={"2 ANS DE CONTRIBUTIONS LÉGITIMES"}
        fill={C.cream} fontSize={() => vW() * 0.030} fontWeight={800}
        fontFamily={'Space Grotesk'} y={() => vH() * -0.38} opacity={0}
      />
      <Txt key="commit-sub" ref={commitSub}
        text={'"Jia Tan" · nov. 2021 → fév. 2024'}
        fill={C.ghost} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'}
        y={() => vH() * -0.30} opacity={0}
      />

      <Layout key="grid-wrap" ref={gridContainer} y={() => vH() * 0.04}>
        {cells.map((ref, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const step = vW() * (0.022 + 0.007);
          return (
            <Rect
              key={`cell-${i}`}
              ref={ref}
              x={() => (col - COLS / 2 + 0.5) * vW() * (0.022 + 0.007)}
              y={() => (row - ROWS / 2 + 0.5) * vW() * (0.022 + 0.007)}
              width={() => vW() * 0.022}
              height={() => vW() * 0.022}
              fill={C.vert}
              radius={() => vW() * 0.003}
              opacity={0}
            />
          );
        })}

        {/* Label backdoor (inside container pour zoomer avec la grille) */}
        <Layout key="bdoor-label-wrap" ref={bdoorLabel}
          x={() => {
            const col = BDOOR % COLS;
            return (col - COLS / 2 + 0.5) * vW() * (0.022 + 0.007) + vW() * 0.05;
          }}
          y={() => {
            const row = Math.floor(BDOOR / COLS);
            return (row - ROWS / 2 + 0.5) * vW() * (0.022 + 0.007);
          }}
          opacity={0}
        >
          <Rect key="bdoor-pill"
            
            y={80} x={-50} fill={`${C.danger}25`} stroke={C.danger} lineWidth={1}
            radius={() => vW() * 0.003}
            padding={[4, 10]}
            layout alignItems={'center'}
          >
            <Txt key="bdoor-txt" text={"↑ v5.6.0 · BACKDOOR"}
              fill={C.danger} fontSize={() => vW() * 0.011}
              fontFamily={'DM Mono, monospace'} fontWeight={700}
            />
          </Rect>
        </Layout>
      </Layout>

      {/* ══ BEAT 5 | DISCOVERY ══ */}
      <Txt key="disc-title" ref={discTitle}
        text={"DÉCOUVERTE PAR ACCIDENT"}
        fill={C.cream} fontSize={() => vW() * 0.032} fontWeight={800}
        fontFamily={'Space Grotesk'} y={() => vH() * -0.38} opacity={0}
      />

      {/* Terminal SSH timing */}
      <Rect key="term-box" ref={termBox}
        x={() => vW() * -0.19} y={() => vH() * -0.05}
        width={() => vW() * 0.32} height={() => vH() * 0.26}
        fill={C.terminal} stroke={C.ghost} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} padding={24} gap={12}
      >
        {/* Titlebar */}
        <Rect key="tb-bar"
          width={'100%'} height={() => vH() * 0.032}
          fill={`${C.ghost}30`} radius={6}
          layout direction={'row'} alignItems={'center'} padding={[0, 10]} gap={7}
        >
          <Circle key="dot-r" width={12} height={12} fill={'#F85149'} />
          <Circle key="dot-y" width={12} height={12} fill={'#D29922'} />
          <Circle key="dot-g" width={12} height={12} fill={'#3FB950'} />
        </Rect>
        <Txt key="tb-prompt"   text={"$ time ssh localhost"} fill={C.ghost}  fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} />
        <Txt key="tb-timing"   text={"real    0m0.890s"}     fill={C.danger} fontSize={() => vW() * 0.018} fontFamily={'DM Mono, monospace'} fontWeight={700}
          shadowColor={C.danger} shadowBlur={() => vW() * 0.006}
        />
        <Txt key="tb-expected" text={"attendu : ~0.4s"}      fill={C.ghost}  fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} />
        <Txt key="tb-delta"    text={"Δ +500ms ???"}         fill={C.jaune}  fontSize={() => vW() * 0.016} fontFamily={'DM Mono, monospace'} fontWeight={700} />
      </Rect>

      {/* Flame graph simplifié — barres horizontales empilées */}
      <Rect key="flame-ssh" ref={flameSSH}
        x={() => vW() * 0.19} y={() => vH() * -0.16}
        width={0} height={() => vH() * 0.048}
        fill={`${C.vert}35`} stroke={C.vert} lineWidth={1}
        radius={4} opacity={0}
      />
      <Txt key="label-ssh" ref={labelSSH}
        x={() => vW() * 0.19} y={() => vH() * -0.16}
        text={"sshd_auth()"}
        fill={C.vert} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'}
        opacity={0}
      />

      <Rect key="flame-rsa" ref={flameRSA}
        x={() => vW() * 0.19} y={() => vH() * -0.06}
        width={0} height={() => vH() * 0.048}
        fill={`${C.jaune}35`} stroke={C.jaune} lineWidth={1}
        radius={4} opacity={0}
      />
      <Txt key="label-rsa" ref={labelRSA}
        x={() => vW() * 0.19} y={() => vH() * -0.06}
        text={"RSA_public_decrypt()  ← IFUNC hook"}
        fill={C.jaune} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'}
        opacity={0}
      />

      {/* Barre liblzma — anormalement longue */}
      <Rect key="flame-lzma" ref={flameLzma}
        x={() => vW() * 0.19} y={() => vH() * 0.04}
        width={0} height={() => vH() * 0.048}
        fill={`${C.danger}45`} stroke={C.danger} lineWidth={2}
        radius={4} opacity={0}
        shadowColor={C.danger} shadowBlur={() => vW() * 0.015}
      />
      <Txt key="label-lzma" ref={labelLzma}
        x={() => vW() * 0.19} y={() => vH() * 0.04}
        text={"liblzma_crc64_resolve()  ← +500ms"}
        fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} fontWeight={700}
        opacity={0}
      />

      <Rect key="week-banner" ref={weekBanner}
        y={() => vH() * 0.30}
        width={() => vW() * 0.66} height={() => vH() * 0.13}
        fill={`${C.vert}08`} stroke={C.vert} lineWidth={3}
        radius={() => vW() * 0.007} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt key="wk-main" text={"UNE SEMAINE AVANT LE DÉPLOIEMENT PRODUCTION"} fill={C.vert} fontSize={() => vW() * 0.020} fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt key="wk-sub"  text={"des millions de serveurs auraient été compromis"} fill={C.ghost} fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'} />
      </Rect>
    </Layout>,
  );

  // ════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════

  // ── BEAT 1 | HEARTBLEED PROTOCOL ────────────
  yield* waitUntil('heartbleedProtocol');
  yield* gridRef().opacity(0.12, 0.8);
  yield* hbTitle().opacity(1, 0.5);
  yield* waitFor(0.2);
  yield* all(clientBox().opacity(1, 0.4), serverBox().opacity(1, 0.4));
  yield* wireRef().opacity(1, 0.4);
  yield* waitFor(0.4);

  // Heartbeat NORMAL
  yield* packetNormal().opacity(1, 0.3);
  yield* packetNormal().x(vW() * 0.27, 0.8, easeInOutCubic);
  yield* responseNormal().opacity(1, 0.35);
  yield* waitFor(0.8);

  // Reset + Evil packet
  yield* all(packetNormal().opacity(0, 0.2), responseNormal().opacity(0, 0.2));
  packetNormal().x(vW() * -0.3);

  yield* packetEvil().opacity(1, 0.3);
  // Le champ len MENT — il s'étire
  yield* peLenField().width(vW() * 0.20, 0.55, easeOutBack);
  yield* waitFor(0.3);
  yield* packetEvil().x(vW() * 0.27, 0.8, easeInOutCubic);
  yield* waitFor(0.15);

  // Flash + énorme réponse qui revient
  yield* flashOverlay().opacity(0.10, 0.06);
  yield* flashOverlay().opacity(0, 0.25);
  yield* responseEvil().opacity(1, 0.4);
  yield* responseEvil().x(vW() * -0.22, 1.0, easeInOutCubic);
  yield* waitFor(0.3);
  yield* punchlineTxt().opacity(1, 0.6);
  yield* waitFor(2.5);

  // ── BEAT 2 | MEMORY STRIP ───────────────────
  yield* waitUntil('heartbleedMemory');
  yield* all(
    hbTitle().opacity(0, 0.3),
    clientBox().opacity(0, 0.3),
    serverBox().opacity(0, 0.3),
    wireRef().opacity(0, 0.25),
    packetEvil().opacity(0, 0.25),
    responseEvil().opacity(0, 0.25),
    punchlineTxt().opacity(0, 0.25),
  );
  yield* waitFor(0.2);

  yield* memTitle().opacity(1, 0.45);
  yield* memStrip().opacity(1, 0.5);
  yield* all(memLegitZone().opacity(1, 0.4), memPrivZone().opacity(1, 0.4));
  yield* waitFor(0.3);

  // Curseur glisse de gauche à droite sur toute la bande
  yield* memCursor().opacity(1, 0.2);
  // Dès que le curseur dépasse la zone payload, les blocs fuient
  yield* all(
    memCursor().x(vW() * 0.415, 2.0, easeInOutCubic),
    sequence(0.25,
      all(leak1().opacity(1, 0.25), leak1().y(vH() * -0.25, 0.7, easeOutCubic)),
      all(leak2().opacity(1, 0.25), leak2().y(vH() * -0.25, 0.7, easeOutCubic)),
      all(leak3().opacity(1, 0.25), leak3().y(vH() * -0.25, 0.7, easeOutCubic)),
      all(leak4().opacity(1, 0.25), leak4().y(vH() * -0.25, 0.7, easeOutCubic)),
    ),
  );
  yield* waitFor(2.0);

  // ── BEAT 3 | XZ DEPENDENCY GRAPH ────────────
  yield* waitUntil('xzDependencies');
  yield* all(
    memTitle().opacity(0, 0.3),
    memStrip().opacity(0, 0.3),
    memCursor().opacity(0, 0.25),
    memLegitZone().opacity(0, 0.25),
    memPrivZone().opacity(0, 0.25),
    leak1().opacity(0, 0.2), leak2().opacity(0, 0.2),
    leak3().opacity(0, 0.2), leak4().opacity(0, 0.2),
  );
  yield* waitFor(0.2);

  yield* xzTitle().opacity(1, 0.45);
  yield* waitFor(0.2);

  // Nœuds + flèches de bas en haut
  yield* nodeXZ().opacity(1, 0.4);
  yield* waitFor(0.1);
  yield* all(lineXZSd().opacity(1, 0.1), lineXZSd().end(1, 0.3, easeOutCubic));
  yield* nodeSystemd().opacity(1, 0.4);
  yield* waitFor(0.1);
  yield* all(lineSdSshd().opacity(1, 0.1), lineSdSshd().end(1, 0.3, easeOutCubic));
  yield* nodeSshd().opacity(1, 0.4);
  yield* waitFor(0.1);
  yield* all(lineSshdClient().opacity(1, 0.1), lineSshdClient().end(1, 0.3, easeOutCubic));
  yield* nodeClient().opacity(1, 0.4);
  yield* waitFor(0.7);

  // Infection : XZ s'allume en rouge, remonte la chaîne
  yield* all(
    nodeXZ().fill(`${C.danger}22`, 0.3),
    nodeXZ().stroke(C.danger, 0.3),
    nodeXZ().shadowBlur(vW() * 0.025, 0.3),
    nodeXZ().shadowColor(C.danger, 0.3),
  );
  yield* waitFor(0.15);
  yield* all(lineXZSd().stroke(C.danger, 0.25), nodeSystemd().stroke(C.danger, 0.3));
  yield* waitFor(0.12);
  yield* all(lineSdSshd().stroke(C.danger, 0.25), nodeSshd().stroke(C.danger, 0.3));
  yield* waitFor(0.12);
  yield* all(lineSshdClient().stroke(C.danger, 0.25), nodeClient().stroke(C.danger, 0.3));
  yield* waitFor(0.3);
  yield* xzPunchline().opacity(1, 0.5);
  yield* waitFor(2.5);

  // ── BEAT 4 | COMMIT GRID ────────────────────
  yield* waitUntil('xzCommitGrid');
  yield* all(
    xzTitle().opacity(0, 0.3),
    nodeXZ().opacity(0, 0.3), nodeSystemd().opacity(0, 0.3),
    nodeSshd().opacity(0, 0.3), nodeClient().opacity(0, 0.3),
    lineXZSd().opacity(0, 0.25), lineSdSshd().opacity(0, 0.25),
    lineSshdClient().opacity(0, 0.25), xzPunchline().opacity(0, 0.3),
  );
  yield* waitFor(0.2);

  yield* commitTitle().opacity(1, 0.45);
  yield* commitSub().opacity(1, 0.40);
  yield* waitFor(0.3);

  // Masquer le carré backdoor au départ (même couleur que les autres puis reveal)
  cells[BDOOR]!().fill(C.ghost);
  // Remplir la grille rapidement
  yield* sequence(0.013, ...cells.map(ref => ref().opacity(1, 0.07)));
  yield* waitFor(0.5);

  // Révélation du commit backdoor
  yield* all(
    cells[BDOOR]!().fill(C.danger, 0.4),
    cells[BDOOR]!().shadowColor(C.danger, 0.3),
    cells[BDOOR]!().shadowBlur(vW() * 0.022, 0.3),
  );
  yield* waitFor(0.3);

  // Zoom sur le carré backdoor
  const bdoorCol = BDOOR % COLS;
  const bdoorRow = Math.floor(BDOOR / COLS);
  const cellStep = vW() * (0.022 + 0.007);
  const focusX = (bdoorCol - COLS / 2 + 0.5) * cellStep;
  const focusY = (bdoorRow - ROWS / 2 + 0.5) * cellStep + vH() * 0.04;
  yield* all(
    gridContainer().scale(5, 0.65, easeInOutCubic),
    gridContainer().position([-focusX * 5, -focusY * 5], 0.65, easeInOutCubic),
  );
  yield* bdoorLabel().opacity(1, 0.4);
  yield* waitFor(0.8);

  // Pull back
  yield* all(
    gridContainer().scale(1, 0.55, easeInOutCubic),
    gridContainer().position([0, 0], 0.55, easeInOutCubic),
    bdoorLabel().opacity(0, 0.3),
  );
  yield* waitFor(1.5);

  // ── BEAT 5 | DISCOVERY ──────────────────────
  yield* waitUntil('xzDiscovery');
  yield* all(
    commitTitle().opacity(0, 0.3), commitSub().opacity(0, 0.3),
    ...cells.map(ref => ref().opacity(0, 0.2)),
  );
  yield* waitFor(0.2);

  yield* discTitle().opacity(1, 0.45);
  yield* waitFor(0.3);
  yield* termBox().opacity(1, 0.5);
  yield* waitFor(0.9);

  // Flame bars de haut en bas — la dernière est anormalement longue
  yield* flameSSH().opacity(1, 0.1);
  yield* flameSSH().width(vW() * 0.21, 0.4, easeOutCubic);
  yield* labelSSH().opacity(1, 0.3);
  yield* waitFor(0.2);

  yield* flameRSA().opacity(1, 0.1);
  yield* flameRSA().width(vW() * 0.19, 0.4, easeOutCubic);
  yield* labelRSA().opacity(1, 0.3);
  yield* waitFor(0.2);

  yield* flameLzma().opacity(1, 0.1);
  yield* flameLzma().width(vW() * 0.34, 0.65, easeOutCubic); // anormalement longue
  yield* labelLzma().opacity(1, 0.4);
  yield* waitFor(0.4);

  yield* flashOverlay().opacity(0.09, 0.07);
  yield* flashOverlay().opacity(0, 0.25);
  yield* weekBanner().opacity(1, 0.6);
  yield* waitFor(3.0);

  // ── FIN ─────────────────────────────────────
  yield* waitUntil('endScene');
  yield* all(
    discTitle().opacity(0, 0.4),
    termBox().opacity(0, 0.4),
    flameSSH().opacity(0, 0.3), flameRSA().opacity(0, 0.3), flameLzma().opacity(0, 0.3),
    labelSSH().opacity(0, 0.3), labelRSA().opacity(0, 0.3), labelLzma().opacity(0, 0.3),
    weekBanner().opacity(0, 0.4),
    gridRef().opacity(0, 0.5),
  );
});
