/**
 * pipeline-jumeau — La chaîne complète vidéo → appli (JUMEAU, fil conducteur du ch. 4).
 *
 * Huit nœuds en serpentin (deux rangées de quatre — une seule ligne serait
 * illisible en 16:9), révélés un à un pendant qu'un paquet voyage le long de la
 * chaîne et que la caméra le suit. À la fin la caméra recule : la chaîne
 * entière reste à l'écran comme carte, réutilisable entre les sous-parties.
 *
 *   Vidéo → ffmpeg → tri → COLMAP
 *                            ↓
 *   THREE.js ← Blender ← Gaussiennes ← LichtFeld
 *
 * Couleur active : cyan.
 *
 * Après la vidéo, un battement « suspense » : la caméra recule et les sept autres
 * blocs apparaissent en « ? » (lien avec la pipeline « magique » de deux-options-3d),
 * puis chacun est révélé à son tour.
 *
 * Battements : video · suspense · ffmpeg · tri · colmap · lichtfeld · gaussiennes ·
 *              blender · threejs · carte
 */
import {makeScene2D, Grid, Layout, Rect, Txt} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitUntil,
  easeInOutCubic,
} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow, Packet} from '../../components';
import {PALETTE} from '../../theme';

interface ChainStep {
  beat: string;
  key: string;
  iconName: string;
  label: string;
  sublabel?: string;
}

const CHAIN: ChainStep[] = [
  {beat: 'video',       key: 'video',       iconName: 'mdi:video',            label: 'VIDÉO',       sublabel: '3 min'},
  {beat: 'ffmpeg',      key: 'ffmpeg',      iconName: 'mdi:filmstrip',        label: 'ffmpeg',      sublabel: 'images'},
  {beat: 'tri',         key: 'tri',         iconName: 'mdi:filter-variant',   label: 'TRI'},
  {beat: 'colmap',      key: 'colmap',      iconName: 'mdi:camera',           label: 'COLMAP',      sublabel: 'poses caméra'},
  {beat: 'lichtfeld',   key: 'lichtfeld',   iconName: 'mdi:expansion-card',   label: 'LichtFeld',   sublabel: 'RTX 3070 · 7-8 h'},
  {beat: 'gaussiennes', key: 'gaussiennes', iconName: 'mdi:blur',             label: '1,5 M',       sublabel: 'gaussiennes'},
  {beat: 'blender',     key: 'blender',     iconName: 'logos:blender',        label: 'Blender',     sublabel: 'meshes'},
  {beat: 'threejs',     key: 'threejs',     iconName: 'logos:threejs',        label: 'THREE.js',    sublabel: 'appli'},
];

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie du serpentin ─────────────────────────────────────────────────
  const nodeWidth = () => vW() * 0.18;
  const nodeHeight = () => vH() * 0.27;
  const columnPitch = 0.25; // fraction de vW entre deux colonnes
  const topRowY = () => vH() * -0.22;
  const bottomRowY = () => vH() * 0.22;
  const arrowMargin = () => vW() * 0.008;

  /** Rangée 1 : gauche → droite ; rangée 2 : droite → gauche (serpentin). */
  const nodePosition = (stepIndex: number): [number, number] => {
    if (stepIndex < 4) {
      return [vW() * (-0.375 + stepIndex * columnPitch), topRowY()];
    }
    return [vW() * (-0.375 + (7 - stepIndex) * columnPitch), bottomRowY()];
  };

  /** Bord de sortie du nœud `stepIndex` et bord d'entrée du suivant. */
  const edgeAnchors = (stepIndex: number): {start: [number, number]; end: [number, number]} => {
    const [startX, startY] = nodePosition(stepIndex);
    const [endX, endY] = nodePosition(stepIndex + 1);
    if (stepIndex === 3) {
      return {
        start: [startX, startY + nodeHeight() / 2 + arrowMargin()],
        end: [endX, endY - nodeHeight() / 2 - arrowMargin()],
      };
    }
    const direction = stepIndex < 3 ? 1 : -1;
    const halfSpan = nodeWidth() / 2 + arrowMargin();
    return {
      start: [startX + direction * halfSpan, startY],
      end: [endX - direction * halfSpan, endY],
    };
  };

  // ── Caméra ─────────────────────────────────────────────────────────────────
  const zoomScale = 1.5;
  const focusCamera = (focusX: number, focusY: number, duration: number) => all(
    cameraLayout().scale(zoomScale, duration, easeInOutCubic),
    cameraLayout().position([-zoomScale * focusX, -zoomScale * focusY], duration, easeInOutCubic),
  );

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const cameraLayout = createRef<Layout>();
  const nodeRefs = CHAIN.map(() => createRef<DiagramNode>());
  const edgeRefs = CHAIN.slice(0, -1).map(() => createRef<ConnectionArrow>());
  const travelPacket = createRef<Packet>();
  // Blocs « ? » : tous les nœuds sauf le premier (suspense avant la révélation)
  const mysteryRefs = CHAIN.slice(1).map(() => createRef<Rect>());

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

    <Layout key="camera" ref={cameraLayout}
      scale={zoomScale}
      position={() => [-zoomScale * nodePosition(0)[0], -zoomScale * nodePosition(0)[1]]}
    >
      {CHAIN.slice(0, -1).map((step, stepIndex) => (
        <ConnectionArrow key={`edge-${step.key}`} ref={edgeRefs[stepIndex]}
          from={() => edgeAnchors(stepIndex).start}
          to={() => edgeAnchors(stepIndex).end}
          routing={0}
          stroke={PALETTE.cyan}
          end={0}
          opacity={0}
        />
      ))}

      {CHAIN.slice(1).map((step, mysteryIndex) => (
        <Rect key={`mystery-${step.key}`} ref={mysteryRefs[mysteryIndex]}
          width={nodeWidth} height={nodeHeight}
          x={() => nodePosition(mysteryIndex + 1)[0]}
          y={() => nodePosition(mysteryIndex + 1)[1]}
          radius={() => vW() * 0.005}
          fill={PALETTE.nodeBg}
          stroke={PALETTE.cyan + '66'}
          lineWidth={2}
          lineDash={[6, 4]}
          opacity={0}
        >
          <Txt key={`mystery-mark-${step.key}`}
            text="?"
            fill={PALETTE.cyan}
            fontSize={() => nodeHeight() * 0.5}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
            fontWeight={700}
          />
        </Rect>
      ))}

      {CHAIN.map((step, stepIndex) => (
        <DiagramNode key={`node-${step.key}`} ref={nodeRefs[stepIndex]}
          iconName={step.iconName}
          label={step.label}
          sublabel={step.sublabel}
          color={PALETTE.cyan}
          initialState="idle"
          width={nodeWidth} height={nodeHeight}
          x={() => nodePosition(stepIndex)[0]}
          y={() => nodePosition(stepIndex)[1]}
          opacity={0}
        />
      ))}

      <Packet key="travel-packet" ref={travelPacket}
        content="●"
        color={PALETTE.cyan}
        packetSize="md"
        width={() => vW() * 0.03}
        height={() => vH() * 0.045}
        x={() => nodePosition(0)[0]}
        y={() => nodePosition(0)[1]}
        opacity={0}
      />
    </Layout>
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // Premier nœud : la vidéo
  yield* waitUntil(CHAIN[0].beat);
  yield* gridRef().opacity(0.07, 0.8);
  yield* all(
    nodeRefs[0]().opacity(1, 0.6),
    nodeRefs[0]().setState('active', 0.6),
  );

  // Suspense : la caméra recule, tout le reste de la chaîne n'est que « ? »
  yield* waitUntil('suspense');
  yield* all(
    cameraLayout().scale(1, 1, easeInOutCubic),
    cameraLayout().position([0, 0], 1, easeInOutCubic),
  );
  yield* sequence(0.12, ...mysteryRefs.map(mystery => mystery().opacity(1, 0.3)));

  // Chaque battement suivant : la caméra suit le paquet jusqu'au nœud suivant
  for (let stepIndex = 1; stepIndex < CHAIN.length; stepIndex++) {
    yield* waitUntil(CHAIN[stepIndex].beat);

    const [previousX, previousY] = nodePosition(stepIndex - 1);
    const [currentX, currentY] = nodePosition(stepIndex);
    const {start, end} = edgeAnchors(stepIndex - 1);
    const edge = edgeRefs[stepIndex - 1];

    edge().opacity(1);
    travelPacket().position(start);
    yield* all(
      focusCamera((previousX + currentX) / 2, (previousY + currentY) / 2, 0.8),
      edge().end(1, 0.6, easeInOutCubic),
      travelPacket().opacity(1, 0.3),
    );
    yield* travelPacket().flyTo(end, 0.6);
    yield* all(
      travelPacket().opacity(0, 0.2),
      mysteryRefs[stepIndex - 1]().opacity(0, 0.5),
      nodeRefs[stepIndex]().opacity(1, 0.5),
      nodeRefs[stepIndex]().setState('active', 0.5),
    );
  }

  // La carte : la caméra recule, toute la chaîne reste à l'écran
  yield* waitUntil('carte');
  yield* all(
    cameraLayout().scale(1, 1.2, easeInOutCubic),
    cameraLayout().position([0, 0], 1.2, easeInOutCubic),
  );
  yield* sequence(0.12, ...nodeRefs.map(node => node().setState('highlighted', 0.25)));
  yield* all(...nodeRefs.map(node => node().setState('active', 0.5)));
});
