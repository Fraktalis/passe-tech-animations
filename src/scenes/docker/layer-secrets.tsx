import {makeScene2D, Layout, Rect, Txt, Icon} from '@motion-canvas/2d';
import {createRef, createSignal, all, waitFor, waitUntil, cancel} from '@motion-canvas/core';
import {easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import {Terminal, Callout, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Dimensions des couches ───────────────────────────────────────────────
  const LAYER_W      = () => vW() * 0.48;
  const LAYER_H      = () => vH() * 0.090;
  const SLIDE_OFFSET = 60;

  // Positions Y — capturées au démarrage (view déjà dimensionné)
  const L0_Y = view.height() *  0.070;   // FROM python:3.12
  const L1_Y = view.height() * -0.025;   // ENV API_KEY=...  ← la fuite
  const L2_Y = view.height() * -0.120;   // RUN pip install
  const L3_Y = view.height() * -0.215;   // RUN unset API_KEY

  // Signaux animables pour le slide-in à la construction
  const layer0YSig = createSignal(L0_Y + SLIDE_OFFSET);
  const layer1YSig = createSignal(L1_Y + SLIDE_OFFSET);
  const layer2YSig = createSignal(L2_Y + SLIDE_OFFSET);
  const layer3YSig = createSignal(L3_Y + SLIDE_OFFSET);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const layer0Ref       = createRef<Rect>();
  const layer1Ref       = createRef<Rect>();
  const layer2Ref       = createRef<Rect>();
  const layer3Ref       = createRef<Rect>();
  const envInstrTxtRef  = createRef<Txt>();
  const checkBadgeRef   = createRef<Rect>();
  const calloutRef      = createRef<Callout>();
  const calloutArrowRef = createRef<ConnectionArrow>();
  const terminalRef     = createRef<Terminal>();

  // ── Scène ────────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      {/* ── Layer 0 : FROM python:3.12 ────────────────────────────────── */}
      <Rect
        key="layer-0"
        ref={layer0Ref}
        width={LAYER_W}
        height={LAYER_H}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary}
        lineWidth={1}
        radius={4}
        layout={true}
        direction="row"
        alignItems="center"
        paddingLeft={() => vW() * 0.018}
        gap={() => vW() * 0.014}
        x={0}
        y={() => layer0YSig()}
        opacity={0}
      >
        <Icon key="l0-icon" icon="logos:python" size={() => vW() * 0.020} />
        <Layout key="l0-texts" layout direction="column" alignItems="start" gap={3}>
          <Txt
            key="l0-instr"
            text="FROM python:3.12"
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.012}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
          <Txt
            key="l0-hash"
            text="sha256:7f3a819c…"
            fill={PALETTE.ghost}
            fontSize={() => vW() * 0.009}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
        </Layout>
      </Rect>

      {/* ── Layer 1 : ENV API_KEY=sk-1234abcd ───────────────────────────── */}
      <Rect
        key="layer-1"
        ref={layer1Ref}
        width={LAYER_W}
        height={LAYER_H}
        fill={PALETTE.amber + '18'}
        stroke={PALETTE.amber}
        lineWidth={2}
        radius={4}
        layout={true}
        direction="row"
        alignItems="center"
        paddingLeft={() => vW() * 0.018}
        gap={() => vW() * 0.014}
        x={0}
        y={() => layer1YSig()}
        opacity={0}
      >
        <Icon key="l1-icon" icon="lucide:key" size={() => vW() * 0.020} color={PALETTE.amber} />
        <Layout key="l1-texts" layout direction="column" alignItems="start" gap={3}>
          <Txt
            key="l1-instr"
            ref={envInstrTxtRef}
            text="ENV API_KEY=sk-1234abcd"
            fill={PALETTE.amber}
            fontWeight={700}
            fontSize={() => vW() * 0.012}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
          <Txt
            key="l1-hash"
            text="sha256:3e7c04fa…"
            fill={PALETTE.ghost}
            fontSize={() => vW() * 0.009}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
        </Layout>
      </Rect>

      {/* ── Layer 2 : RUN pip install ────────────────────────────────────── */}
      <Rect
        key="layer-2"
        ref={layer2Ref}
        width={LAYER_W}
        height={LAYER_H}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary}
        lineWidth={1}
        radius={4}
        layout={true}
        direction="row"
        alignItems="center"
        paddingLeft={() => vW() * 0.018}
        gap={() => vW() * 0.014}
        x={0}
        y={() => layer2YSig()}
        opacity={0}
      >
        <Icon key="l2-icon" icon="lucide:package" size={() => vW() * 0.020} color={PALETTE.secondary} />
        <Layout key="l2-texts" layout direction="column" alignItems="start" gap={3}>
          <Txt
            key="l2-instr"
            text="RUN pip install -r requirements.txt"
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.012}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
          <Txt
            key="l2-hash"
            text="sha256:b92d77e1…"
            fill={PALETTE.ghost}
            fontSize={() => vW() * 0.009}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
        </Layout>
      </Rect>

      {/* ── Layer 3 : RUN unset API_KEY ──────────────────────────────────── */}
      <Rect
        key="layer-3"
        ref={layer3Ref}
        width={LAYER_W}
        height={LAYER_H}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.dsGreen}
        lineWidth={2}
        radius={4}
        layout={true}
        direction="row"
        alignItems="center"
        paddingLeft={() => vW() * 0.018}
        gap={() => vW() * 0.014}
        x={0}
        y={() => layer3YSig()}
        opacity={0}
      >
        <Icon key="l3-icon" icon="lucide:trash-2" size={() => vW() * 0.020} color={PALETTE.dsGreen} />
        <Layout key="l3-texts" layout direction="column" alignItems="start" gap={3}>
          <Txt
            key="l3-instr"
            text="RUN unset API_KEY"
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.012}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
          <Txt
            key="l3-hash"
            text="sha256:a8f9dc23…"
            fill={PALETTE.ghost}
            fontSize={() => vW() * 0.009}
            fontFamily="JetBrains Mono, DM Mono, monospace"
          />
        </Layout>
      </Rect>

      {/* ── Badge fausse sécurité ─────────────────────────────────────────── */}
      <Rect
        key="check-badge"
        ref={checkBadgeRef}
        width={() => vW() * 0.145}
        height={() => vH() * 0.058}
        fill={PALETTE.dsGreen + '18'}
        stroke={PALETTE.dsGreen}
        lineWidth={1}
        radius={4}
        x={() => vW() * 0.325}
        y={() => vH() * -0.215}
        opacity={0}
      >
        <Txt
          key="check-badge-txt"
          text="✓  clé supprimée"
          fill={PALETTE.dsGreen}
          fontSize={() => vW() * 0.0095}
          fontFamily="DM Sans, sans-serif"
        />
      </Rect>

      {/* ── Callout "Couche immuable" ────────────────────────────────────── */}
      <Callout
        key="leak-callout"
        ref={calloutRef}
        title="Couche immuable"
        body="Visible dans docker history"
        color={PALETTE.dsRose}
        width={() => vW() * 0.175}
        height={() => vH() * 0.130}
        x={() => vW() * 0.405}
        y={() => vH() * -0.025}
        opacity={0}
      />
      <ConnectionArrow
        key="callout-arrow"
        ref={calloutArrowRef}
        from={() => [vW() * 0.315, vH() * -0.025]}
        to={() =>   [vW() * 0.246, vH() * -0.025]}
        stroke={PALETTE.dsRose}
        lineWidth={2}
        end={0}
        opacity={0}
      />

      {/* ── Terminal docker history ─────────────────────────────────────── */}
      <Terminal
        key="terminal-history"
        ref={terminalRef}
        title="bash"
        fontSize={() => vW() * 0.0095}
        maxLines={7}
        width={() => vW() * 0.62}
        height={() => vH() * 0.265}
        x={0}
        y={() => vH() * 0.335}
        opacity={0}
      />
    </Layout>
  );

  // ── Beat 1 — Construction des couches ────────────────────────────────────
  // Les couches s'empilent de bas en haut, la plus ancienne en premier.
  yield* waitUntil('buildLayers');
  yield* all(
    layer0Ref().opacity(1, 0.35),
    layer0YSig(L0_Y, 0.40, easeOutCubic),
  );
  yield* waitFor(0.30);
  yield* all(
    layer1Ref().opacity(1, 0.35),
    layer1YSig(L1_Y, 0.40, easeOutCubic),
  );
  yield* waitFor(0.30);
  yield* all(
    layer2Ref().opacity(1, 0.35),
    layer2YSig(L2_Y, 0.40, easeOutCubic),
  );
  yield* waitFor(0.30);
  yield* all(
    layer3Ref().opacity(1, 0.35),
    layer3YSig(L3_Y, 0.40, easeOutCubic),
  );

  // ── Beat 2 — Fausse sécurité ──────────────────────────────────────────────
  yield* waitUntil('falseClean');
  yield* checkBadgeRef().opacity(1, 0.30);
  yield* waitFor(1.20);

  // ── Beat 3 — Révélation : la couche ENV est toujours là ───────────────────
  yield* waitUntil('revealLeak');
  yield* checkBadgeRef().opacity(0, 0.25);
  // La couche "unset" se délave — elle n'a rien effacé
  yield* all(
    layer3Ref().stroke(PALETTE.ghost, 0.40),
    layer3Ref().opacity(0.45, 0.40),
    // La couche ENV s'allume en rose — le secret est exposé
    layer1Ref().stroke(PALETTE.dsRose, 0.15),
    layer1Ref().fill(PALETTE.dsRose + '1A', 0.15),
    envInstrTxtRef().fill(PALETTE.dsRose, 0.15),
  );
  yield* calloutRef().opacity(1, 0.25);
  calloutArrowRef().opacity(1);
  yield* calloutArrowRef().end(1, 0.40, easeInOutCubic);

  // ── Beat 4 — docker history ───────────────────────────────────────────────
  yield* waitUntil('dockerHistory');
  yield* terminalRef().opacity(1, 0.40);
  const blinkHandle = yield terminalRef().startBlink();
  yield* terminalRef().typewrite('docker history --no-trunc mon-image', {prompt: true, charDelay: 0.035});
  yield* waitFor(0.25);
  cancel(blinkHandle);
  yield* terminalRef().hideCursor();
  // Sortie instantanée — comme dans un vrai terminal
  terminalRef().writeLine('CREATED BY                                    SIZE', 'ghost');
  terminalRef().writeLine('/bin/sh -c unset API_KEY                      0B');
  terminalRef().writeLine('/bin/sh -c pip install -r requirements.txt    220MB');
  terminalRef().writeLine('ENV API_KEY=sk-1234abcd                       0B');
  terminalRef().writeLine('FROM python:3.12                              1.01GB');
  yield* waitFor(0.80);
  // Highlight de la ligne ENV (index 4 : cmd=0, header=1, unset=2, pip=3, ENV=4)
  yield* terminalRef().line(4)!.fill(PALETTE.dsRose, 0.25);

  // ── Fin ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    layer0Ref().opacity(0, 0.30),
    layer1Ref().opacity(0, 0.30),
    layer2Ref().opacity(0, 0.30),
    layer3Ref().opacity(0, 0.30),
    checkBadgeRef().opacity(0, 0.20),
    calloutRef().opacity(0, 0.30),
    calloutArrowRef().opacity(0, 0.30),
    terminalRef().opacity(0, 0.30),
  );
});
