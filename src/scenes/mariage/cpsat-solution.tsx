/**
 * cpsat-solution — Le solveur CP-SAT place les 60 convives (chapitre 3, SOLVEUR).
 *
 * Les trois types de règles entrent dans le solveur ; il sort une table
 * d'honneur + 7 tables rondes et tous les liens passent au vert. Une loupe
 * valide table par table, une retouche à la main n'abîme rien. Le même nuage
 * est ensuite réutilisé pour répartir les invités dans des chambres.
 *
 * Couleur active : vert. Les liens partent de jaune (règle) / rose (à éloigner).
 * Données et géométrie de salle partagées : ./salle.ts
 */
import {makeScene2D, Circle, Grid, Icon, Line, Rect} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeInOutCubic,
  easeOutCubic,
  Reference,
  sequence,
  waitUntil,
} from '@motion-canvas/core';
import {DiagramNode} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxReset, sfxFlush} from '../../sfx';
import {
  cloudPos,
  COUPLES,
  GUEST_COUNT,
  GUESTS,
  GUESTS_SOLVEUR,
  honorTableSize,
  RETOUCHE,
  SEPARATIONS,
  seatDotRadius,
  seatSlot,
  tableCenter,
  tableRadius,
  TABLE_COUNT,
  TRIOS,
} from './salle';

const range = (first: number, last: number) =>
  Array.from({length: last - first + 1}, (_, k) => first + k);

// ── Chambres : 15 chambres de 4 lits ─────────────────────────────────────────

const ROOM_COLUMNS = 5;
const ROOM_COUNT = 15;
const BEDS_PER_ROOM = 4;

/** Centre de la chambre (fractions vW / vH). */
const roomCenterFraction = (room: number): [number, number] => [
  ((room % ROOM_COLUMNS) - 2) * 0.18,
  (Math.floor(room / ROOM_COLUMNS) - 1) * 0.27 + 0.05,
];
const bedFraction = (room: number, bed: number): [number, number] => {
  const [roomX, roomY] = roomCenterFraction(room);
  return [roomX + ((bed % 2) - 0.5) * 0.06, roomY + (Math.floor(bed / 2) - 0.5) * 0.1];
};

// ── Liens de règles ──────────────────────────────────────────────────────────

const chainPairs = (members: readonly number[]) =>
  members.slice(0, -1).map((id, k) => [id, members[k + 1]] as const);

const SOLID_LINKS: ReadonlyArray<readonly [number, number]> = [
  ...COUPLES.map(([first, second]) => [first, second] as const),
  ...TRIOS.flatMap(trio => chainPairs(trio)),
];

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const solverNode = createRef<DiagramNode>();
  const dotRefs: Reference<Circle>[] = GUESTS_SOLVEUR.map(() => createRef<Circle>());
  const chipRefs: Reference<Circle>[] = [0, 1, 2].map(() => createRef<Circle>());
  const solidLinkRefs: Reference<Line>[] = SOLID_LINKS.map(() => createRef<Line>());
  const separationLinkRefs: Reference<Line>[] = SEPARATIONS.map(() => createRef<Line>());
  const honorTableRef = createRef<Rect>();
  const roundTableRefs: Reference<Circle>[] = range(1, TABLE_COUNT - 1).map(() => createRef<Circle>());
  const magnifierRef = createRef<Icon>();
  const handRef = createRef<Icon>();
  const roomRefs: Reference<Rect>[] = range(0, ROOM_COUNT - 1).map(() => createRef<Rect>());
  const bedRefs: Reference<Rect>[] = range(0, GUEST_COUNT - 1).map(() => createRef<Rect>());

  const ruleChips = [
    {icon: 'mdi:link-variant', y: -0.18},
    {icon: 'mdi:magnet', y: 0},
    {icon: 'mdi:arrow-left-right', y: 0.18},
  ];

  const nodeCenter = (): [number, number] => [0, 0];
  const nodeCorner = (): [number, number] => [vW() * -0.41, vH() * -0.42];

  /** Stroke d'une table (honneur = Rect, rondes = Circle). */
  const tableStroke = (table: number, color: string, duration: number) =>
    table === 0
      ? honorTableRef().stroke(color, duration)
      : roundTableRefs[table - 1]().stroke(color, duration);

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid
      key="bg-grid"
      ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0.12}
    />

    {/* Tables */}
    <Rect key="table-honneur" ref={honorTableRef}
      width={() => honorTableSize(vW, vH)[0]}
      height={() => honorTableSize(vW, vH)[1]}
      x={() => tableCenter(0, vW, vH)[0]}
      y={() => tableCenter(0, vW, vH)[1]}
      radius={() => vW() * 0.006}
      fill={'#00000000'}
      stroke={PALETTE.ghost}
      lineWidth={2}
      opacity={0}
    />
    {range(1, TABLE_COUNT - 1).map(table => (
      <Circle key={`table-ronde-${table}`} ref={roundTableRefs[table - 1]}
        size={() => tableRadius(vW) * 2}
        x={() => tableCenter(table, vW, vH)[0]}
        y={() => tableCenter(table, vW, vH)[1]}
        fill={'#00000000'}
        stroke={PALETTE.ghost}
        lineWidth={2}
        opacity={0}
      />
    ))}

    {/* Chambres + lits */}
    {range(0, ROOM_COUNT - 1).map(room => (
      <Rect key={`room-${room}`} ref={roomRefs[room]}
        width={() => vW() * 0.15}
        height={() => vH() * 0.22}
        x={() => vW() * roomCenterFraction(room)[0]}
        y={() => vH() * roomCenterFraction(room)[1]}
        radius={() => vW() * 0.006}
        fill={PALETTE.vert + '0F'}
        stroke={PALETTE.vert + '99'}
        lineWidth={2}
        opacity={0}
      />
    ))}
    {range(0, GUEST_COUNT - 1).map(guestId => (
      <Rect key={`bed-${guestId}`} ref={bedRefs[guestId]}
        width={() => vW() * 0.04}
        height={() => vW() * 0.04}
        x={() => vW() * bedFraction(Math.floor(guestId / BEDS_PER_ROOM), guestId % BEDS_PER_ROOM)[0]}
        y={() => vH() * bedFraction(Math.floor(guestId / BEDS_PER_ROOM), guestId % BEDS_PER_ROOM)[1]}
        radius={() => vW() * 0.004}
        fill={'#00000000'}
        stroke={PALETTE.secondary}
        lineWidth={1}
        opacity={0}
      />
    ))}

    {/* Liens de règles : jaune (ensemble) et rose tireté (à éloigner), puis vert */}
    {SOLID_LINKS.map(([first, second], linkIndex) => (
      <Line key={`link-solid-${linkIndex}`} ref={solidLinkRefs[linkIndex]}
        points={() => [
          [dotRefs[first]().x(), dotRefs[first]().y()],
          [dotRefs[second]().x(), dotRefs[second]().y()],
        ]}
        stroke={PALETTE.jaune}
        lineWidth={3}
        opacity={0}
      />
    ))}
    {SEPARATIONS.map(([first, second], pairIndex) => (
      <Line key={`link-separation-${pairIndex}`} ref={separationLinkRefs[pairIndex]}
        points={() => [
          [dotRefs[first]().x(), dotRefs[first]().y()],
          [dotRefs[second]().x(), dotRefs[second]().y()],
        ]}
        stroke={PALETTE.rose}
        lineWidth={2}
        lineDash={() => [vW() * 0.006, vW() * 0.005]}
        opacity={0}
      />
    ))}

    {/* Les 60 invités (nuage de départ) */}
    {GUESTS_SOLVEUR.map(guest => (
      <Circle key={`dot-${guest.id}`} ref={dotRefs[guest.id]}
        size={() => seatDotRadius(vW) * 2}
        x={() => cloudPos(guest.id, vW, vH)[0]}
        y={() => cloudPos(guest.id, vW, vH)[1]}
        fill={PALETTE.cream}
        opacity={0}
      />
    ))}

    {/* Les trois types de règles */}
    {ruleChips.map((chip, chipIndex) => (
      <Circle key={`rule-chip-${chipIndex}`} ref={chipRefs[chipIndex]}
        size={() => vW() * 0.07}
        x={() => vW() * -0.36}
        y={() => vH() * chip.y}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.jaune}
        lineWidth={2}
        opacity={0}
      >
        <Icon key={`rule-chip-icon-${chipIndex}`}
          icon={chip.icon}
          size={() => vW() * 0.035}
          color={PALETTE.jaune}
        />
      </Circle>
    ))}

    {/* Le solveur */}
    <DiagramNode key="cpsat-node" ref={solverNode}
      iconName="mdi:chip"
      label="CP-SAT"
      sublabel="OR-Tools"
      color={PALETTE.vert}
      initialState="idle"
      width={() => vW() * 0.16}
      height={() => vH() * 0.3}
      x={() => nodeCenter()[0]}
      y={() => nodeCenter()[1]}
      opacity={0}
    />

    {/* Outils de validation */}
    <Icon key="magnifier" ref={magnifierRef}
      icon="mdi:magnify"
      size={() => vW() * 0.05}
      color={PALETTE.vert}
      opacity={0}
    />
    <Icon key="hand" ref={handRef}
      icon="mdi:hand-back-right"
      size={() => vW() * 0.04}
      color={PALETTE.cream}
      opacity={0}
    />
  </>);

  sfxReset();

  // ── 1. solveur ──────────────────────────────────────────────────────────────
  yield* waitUntil('solveur');
  yield* all(
    sequence(0.01, ...dotRefs.map(dot => dot().opacity(0.3, 0.3))),
    solverNode().opacity(1, 0.5),
    sequence(0.15, ...chipRefs.map(chip => chip().opacity(1, 0.3))),
  );
  chipRefs.forEach((_, chipIndex) => sfx('swap', 0.6, 0.25 * chipIndex));
  yield* sequence(
    0.25,
    ...chipRefs.map(chip =>
      all(
        chip().position(nodeCenter(), 0.6, easeInOutCubic),
        chip().scale(0.3, 0.6),
        chip().opacity(0, 0.6),
      )),
  );
  sfx('activate');
  yield* solverNode().setState('active', 0.2);

  // ── 2. tables ───────────────────────────────────────────────────────────────
  yield* waitUntil('tables');
  sfx('travel', 0.5);
  yield* all(
    solverNode().position(nodeCorner(), 0.7, easeInOutCubic),
    solverNode().scale(0.5, 0.7, easeInOutCubic),
    honorTableRef().opacity(0.7, 0.6),
    ...roundTableRefs.map(table => table().opacity(0.7, 0.6)),
    ...dotRefs.map(dot => dot().opacity(1, 0.4)),
  );
  range(0, TABLE_COUNT - 1).forEach(table => sfx('tick', 0.9, 0.15 * table));
  sfx('travel', 0.5);
  yield* sequence(
    0.15,
    ...range(0, TABLE_COUNT - 1).map(table =>
      all(
        ...GUESTS_SOLVEUR.filter(guest => guest.table === table).map(guest =>
          dotRefs[guest.id]().position(seatSlot(guest.table, guest.seat, vW, vH), 1.0, easeInOutCubic),
        ),
      )),
  );
  sfx('draw', 0.6);
  yield* all(
    ...solidLinkRefs.map(link => link().opacity(0.85, 0.4)),
    ...separationLinkRefs.map(link => link().opacity(0.55, 0.4)),
  );
  sfx('success', 0.8);
  yield* all(
    ...solidLinkRefs.map(link => link().stroke(PALETTE.vert, 0.6)),
    ...separationLinkRefs.map(link => link().stroke(PALETTE.vert, 0.6)),
    solverNode().setState('success', 0.4),
  );

  // ── 3. validation ───────────────────────────────────────────────────────────
  yield* waitUntil('validation');
  const lensOffset = () => vW() * 0.012;
  magnifierRef().position(() => [tableCenter(0, vW, vH)[0] + lensOffset(), tableCenter(0, vW, vH)[1] + lensOffset()]);
  yield* magnifierRef().opacity(1, 0.25);
  for (let table = 0; table < TABLE_COUNT; table++) {
    const [tableX, tableY] = tableCenter(table, vW, vH);
    yield* magnifierRef().position([tableX + lensOffset(), tableY + lensOffset()], 0.4, easeInOutCubic);
    sfx('tick', 0.9);
    yield* tableStroke(table, PALETTE.vert, 0.2);
  }
  yield* magnifierRef().opacity(0, 0.25);

  // Petite retouche à la main : deux convives sans contrainte échangent leur place.
  const [firstSwapped, secondSwapped] = RETOUCHE;
  const firstFinalSeat = seatSlot(GUESTS[firstSwapped].table, GUESTS[firstSwapped].seat, vW, vH);
  const secondFinalSeat = seatSlot(GUESTS[secondSwapped].table, GUESTS[secondSwapped].seat, vW, vH);
  const handOffset = () => vW() * 0.02;
  handRef().position(() => [dotRefs[firstSwapped]().x() + handOffset(), dotRefs[firstSwapped]().y() + handOffset()]);
  yield* handRef().opacity(1, 0.3);
  sfx('swap', 0.7);
  yield* all(
    dotRefs[firstSwapped]().position(firstFinalSeat, 0.9, easeInOutCubic),
    dotRefs[secondSwapped]().position(secondFinalSeat, 0.9, easeInOutCubic),
    dotRefs[firstSwapped]().fill(PALETTE.vert, 0.4),
    dotRefs[secondSwapped]().fill(PALETTE.vert, 0.4),
  );
  yield* all(
    dotRefs[firstSwapped]().fill(PALETTE.cream, 0.4),
    dotRefs[secondSwapped]().fill(PALETTE.cream, 0.4),
    handRef().opacity(0, 0.3),
  );

  // ── 4. chambres ─────────────────────────────────────────────────────────────
  yield* waitUntil('chambres');
  yield* all(
    ...solidLinkRefs.map(link => link().opacity(0, 0.3)),
    ...separationLinkRefs.map(link => link().opacity(0, 0.3)),
    honorTableRef().opacity(0, 0.3),
    ...roundTableRefs.map(table => table().opacity(0, 0.3)),
    solverNode().setState('active', 0.1),
  );
  // Même nuage qu'au départ…
  sfx('travel', 0.5);
  yield* all(...dotRefs.map((dot, guestId) => dot().position(cloudPos(guestId, vW, vH), 0.5, easeOutCubic)));
  // …réparti dans les chambres, en un clin d'œil.
  yield* all(
    ...roomRefs.map(room => room().opacity(1, 0.3)),
    ...bedRefs.map(bed => bed().opacity(1, 0.3)),
  );
  sfx('travel', 0.5);
  yield* all(
    ...dotRefs.map((dot, guestId) => {
      const [bedX, bedY] = bedFraction(Math.floor(guestId / BEDS_PER_ROOM), guestId % BEDS_PER_ROOM);
      return dot().position([vW() * bedX, vH() * bedY], 0.6, easeInOutCubic);
    }),
  );
  sfx('success', 0.8);
  yield* solverNode().setState('success', 0.3);
  sfxFlush('cpsat-solution');
});
