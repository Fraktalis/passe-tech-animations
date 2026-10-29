/**
 * questions-prestataires — BASCULE : le salon, les stands, les questions.
 *
 * Les deux mariés au centre, huit prestataires en cercle. Chacun envoie une
 * bulle `?` vers eux ; deux bulles portent « Quel jour ? » et « Combien ? ».
 * Aucune flèche retour : les mariés restent sans réponse. Seule certitude, le
 * wedding planner est barré. Les bulles restent en pile, les mariés rétrécissent.
 *
 * Couleur active : jaune (les questions). Rose uniquement pour le planner barré.
 *
 * Battements : stands · questions · wedding-planner · pas-prets
 */
import {makeScene2D, Grid, Icon, Layout, Line} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createRefArray,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';
import {DiagramNode, Packet} from '../../components';
import {PALETTE} from '../../theme';

interface Vendor {
  label: string;
  icon: string;
  /** Position de repos de la bulle, en fractions de [vW, vH], autour des mariés. */
  bubbleRest: [number, number];
  bubbleText: string;
}

/** Ordre : en partant du haut puis dans le sens horaire. Le planner est le dernier. */
const VENDORS: Vendor[] = [
  {label: 'PHOTO',      icon: 'mdi:camera',         bubbleRest: [-0.07, -0.135], bubbleText: 'Quel jour ?'},
  {label: 'VIDÉO',      icon: 'mdi:video',          bubbleRest: [0.075, -0.135], bubbleText: 'Combien ?'},
  {label: 'TRAITEUR',   icon: 'mdi:chef-hat',       bubbleRest: [0.115, -0.045], bubbleText: '?'},
  {label: 'DJ',         icon: 'mdi:vinyl',          bubbleRest: [0.11, 0.045],   bubbleText: '?'},
  {label: 'FLEURISTE',  icon: 'mdi:flower',         bubbleRest: [0.045, 0.125],  bubbleText: '?'},
  {label: 'MAGICIEN',   icon: 'mdi:wizard-hat',     bubbleRest: [-0.045, 0.125], bubbleText: '?'},
  {label: 'COCKTAIL',   icon: 'mdi:glass-cocktail', bubbleRest: [-0.11, 0.045],  bubbleText: '?'},
  {label: 'PLANNER',    icon: 'mdi:calendar-heart', bubbleRest: [-0.115, -0.045], bubbleText: '?'},
];
const PLANNER_INDEX = VENDORS.length - 1;

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const orbitRadiusX = 0.34;
  const orbitRadiusY = 0.34;
  const vendorX = (vendorIndex: number) =>
    vW() * orbitRadiusX * Math.sin((vendorIndex * Math.PI) / 4);
  const vendorY = (vendorIndex: number) =>
    -vH() * orbitRadiusY * Math.cos((vendorIndex * Math.PI) / 4);
  const nodeWidth = () => vW() * 0.1;
  const nodeHeight = () => vH() * 0.2;
  const isTextBubble = (bubbleText: string) => bubbleText.length > 1;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const coupleGroup = createRef<Layout>();
  const vendorNodes = createRefArray<DiagramNode>();
  const bubbles = createRefArray<Packet>();
  const plannerStrike = createRef<Line>();

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

    {/* Les deux mariés, sans nom */}
    <Layout key="couple-group" ref={coupleGroup} opacity={0}>
      <Icon
        key="icon-alex"
        icon="mdi:account"
        color={PALETTE.blue}
        size={() => vW() * 0.06}
        x={() => vW() * -0.03}
      />
      <Icon
        key="icon-wife"
        icon="mdi:account"
        color={PALETTE.rose}
        size={() => vW() * 0.06}
        x={() => vW() * 0.03}
      />
    </Layout>

    {/* Huit stands prestataires */}
    {VENDORS.map((vendor, vendorIndex) => (
      <DiagramNode
        key={`vendor-node-${vendorIndex}`}
        ref={vendorNodes}
        iconName={vendor.icon}
        label={vendor.label}
        color={PALETTE.secondary}
        initialState="idle"
        width={nodeWidth}
        height={nodeHeight}
        x={() => vendorX(vendorIndex)}
        y={() => vendorY(vendorIndex)}
        opacity={0}
      />
    ))}

    {/* Barre diagonale sur le wedding planner */}
    <Line
      key="planner-strike"
      ref={plannerStrike}
      points={() => [
        [vendorX(PLANNER_INDEX) - nodeWidth() * 0.6, vendorY(PLANNER_INDEX) - nodeHeight() * 0.6],
        [vendorX(PLANNER_INDEX) + nodeWidth() * 0.6, vendorY(PLANNER_INDEX) + nodeHeight() * 0.6],
      ]}
      stroke={PALETTE.rose}
      lineWidth={4}
      end={0}
      opacity={0}
    />

    {/* Bulles de questions — départ au niveau des prestataires */}
    {VENDORS.map((vendor, vendorIndex) => (
      <Packet
        key={`bubble-${vendorIndex}`}
        ref={bubbles}
        content={vendor.bubbleText}
        color={PALETTE.jaune}
        packetSize="md"
        width={() => vW() * (isTextBubble(vendor.bubbleText) ? 0.085 : 0.032)}
        height={() => vH() * 0.06}
        x={() => vendorX(vendorIndex) * 0.7}
        y={() => vendorY(vendorIndex) * 0.7}
        opacity={0}
      />
    ))}
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. stands — les mariés puis huit prestataires en cercle
  yield* waitUntil('stands');
  yield* all(
    gridRef().opacity(0.07, 0.8),
    coupleGroup().opacity(1, 0.6),
  );
  yield* sequence(0.18, ...vendorNodes.map(vendorNode => vendorNode.opacity(1, 0.45)));
  yield* waitFor(0.4);

  // 2. questions — chaque prestataire envoie sa bulle, rien ne revient
  yield* waitUntil('questions');
  for (let vendorIndex = 0; vendorIndex < VENDORS.length; vendorIndex++) {
    const [restX, restY] = VENDORS[vendorIndex].bubbleRest;
    yield vendorNodes[vendorIndex].setState('active', 0.2);
    yield bubbles[vendorIndex].opacity(1, 0.2);
    yield* bubbles[vendorIndex].flyTo([vW() * restX, vH() * restY], 0.9);
    yield vendorNodes[vendorIndex].setState('idle', 0.4);
    yield* waitFor(0.1);
  }
  yield* waitFor(0.6);

  // 3. wedding-planner — la seule certitude : barré, puis estompé
  yield* waitUntil('wedding-planner');
  yield* vendorNodes[PLANNER_INDEX].setState('error', 0.2);
  plannerStrike().opacity(1);
  yield* plannerStrike().end(1, 0.5, easeOutCubic);
  yield* waitFor(0.4);
  yield* all(
    vendorNodes[PLANNER_INDEX].opacity(0.25, 0.7),
    plannerStrike().opacity(0.25, 0.7),
  );

  // 4. pas-prets — la pile reste, les mariés rétrécissent
  yield* waitUntil('pas-prets');
  yield* all(
    coupleGroup().scale(0.8, 1.2, easeInOutCubic),
    ...bubbles.map(bubble => bubble.lineWidth(3, 0.6)),
  );
  yield* waitFor(1.5);
});
