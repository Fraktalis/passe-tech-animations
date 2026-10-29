/**
 * app-plan-json — Un fichier, deux éditeurs, une appli en lecture seule (JUMEAU).
 *
 * Le solveur CP-SAT (petit, secondaire — cf. scène `cpsat-solution`) alimente
 * `plan.json`. Les deux mariés éditent le même fichier (curseurs bleu / rose).
 * Une seule flèche mène à l'appli THREE.js : jamais de retour. Vue de dessus :
 * survol d'une chaise → carte invité ; puis bougies, intensité, ciel jour → nuit.
 *
 * Données fictives et anonymisées (Invité 12, 13, 31).
 * Couleur active : jaune. Bleu / rose = identité fixe des deux mariés.
 */
import {makeScene2D, Grid, Layout, Rect, Circle, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  waitUntil,
  waitFor,
  easeInOutCubic,
} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge, ConnectionArrow, Packet, Terminal} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const DISPLAY = 'Space Grotesk, sans-serif';

  // ── Contenu de plan.json (fictif) ──────────────────────────────────────────
  const jsonEntryA = '  { "table": 3, "invite": "Invité 12", "menu": "risotto" },';
  const jsonEntryB = '  { "table": 3, "invite": "Invité 13", "menu": "jarret" },';
  const jsonEntryC = '  { "table": 5, "invite": "Invité 31", "menu": "risotto" }';
  const jsonEntryBEdited = '  { "table": 3, "invite": "Invité 13", "menu": "poisson" },';
  const jsonEntryCEdited = '  { "table": 6, "invite": "Invité 31", "menu": "risotto" }';

  // ── Géométrie : chaîne solveur → fichier → appli ───────────────────────────
  const solverX = () => -vW() * 0.41;
  const solverY = () => -vH() * 0.08;
  const solverWidth = () => vW() * 0.075;
  const solverHeight = () => vH() * 0.17;

  const terminalX = () => -vW() * 0.07;
  const terminalY = () => -vH() * 0.08;
  const terminalWidth = () => vW() * 0.46;
  const terminalHeight = () => vH() * 0.36;
  const terminalFontSize = () => vW() * 0.0115;

  const appX = () => vW() * 0.36;
  const appY = () => -vH() * 0.08;
  const appWidth = () => vW() * 0.15;
  const appHeight = () => vH() * 0.3;

  const bluePersonX = () => -vW() * 0.2;
  const rosePersonX = () => vW() * 0.06;
  const personY = () => vH() * 0.36;
  const personSize = () => vW() * 0.05;

  // ── Géométrie : vue de dessus ──────────────────────────────────────────────
  const frameY = () => -vH() * 0.03;
  const frameWidth = () => vW() * 0.58;
  const frameHeight = () => vH() * 0.66;
  const chairCount = 8;
  const chairRadius = () => vW() * 0.098;
  const chairSize = () => vW() * 0.026;
  const highlightedChairIndex = 2;
  const ringX = (radius: number, pointIndex: number, pointCount: number) =>
    radius * Math.cos(-Math.PI / 2 + (2 * Math.PI * pointIndex) / pointCount);
  const ringY = (radius: number, pointIndex: number, pointCount: number) =>
    radius * Math.sin(-Math.PI / 2 + (2 * Math.PI * pointIndex) / pointCount);
  const framePoint = (dx: number, dy: number): [number, number] => [dx, frameY() + dy];

  // Bougies et guirlandes — coordonnées en unités de vW (x et y).
  const lightSpots: Array<[number, number]> = [];
  for (let spotIndex = 0; spotIndex < 12; spotIndex++) {
    lightSpots.push([ringX(0.15, spotIndex, 12), ringY(0.15, spotIndex, 12)]);
  }
  for (let spotIndex = 0; spotIndex < 9; spotIndex++) {
    const garlandX = -0.24 + spotIndex * 0.06;
    lightSpots.push([garlandX, -0.165 + 0.02 * Math.sin((spotIndex / 8) * Math.PI)]);
    lightSpots.push([garlandX, 0.165 - 0.02 * Math.sin((spotIndex / 8) * Math.PI)]);
  }

  // ── Slider d'éclairage ─────────────────────────────────────────────────────
  const sliderY = () => vH() * 0.405;
  const sliderLeft = () => -vW() * 0.12;
  const sliderRight = () => vW() * 0.04;
  const swatchXs = [0.09, 0.12, 0.15];
  const swatchColors = [PALETTE.jaune, PALETTE.amber, PALETTE.cream];
  const dayColor = '#2E4560';
  const nightColor = '#06080C';

  const lightIntensity = createSignal(0.25);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const solverNode = createRef<DiagramNode>();
  const solverEdge = createRef<DiagramEdge>();
  const feedPacketA = createRef<Packet>();
  const feedPacketB = createRef<Packet>();
  const planTerminal = createRef<Terminal>();
  const bluePerson = createRef<Icon>();
  const rosePerson = createRef<Icon>();
  const blueArrow = createRef<ConnectionArrow>();
  const roseArrow = createRef<ConnectionArrow>();
  const blueCursor = createRef<Rect>();
  const roseCursor = createRef<Rect>();
  const blueHighlight = createRef<Rect>();
  const roseHighlight = createRef<Rect>();
  const appNode = createRef<Rect>();
  const readEdge = createRef<DiagramEdge>();
  const readEye = createRef<Icon>();
  const topViewFrame = createRef<Rect>();
  const tableCircle = createRef<Circle>();
  const chairRefs = Array.from({length: chairCount}, () => createRef<Circle>());
  const lightsLayer = createRef<Layout>();
  const lightRefs = lightSpots.map(() => createRef<Circle>());
  const sunIcon = createRef<Icon>();
  const moonIcon = createRef<Icon>();
  const guestCard = createRef<Rect>();
  const hoverCursor = createRef<Icon>();
  const sliderGroup = createRef<Layout>();
  const swatchRing = createRef<Circle>();

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid
      key="bg-grid"
      ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* Solveur — petit et secondaire */}
    <DiagramNode key="solver-node" ref={solverNode}
      iconName="mdi:chip"
      label="CP-SAT"
      color={PALETTE.secondary}
      initialState="idle"
      width={solverWidth} height={solverHeight}
      x={solverX} y={solverY}
      opacity={0}
    />
    <DiagramEdge key="solver-edge" ref={solverEdge}
      from={() => [solverX() + solverWidth() / 2 + vW() * 0.008, solverY()]}
      to={() => [terminalX() - terminalWidth() / 2 - vW() * 0.008, terminalY()]}
      stroke={PALETTE.jaune}
      end={0}
      opacity={0}
    />
    <Packet key="feed-packet-a" ref={feedPacketA}
      content="table 3"
      color={PALETTE.jaune}
      packetSize="sm"
      width={() => vW() * 0.05}
      height={() => vH() * 0.04}
      x={() => solverX() + solverWidth() / 2 + vW() * 0.008}
      y={solverY}
      opacity={0}
    />
    <Packet key="feed-packet-b" ref={feedPacketB}
      content="table 5"
      color={PALETTE.jaune}
      packetSize="sm"
      width={() => vW() * 0.05}
      height={() => vH() * 0.04}
      x={() => solverX() + solverWidth() / 2 + vW() * 0.008}
      y={solverY}
      opacity={0}
    />

    {/* plan.json */}
    <Terminal key="plan-terminal" ref={planTerminal}
      title="plan.json"
      maxLines={5}
      fontSize={terminalFontSize}
      width={terminalWidth} height={terminalHeight}
      x={terminalX} y={terminalY}
      stroke={PALETTE.jaune}
      opacity={0}
    />

    {/* Surbrillances et curseurs d'édition */}
    <Rect key="blue-highlight" ref={blueHighlight}
      width={() => vW() * 0.42} height={() => vH() * 0.04}
      fill={PALETTE.blue + '33'} stroke={PALETTE.blue} lineWidth={1}
      radius={() => vW() * 0.003}
      opacity={0}
    />
    <Rect key="rose-highlight" ref={roseHighlight}
      width={() => vW() * 0.42} height={() => vH() * 0.04}
      fill={PALETTE.rose + '33'} stroke={PALETTE.rose} lineWidth={1}
      radius={() => vW() * 0.003}
      opacity={0}
    />
    <Rect key="blue-cursor" ref={blueCursor}
      width={() => vW() * 0.005} height={() => vH() * 0.036}
      fill={PALETTE.blue}
      opacity={0}
    />
    <Rect key="rose-cursor" ref={roseCursor}
      width={() => vW() * 0.005} height={() => vH() * 0.036}
      fill={PALETTE.rose}
      opacity={0}
    />

    {/* Les deux mariés */}
    <Icon key="blue-person" ref={bluePerson}
      icon="mdi:account"
      size={personSize}
      color={PALETTE.blue}
      x={bluePersonX} y={personY}
      opacity={0}
    />
    <Icon key="rose-person" ref={rosePerson}
      icon="mdi:account"
      size={personSize}
      color={PALETTE.rose}
      x={rosePersonX} y={personY}
      opacity={0}
    />
    <ConnectionArrow key="blue-arrow" ref={blueArrow}
      from={() => [bluePersonX(), personY() - personSize() * 0.6]}
      to={() => [bluePersonX(), terminalY() + terminalHeight() / 2 + vH() * 0.012]}
      stroke={PALETTE.blue}
      routing={0}
      end={0}
      opacity={0}
    />
    <ConnectionArrow key="rose-arrow" ref={roseArrow}
      from={() => [rosePersonX(), personY() - personSize() * 0.6]}
      to={() => [rosePersonX(), terminalY() + terminalHeight() / 2 + vH() * 0.012]}
      stroke={PALETTE.rose}
      routing={0}
      end={0}
      opacity={0}
    />

    {/* Appli THREE.js — lecture seule */}
    <Rect key="app-node" ref={appNode}
      width={appWidth} height={appHeight}
      x={appX} y={appY}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.jaune}
      lineWidth={2}
      radius={() => vW() * 0.005}
      opacity={0}
    >
      <Circle key="app-logo-badge"
        width={() => vW() * 0.05} height={() => vW() * 0.05}
        y={() => -vH() * 0.03}
        fill={PALETTE.cream}
      />
      <Icon key="app-logo"
        icon="logos:threejs"
        size={() => vW() * 0.035}
        y={() => -vH() * 0.03}
      />
      <Txt key="app-label"
        text="THREE.js"
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.012}
        fontFamily={MONO}
        fontWeight={700}
        y={() => vH() * 0.08}
      />
    </Rect>
    <DiagramEdge key="read-edge" ref={readEdge}
      from={() => [terminalX() + terminalWidth() / 2 + vW() * 0.008, terminalY()]}
      to={() => [appX() - appWidth() / 2 - vW() * 0.008, appY()]}
      stroke={PALETTE.jaune}
      end={0}
      opacity={0}
    />
    <Icon key="read-eye" ref={readEye}
      icon="mdi:eye-outline"
      size={() => vW() * 0.02}
      color={PALETTE.jaune}
      x={() => (terminalX() + terminalWidth() / 2 + appX() - appWidth() / 2) / 2}
      y={() => appY() - vH() * 0.04}
      opacity={0}
    />

    {/* Vue de dessus de la salle */}
    <Rect key="top-view-frame" ref={topViewFrame}
      width={frameWidth} height={frameHeight}
      y={frameY}
      fill={dayColor}
      stroke={PALETTE.jaune + '66'}
      lineWidth={2}
      radius={() => vW() * 0.008}
      clip
      opacity={0}
    >
      <Circle key="round-table" ref={tableCircle}
        width={() => vW() * 0.13} height={() => vW() * 0.13}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary}
        lineWidth={2}
      />
      {chairRefs.map((chairRef, chairIndex) => (
        <Circle key={`chair-${chairIndex}`} ref={chairRef}
          width={chairSize} height={chairSize}
          x={() => ringX(chairRadius(), chairIndex, chairCount)}
          y={() => ringY(chairRadius(), chairIndex, chairCount)}
          fill={PALETTE.ghost}
          shadowColor={PALETTE.jaune}
          shadowBlur={0}
        />
      ))}
      <Layout key="lights-layer" ref={lightsLayer} opacity={0}>
        {lightSpots.map(([spotX, spotY], spotIndex) => (
          <Circle key={`light-${spotIndex}`} ref={lightRefs[spotIndex]}
            width={() => vW() * 0.009} height={() => vW() * 0.009}
            x={() => vW() * spotX} y={() => vW() * spotY}
            fill={PALETTE.jaune}
            shadowColor={PALETTE.jaune}
            shadowBlur={() => vW() * 0.02 * lightIntensity()}
            opacity={() => 0.25 + lightIntensity() * 0.75}
          />
        ))}
      </Layout>
      <Icon key="sun-icon" ref={sunIcon}
        icon="mdi:weather-sunny"
        size={() => vW() * 0.025}
        color={PALETTE.jaune}
        x={() => frameWidth() / 2 - vW() * 0.03}
        y={() => -frameHeight() / 2 + vW() * 0.03}
      />
      <Icon key="moon-icon" ref={moonIcon}
        icon="mdi:weather-night"
        size={() => vW() * 0.025}
        color={PALETTE.cream}
        x={() => frameWidth() / 2 - vW() * 0.03}
        y={() => -frameHeight() / 2 + vW() * 0.03}
        opacity={0}
      />
      <Icon key="frame-badge"
        icon="logos:threejs"
        size={() => vW() * 0.02}
        x={() => -frameWidth() / 2 + vW() * 0.03}
        y={() => -frameHeight() / 2 + vW() * 0.03}
        opacity={0.8}
      />
      <Rect key="guest-card" ref={guestCard}
        width={() => vW() * 0.17} height={() => vH() * 0.06}
        x={() => chairRadius() + vW() * 0.088}
        y={() => -vH() * 0.085}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.jaune}
        lineWidth={2}
        radius={() => vW() * 0.004}
        opacity={0}
      >
        <Txt key="guest-card-text"
          text="Invité 12 · risotto"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.0115}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
    </Rect>

    {/* Curseur de souris */}
    <Icon key="hover-cursor" ref={hoverCursor}
      icon="mdi:cursor-default"
      size={() => vW() * 0.022}
      color={PALETTE.cream}
      offset={[-1, -1]}
      x={() => vW() * 0.3} y={() => vH() * 0.28}
      opacity={0}
    />

    {/* Réglage d'éclairage */}
    <Layout key="slider-group" ref={sliderGroup} opacity={0}>
      <Icon key="slider-icon"
        icon="mdi:candle"
        size={() => vW() * 0.022}
        color={PALETTE.jaune}
        x={() => sliderLeft() - vW() * 0.03} y={sliderY}
      />
      <Rect key="slider-track"
        width={() => sliderRight() - sliderLeft()} height={() => vH() * 0.008}
        x={() => (sliderLeft() + sliderRight()) / 2} y={sliderY}
        fill={PALETTE.ghost}
        radius={() => vH() * 0.004}
      />
      <Rect key="slider-fill"
        width={() => (sliderRight() - sliderLeft()) * lightIntensity()}
        height={() => vH() * 0.008}
        offset={[-1, 0]}
        x={sliderLeft} y={sliderY}
        fill={PALETTE.jaune}
        radius={() => vH() * 0.004}
      />
      <Circle key="slider-knob"
        width={() => vW() * 0.014} height={() => vW() * 0.014}
        x={() => sliderLeft() + (sliderRight() - sliderLeft()) * lightIntensity()}
        y={sliderY}
        fill={PALETTE.cream}
      />
      {swatchXs.map((swatchX, swatchIndex) => (
        <Circle key={`swatch-${swatchIndex}`}
          width={() => vW() * 0.014} height={() => vW() * 0.014}
          x={() => vW() * swatchX} y={sliderY}
          fill={swatchColors[swatchIndex]}
        />
      ))}
      <Circle key="swatch-ring" ref={swatchRing}
        width={() => vW() * 0.022} height={() => vW() * 0.022}
        x={() => vW() * swatchXs[0]} y={sliderY}
        stroke={PALETTE.cream}
        lineWidth={2}
      />
    </Layout>
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Position monde de la fin du texte d'une ligne du fichier. */
  const lineEndPosition = (lineIndex: number): [number, number] => {
    const lineNode = planTerminal().line(lineIndex)!;
    const linePosition = lineNode.absolutePosition();
    return [linePosition.x + lineNode.width() / 2 + vW() * 0.004, linePosition.y];
  };

  /** Position monde du centre d'une ligne, centrée sur le terminal. */
  const lineCenterPosition = (lineIndex: number): [number, number] => {
    const lineNode = planTerminal().line(lineIndex)!;
    return [planTerminal().absolutePosition().x, lineNode.absolutePosition().y];
  };

  /** Un paquet part du solveur et atterrit dans le fichier. */
  function* feedPacket(packetRef: typeof feedPacketA) {
    packetRef().position([solverX() + solverWidth() / 2 + vW() * 0.008, solverY()]);
    yield* packetRef().opacity(1, 0.12);
    yield* packetRef().flyTo(
      [terminalX() - terminalWidth() / 2 - vW() * 0.008, terminalY()],
      0.7,
    );
    yield* packetRef().opacity(0, 0.12);
  }

  /** Édition d'une ligne : le curseur arrive, la ligne change, la surbrillance pulse. */
  function* editLine(
    lineIndex: number,
    editedText: string,
    cursorRef: typeof blueCursor,
    highlightRef: typeof blueHighlight,
  ) {
    highlightRef().absolutePosition(lineCenterPosition(lineIndex));
    yield* all(
      cursorRef().absolutePosition(lineEndPosition(lineIndex), 0.7, easeInOutCubic),
      highlightRef().opacity(1, 0.4),
    );
    planTerminal().line(lineIndex)!.text(editedText);
    cursorRef().absolutePosition(lineEndPosition(lineIndex));
    yield* highlightRef().opacity(0, 0.6);
  }

  /** Une chaise s'illumine (ou s'éteint) sous le curseur. */
  function* lightChair(chairIndex: number, isLit: boolean, duration: number) {
    yield* all(
      chairRefs[chairIndex]().fill(isLit ? PALETTE.jaune : PALETTE.ghost, duration),
      chairRefs[chairIndex]().shadowBlur(isLit ? vW() * 0.018 : 0, duration),
    );
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Le fichier, alimenté par le solveur
  yield* waitUntil('json');
  yield* gridRef().opacity(0.07, 0.8);
  yield* all(
    planTerminal().opacity(1, 0.6),
    solverNode().opacity(1, 0.6),
  );
  solverEdge().opacity(1);
  yield* solverEdge().end(1, 0.5, easeInOutCubic);
  planTerminal().writeLine('[', 'ghost');
  yield* all(feedPacket(feedPacketA), planTerminal().typewrite(jsonEntryA, {color: 'cream', charDelay: 0.012}));
  yield* all(feedPacket(feedPacketB), planTerminal().typewrite(jsonEntryB, {color: 'cream', charDelay: 0.012}));
  yield* all(feedPacket(feedPacketA), planTerminal().typewrite(jsonEntryC, {color: 'cream', charDelay: 0.012}));
  planTerminal().writeLine(']', 'ghost');
  yield* waitFor(0.5);

  // 2. Deux éditeurs, un seul fichier
  yield* waitUntil('edition');
  yield* all(
    bluePerson().opacity(1, 0.5),
    rosePerson().opacity(1, 0.5),
  );
  blueArrow().opacity(1);
  roseArrow().opacity(1);
  yield* all(
    blueArrow().end(1, 0.5, easeInOutCubic),
    roseArrow().end(1, 0.5, easeInOutCubic),
  );
  blueCursor().absolutePosition(lineEndPosition(1));
  roseCursor().absolutePosition(lineEndPosition(3));
  yield* all(
    blueCursor().opacity(1, 0.3),
    roseCursor().opacity(1, 0.3),
  );
  yield* all(
    editLine(2, jsonEntryBEdited, blueCursor, blueHighlight),
    editLine(3, jsonEntryCEdited, roseCursor, roseHighlight),
  );
  yield* waitFor(0.4);

  // 3. Lecture seule : une flèche, aucun retour
  yield* waitUntil('lecture-seule');
  yield* all(
    bluePerson().opacity(0.25, 0.5),
    rosePerson().opacity(0.25, 0.5),
    blueArrow().opacity(0.25, 0.5),
    roseArrow().opacity(0.25, 0.5),
    blueCursor().opacity(0, 0.4),
    roseCursor().opacity(0, 0.4),
    appNode().opacity(1, 0.6),
  );
  readEdge().opacity(1);
  yield* readEdge().end(1, 0.8, easeInOutCubic);
  yield* readEye().opacity(1, 0.4);
  yield* waitFor(0.6);

  // 4. Vue de dessus : survol d'une chaise
  yield* waitUntil('survol');
  yield* all(
    planTerminal().opacity(0, 0.5),
    solverNode().opacity(0, 0.5),
    solverEdge().opacity(0, 0.5),
    bluePerson().opacity(0, 0.5),
    rosePerson().opacity(0, 0.5),
    blueArrow().opacity(0, 0.5),
    roseArrow().opacity(0, 0.5),
    appNode().opacity(0, 0.5),
    readEdge().opacity(0, 0.5),
    readEye().opacity(0, 0.5),
  );
  yield* topViewFrame().opacity(1, 0.6);
  hoverCursor().position(framePoint(chairRadius() + vW() * 0.12, vH() * 0.2));
  yield* hoverCursor().opacity(1, 0.3);
  for (let chairIndex = 0; chairIndex <= highlightedChairIndex; chairIndex++) {
    yield* hoverCursor().position(
      framePoint(
        ringX(chairRadius(), chairIndex, chairCount) + vW() * 0.008,
        ringY(chairRadius(), chairIndex, chairCount) + vW() * 0.008,
      ),
      0.6,
      easeInOutCubic,
    );
    yield* lightChair(chairIndex, true, 0.2);
    if (chairIndex < highlightedChairIndex) {
      yield* lightChair(chairIndex, false, 0.25);
    }
  }
  yield* guestCard().opacity(1, 0.4);
  yield* waitFor(0.8);

  // 5. Lumières : intensité, couleur, ciel jour → nuit
  yield* waitUntil('lumieres');
  yield* all(
    guestCard().opacity(0, 0.4),
    lightChair(highlightedChairIndex, false, 0.4),
    lightsLayer().opacity(1, 0.6),
    sliderGroup().opacity(1, 0.6),
  );
  yield* hoverCursor().position(
    [sliderLeft() + (sliderRight() - sliderLeft()) * 0.25, sliderY() - vH() * 0.006],
    0.7,
    easeInOutCubic,
  );
  yield* all(
    hoverCursor().position(
      [sliderLeft() + (sliderRight() - sliderLeft()) * 0.6, sliderY() - vH() * 0.006],
      0.8,
      easeInOutCubic,
    ),
    lightIntensity(0.6, 0.8, easeInOutCubic),
  );
  // Couleur : ambre, puis retour au jaune chaud
  yield* hoverCursor().position([vW() * swatchXs[1], sliderY() - vH() * 0.006], 0.5, easeInOutCubic);
  yield* all(
    swatchRing().x(vW() * swatchXs[1], 0.3),
    ...lightRefs.map(lightRef => lightRef().fill(PALETTE.amber, 0.5)),
    ...lightRefs.map(lightRef => lightRef().shadowColor(PALETTE.amber, 0.5)),
  );
  yield* waitFor(0.4);
  // Bascule jour → nuit : le fond s'assombrit, les points lumineux ressortent
  yield* all(
    hoverCursor().position(
      [sliderLeft() + (sliderRight() - sliderLeft()) * 1, sliderY() - vH() * 0.006],
      1.2,
      easeInOutCubic,
    ),
    lightIntensity(1, 1.2, easeInOutCubic),
    topViewFrame().fill(nightColor, 2, easeInOutCubic),
    sunIcon().opacity(0, 1),
    moonIcon().opacity(1, 1),
  );
  yield* hoverCursor().opacity(0, 0.4);
  yield* waitFor(1.2);
});
