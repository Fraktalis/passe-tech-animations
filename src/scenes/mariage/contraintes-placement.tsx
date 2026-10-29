/**
 * contraintes-placement — Les règles de placement (chapitre 3, SOLVEUR).
 *
 * 60 points en nuage désordonné, puis trois familles de règles : liens
 * rigides (couples, trios, familles), attraction (collègues, amis) et
 * répulsion (paires à éloigner). Enfin les essais à la main : chaque essai
 * casse une règle, et le compteur de combinaisons explose.
 *
 * Couleur active : jaune. Rose uniquement pour les règles violées.
 * Données et géométrie de salle partagées : ./salle.ts
 */
import {makeScene2D, Circle, Grid, Icon, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  Reference,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';
import {sfx, sfxFill, sfxReset, sfxFlush} from '../../sfx';
import {
  cloudPos,
  COUPLES,
  Dim,
  GROUPS,
  GUEST_COUNT,
  GUESTS_SOLVEUR,
  hashUnit,
  honorTableSize,
  SEPARATIONS,
  seatDotRadius,
  seatSlot,
  tableCenter,
  tableRadius,
  TABLE_COUNT,
  TABLE_SIZES,
} from './salle';

// ── Disposition « règles appliquées » : une grille en serpentin ──────────────
// Chaque unité (couple, trio, famille, convive seul) occupe une cellule. Les
// paires à éloigner sont rangées dans des cellules voisines pour que le ressort
// rose reste court et lisible.

const COLUMNS = 9;
const ROWS = 4;
const CELL_STEP_X = 0.095; // fraction de vW
const CELL_STEP_Y = 0.2;   // fraction de vH
const DOT_GAP = 0.022;     // fraction de vW entre deux points d'une même unité
const UNIT_PADDING = 0.016; // fraction de vW autour des points d'une unité
const CLUSTER_PATH_INDEX = 33; // cellules réservées aux deux groupes d'affinité

const range = (first: number, last: number) =>
  Array.from({length: last - first + 1}, (_, k) => first + k);

/** Éléments dans l'ordre du serpentin (paires à éloigner voisines). */
const ITEMS: number[][] = [
  [2, 3], [59], [0, 1], [4, 5, 6], [7, 8], [37], [9, 10], [11, 12, 13], [14],
  [44], [15, 16], [17, 18], [19], [52, 53], [54, 55], [56, 57, 58], [20], [21],
  range(29, 36), [49, 50], [51], [22], [23], [24], [25],
  [26, 27], [28], [38], [39], [40], [41], [42, 43], range(45, 48),
];

interface Unit {
  members: number[];
  x: number;
  y: number;
  width: number;
  height: number;
  isFamily: boolean;
}

interface Stages {
  stage1: [number, number][];
  stage2: [number, number][];
  units: Unit[];
  clusterCenters: [number, number][];
}

function pathCell(pathIndex: number): [number, number] {
  const row = Math.floor(pathIndex / COLUMNS);
  const columnInRow = pathIndex % COLUMNS;
  const column = row % 2 === 0 ? columnInRow : COLUMNS - 1 - columnInRow;
  return [(column - (COLUMNS - 1) / 2) * CELL_STEP_X, (row - (ROWS - 1) / 2) * CELL_STEP_Y];
}

/** Décalages (en pas de DOT_GAP) pour `count` points, centrés sur la cellule. */
function arrangement(count: number): {offsets: [number, number][]; columns: number; rows: number} {
  const columns = count <= 3 ? count : Math.ceil(count / 2);
  const rows = Math.ceil(count / columns);
  const offsets: [number, number][] = [];
  for (let k = 0; k < count; k++) {
    const row = Math.floor(k / columns);
    const itemsInRow = row < rows - 1 ? columns : count - columns * (rows - 1);
    offsets.push([(k % columns) - (itemsInRow - 1) / 2, row - (rows - 1) / 2]);
  }
  return {offsets, columns, rows};
}

const stagesCache: {key: string; value: Stages | null} = {key: '', value: null};

function getStages(vW: Dim, vH: Dim): Stages {
  const key = `${vW()}x${vH()}`;
  if (stagesCache.key === key && stagesCache.value) return stagesCache.value;

  const cellOfPerson = new Map<number, [number, number]>();
  ITEMS.forEach((members, itemIndex) => {
    members.forEach(id => cellOfPerson.set(id, pathCell(itemIndex)));
  });
  const partnersOf = new Map<number, number[]>();
  SEPARATIONS.forEach(([first, second]) => {
    partnersOf.set(first, [...(partnersOf.get(first) ?? []), second]);
    partnersOf.set(second, [...(partnersOf.get(second) ?? []), first]);
  });
  // Le membre à éloigner se place du côté de son partenaire (ressort court, sans croiser l'unité).
  const sideKey = (id: number) =>
    (partnersOf.get(id) ?? []).reduce(
      (sum, partner) => sum + Math.sign(cellOfPerson.get(partner)![0] - cellOfPerson.get(id)![0]),
      0,
    );

  const stage1: [number, number][] = new Array(GUEST_COUNT);
  const units: Unit[] = [];
  ITEMS.forEach((members, itemIndex) => {
    const [cellX, cellY] = pathCell(itemIndex);
    const ordered = [...members].sort((a, b) => sideKey(a) - sideKey(b));
    const {offsets, columns, rows} = arrangement(ordered.length);
    ordered.forEach((id, k) => {
      stage1[id] = [
        vW() * cellX + offsets[k][0] * DOT_GAP * vW(),
        vH() * cellY + offsets[k][1] * DOT_GAP * vW(),
      ];
    });
    if (members.length >= 2) {
      units.push({
        members,
        x: vW() * cellX,
        y: vH() * cellY,
        width: ((columns - 1) * DOT_GAP + 2 * UNIT_PADDING) * vW(),
        height: ((rows - 1) * DOT_GAP + 2 * UNIT_PADDING) * vW(),
        isFamily: members.length >= 4,
      });
    }
  });

  const stage2 = stage1.map(point => [...point] as [number, number]);
  const clusterCenters: [number, number][] = [];
  GROUPS.forEach((members, groupIndex) => {
    const [cellX, cellY] = pathCell(CLUSTER_PATH_INDEX + groupIndex);
    clusterCenters.push([vW() * cellX, vH() * cellY]);
    const {offsets} = arrangement(members.length);
    members.forEach((id, k) => {
      stage2[id] = [
        vW() * cellX + offsets[k][0] * DOT_GAP * vW(),
        vH() * cellY + offsets[k][1] * DOT_GAP * vW(),
      ];
    });
  });

  stagesCache.key = key;
  stagesCache.value = {stage1, stage2, units, clusterCenters};
  return stagesCache.value;
}

// ── Ressort (zigzag) entre deux points ───────────────────────────────────────

function springPoints(
  startX: number, startY: number, endX: number, endY: number, amplitude: number,
): [number, number][] {
  const segments = 10;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const normalX = -deltaY / length;
  const normalY = deltaX / length;
  const points: [number, number][] = [[startX, startY]];
  for (let k = 1; k < segments; k++) {
    const side = k % 2 === 0 ? -1 : 1;
    points.push([
      startX + (deltaX * k) / segments + normalX * amplitude * side,
      startY + (deltaY * k) / segments + normalY * amplitude * side,
    ]);
  }
  points.push([endX, endY]);
  return points;
}

// ── Essais à la main : répartition aléatoire sur les tables ──────────────────

function attemptAssignment(attempt: number): {table: number; seat: number}[] {
  const order = range(0, GUEST_COUNT - 1).sort(
    (a, b) => hashUnit(a * 13 + attempt * 101 + 7) - hashUnit(b * 13 + attempt * 101 + 7),
  );
  const assignment: {table: number; seat: number}[] = new Array(GUEST_COUNT);
  let cursor = 0;
  TABLE_SIZES.forEach((size, table) => {
    for (let seat = 0; seat < size; seat++, cursor++) {
      assignment[order[cursor]] = {table, seat};
    }
  });
  return assignment;
}

/** Nombre de façons de répartir 60 convives sur ces 8 tables (multinomiale), en puissance de 10. */
const log10Factorial = (n: number) => {
  let sum = 0;
  for (let k = 2; k <= n; k++) sum += Math.log10(k);
  return sum;
};
const COMBINATIONS_EXPONENT = Math.floor(
  log10Factorial(GUEST_COUNT) - TABLE_SIZES.reduce((sum, size) => sum + log10Factorial(size), 0),
); // 48

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const stages = () => getStages(vW, vH);

  // Règles pouvant être violées lors d'un essai : couples (séparés) et paires à éloigner (réunies).
  const ruleLinks: {first: number; second: number; kind: 'couple' | 'separation'}[] = [
    ...COUPLES.map(([first, second]) => ({first, second, kind: 'couple' as const})),
    ...SEPARATIONS.map(([first, second]) => ({first, second, kind: 'separation' as const})),
  ];
  const familyUnitOrder = (unit: Unit) => (unit.isFamily ? 1 : 0);
  const unitRevealOrder = stages()
    .units.map((unit, unitIndex) => ({unit, unitIndex}))
    .sort((a, b) => familyUnitOrder(a.unit) - familyUnitOrder(b.unit))
    .map(entry => entry.unitIndex);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const counterRef = createRef<Layout>();
  const combinationsRef = createRef<Layout>();
  const dotRefs: Reference<Circle>[] = GUESTS_SOLVEUR.map(() => createRef<Circle>());
  const unitRefs: Reference<Rect>[] = stages().units.map(() => createRef<Rect>());
  const elasticRefs: Reference<Line>[] = GROUPS.flat().map(() => createRef<Line>());
  const clusterRingRefs: Reference<Circle>[] = GROUPS.map(() => createRef<Circle>());
  const springRefs: Reference<Line>[] = SEPARATIONS.map(() => createRef<Line>());
  const springLabelRefs: Reference<Txt>[] = SEPARATIONS.map(() => createRef<Txt>());
  const ruleLinkRefs: Reference<Line>[] = ruleLinks.map(() => createRef<Line>());
  const honorTableRef = createRef<Rect>();
  const roundTableRefs: Reference<Circle>[] = range(1, TABLE_COUNT - 1).map(() => createRef<Circle>());

  const guestCount = createSignal(0);
  const springAmplitude = createSignal(0.013); // fraction de vW
  const combinationsExponent = createSignal(COMBINATIONS_EXPONENT);
  const combinationsLabelRef = createRef<Txt>();

  const separatedGuests = SEPARATIONS.flat();
  const groupMembers = GROUPS.flat();

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

    {/* Tables (visibles seulement pour les essais à la main) */}
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

    {/* Contours des unités rigides : capsules (couples, trios) et familles */}
    {stages().units.map((unit, unitIndex) => (
      <Rect key={`unit-contour-${unitIndex}`} ref={unitRefs[unitIndex]}
        x={() => stages().units[unitIndex].x}
        y={() => stages().units[unitIndex].y}
        width={() => stages().units[unitIndex].width}
        height={() => stages().units[unitIndex].height}
        radius={() => (unit.isFamily ? vW() * 0.012 : stages().units[unitIndex].height / 2)}
        fill={PALETTE.jaune + (unit.isFamily ? '10' : '18')}
        stroke={PALETTE.jaune}
        lineWidth={unit.isFamily ? 2 : 3}
        opacity={0}
      />
    ))}

    {/* Anneaux des deux groupes d'affinité */}
    {GROUPS.map((_, groupIndex) => (
      <Circle key={`cluster-ring-${groupIndex}`} ref={clusterRingRefs[groupIndex]}
        size={() => vW() * 0.1}
        x={() => stages().clusterCenters[groupIndex][0]}
        y={() => stages().clusterCenters[groupIndex][1]}
        fill={PALETTE.jaune + '10'}
        stroke={PALETTE.jaune}
        lineWidth={2}
        lineDash={() => [vW() * 0.006, vW() * 0.005]}
        opacity={0}
      />
    ))}

    {/* Élastiques tiretés : membre du groupe → centre du groupe */}
    {groupMembers.map((guestId, memberIndex) => {
      const groupIndex = GROUPS.findIndex(group => group.includes(guestId));
      return (
        <Line key={`elastic-${guestId}`} ref={elasticRefs[memberIndex]}
          points={() => [
            [dotRefs[guestId]().x(), dotRefs[guestId]().y()],
            stages().clusterCenters[groupIndex],
          ]}
          stroke={PALETTE.jaune}
          lineWidth={2}
          lineDash={() => [vW() * 0.007, vW() * 0.005]}
          end={0}
          opacity={0}
        />
      );
    })}

    {/* Ressorts roses : paires à éloigner */}
    {SEPARATIONS.map(([first, second], pairIndex) => (
      <Line key={`spring-${pairIndex}`} ref={springRefs[pairIndex]}
        points={() => springPoints(
          dotRefs[first]().x(), dotRefs[first]().y(),
          dotRefs[second]().x(), dotRefs[second]().y(),
          springAmplitude() * vW(),
        )}
        stroke={PALETTE.rose}
        lineWidth={2}
        end={0}
        opacity={0}
      />
    ))}
    {SEPARATIONS.map(([first, second], pairIndex) => (
      <Txt key={`spring-label-${pairIndex}`} ref={springLabelRefs[pairIndex]}
        text={'↔'}
        x={() => (dotRefs[first]().x() + dotRefs[second]().x()) / 2}
        y={() => (dotRefs[first]().y() + dotRefs[second]().y()) / 2 - vH() * 0.035}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.018}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        opacity={0}
      />
    ))}

    {/* Liens de contrôle des essais à la main (rose, clignotent si la règle est violée) */}
    {ruleLinks.map((ruleLink, linkIndex) => (
      <Line key={`rule-link-${linkIndex}`} ref={ruleLinkRefs[linkIndex]}
        points={() => [
          [dotRefs[ruleLink.first]().x(), dotRefs[ruleLink.first]().y()],
          [dotRefs[ruleLink.second]().x(), dotRefs[ruleLink.second]().y()],
        ]}
        stroke={PALETTE.rose}
        lineWidth={3}
        opacity={0}
      />
    ))}

    {/* Les 60 invités */}
    {GUESTS_SOLVEUR.map(guest => (
      <Circle key={`dot-${guest.id}`} ref={dotRefs[guest.id]}
        size={() => seatDotRadius(vW) * 2}
        x={() => cloudPos(guest.id, vW, vH)[0]}
        y={() => cloudPos(guest.id, vW, vH)[1]}
        fill={PALETTE.cream}
        stroke={PALETTE.rose}
        lineWidth={0}
        opacity={0}
      />
    ))}

    {/* Compteur d'invités */}
    <Layout key="guest-counter" ref={counterRef}
      layout
      direction={'row'}
      alignItems={'center'}
      gap={() => vW() * 0.01}
      x={() => vW() * -0.41}
      y={() => vH() * -0.43}
      opacity={0}
    >
      <Icon key="guest-counter-icon" icon="mdi:account-multiple"
        size={() => vW() * 0.035}
        color={PALETTE.jaune}
      />
      <Txt key="guest-counter-value"
        text={() => Math.round(guestCount()).toString()}
        fill={PALETTE.jaune}
        fontSize={() => vW() * 0.05}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
      />
    </Layout>

    {/* Compteur de combinaisons : 10^N */}
    <Layout key="combinations-counter" ref={combinationsRef}
      layout
      direction={'row'}
      alignItems={'start'}
      x={() => vW() * 0.4}
      y={() => vH() * -0.43}
      opacity={0}
    >
      <Txt key="combinations-base"
        text={'10'}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.05}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
      />
      <Txt key="combinations-exponent"
        text={() => Math.round(combinationsExponent()).toString()}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.03}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
      />
    </Layout>
    <Txt key="combinations-label" ref={combinationsLabelRef}
      text={'répartitions possibles'}
      fill={PALETTE.rose}
      fontSize={() => vW() * 0.011}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => vW() * 0.4}
      y={() => vH() * -0.355}
      opacity={0}
    />
  </>);

  sfxReset();

  // ── 1. invites ──────────────────────────────────────────────────────────────
  yield* waitUntil('invites');
  gridRef().opacity(0);
  counterRef().opacity(1);
  sfxFill(0, 1, 1.4, {ease: easeOutCubic, steps: 10});
  yield* all(
    gridRef().opacity(0.12, 0.6),
    guestCount(GUEST_COUNT, 1.4, easeOutCubic),
    sequence(0.012, ...dotRefs.map(dot => dot().opacity(1, 0.3))),
  );

  // ── 2. ensemble ─────────────────────────────────────────────────────────────
  yield* waitUntil('ensemble');
  sfx('travel', 0.5);
  yield* all(...dotRefs.map((dot, guestId) => dot().position(stages().stage1[guestId], 1.0, easeInOutCubic)));
  yield* sequence(0.06, ...unitRevealOrder.map(unitIndex => unitRefs[unitIndex]().opacity(1, 0.3)));

  // ── 3. regrouper ────────────────────────────────────────────────────────────
  yield* waitUntil('regrouper');
  sfx('draw', 0.6);
  yield* sequence(
    0.04,
    ...elasticRefs.map(elastic => all(elastic().opacity(1, 0.1), elastic().end(1, 0.4, easeInOutCubic))),
  );
  sfx('travel', 0.5);
  yield* all(
    ...groupMembers.map(guestId => dotRefs[guestId]().position(stages().stage2[guestId], 1.0, easeInOutCubic)),
    ...clusterRingRefs.map(ring => ring().opacity(1, 0.8)),
  );
  yield* all(...elasticRefs.map(elastic => elastic().opacity(0.35, 0.4)));

  // ── 4. separer ──────────────────────────────────────────────────────────────
  yield* waitUntil('separer');
  sfx('draw', 0.6);
  yield* all(
    ...separatedGuests.map(guestId => dotRefs[guestId]().lineWidth(3, 0.3)),
    sequence(0.1, ...springRefs.map(spring => all(spring().opacity(1, 0.1), spring().end(1, 0.4, easeInOutCubic)))),
  );
  yield* all(
    springAmplitude(0.004, 0.9, easeOutCubic),
    ...springLabelRefs.map(label => label().opacity(1, 0.5)),
  );

  // ── 5. a-la-main ────────────────────────────────────────────────────────────
  yield* waitUntil('a-la-main');
  sfx('emphasis', 0.6, 0.3);
  yield* all(
    ...unitRefs.map(unit => unit().opacity(0, 0.4)),
    ...elasticRefs.map(elastic => elastic().opacity(0, 0.4)),
    ...clusterRingRefs.map(ring => ring().opacity(0, 0.4)),
    ...springRefs.map(spring => spring().opacity(0, 0.4)),
    ...springLabelRefs.map(label => label().opacity(0, 0.4)),
    ...separatedGuests.map(guestId => dotRefs[guestId]().lineWidth(0, 0.4)),
    honorTableRef().opacity(0.7, 0.6),
    ...roundTableRefs.map(table => table().opacity(0.7, 0.6)),
    combinationsRef().opacity(1, 0.6),
    combinationsLabelRef().opacity(1, 0.6),
  );

  const attemptCount = 3;
  for (let attempt = 0; attempt < attemptCount; attempt++) {
    const assignment = attemptAssignment(attempt);
    sfx('travel', 0.5);
    yield* all(
      ...dotRefs.map((dot, guestId) =>
        dot().position(
          seatSlot(assignment[guestId].table, assignment[guestId].seat, vW, vH),
          0.9,
          easeInOutCubic,
        )),
    );

    // Règles cassées par cet essai : un couple séparé, ou une paire à éloigner réunie.
    const violatedLinks = ruleLinks
      .map((ruleLink, linkIndex) => ({ruleLink, linkIndex}))
      .filter(({ruleLink}) => {
        const sameTable = assignment[ruleLink.first].table === assignment[ruleLink.second].table;
        return ruleLink.kind === 'couple' ? !sameTable : sameTable;
      })
      .slice(0, 4);

    if (violatedLinks.length) sfx('failure', 0.8);
    yield* all(...violatedLinks.map(({linkIndex}) => ruleLinkRefs[linkIndex]().opacity(1, 0.12)));
    yield* all(...violatedLinks.map(({linkIndex}) => ruleLinkRefs[linkIndex]().opacity(0.2, 0.12)));
    yield* all(...violatedLinks.map(({linkIndex}) => ruleLinkRefs[linkIndex]().opacity(1, 0.12)));
    yield* waitFor(0.3);
    yield* all(...violatedLinks.map(({linkIndex}) => ruleLinkRefs[linkIndex]().opacity(0, 0.3)));
  }
  sfxFlush('contraintes-placement');
});
