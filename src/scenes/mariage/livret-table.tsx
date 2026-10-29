/**
 * livret-table — Le livret par table (chapitre 5, DOCUMENTS).
 *
 * La salle (mêmes positions que cpsat-solution) se déplie en une fiche de
 * table : convives fictifs, plat, pictogrammes de régime. Une légende de cinq
 * pictogrammes s'allume ligne par ligne, et chaque pictogramme de la fiche
 * pulse avec elle. Pour finir, la fiche et le jumeau 3D lisent le même plan.json.
 *
 * Couleur active : vert.
 * Données et géométrie de salle partagées : ./salle.ts
 */
import {makeScene2D, Circle, Grid, Icon, Layout, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
  Reference,
  sequence,
  waitUntil,
} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode} from '../../components';
import {PALETTE} from '../../theme';
import {
  Diet,
  DIET_ICON,
  DIET_LABEL,
  DIET_ORDER,
  GUEST_COUNT,
  GUESTS,
  guestsOfTable,
  honorTableSize,
  seatDotRadius,
  seatSlot,
  tableCenter,
  tableRadius,
  TABLE_COUNT,
} from './salle';

const range = (first: number, last: number) =>
  Array.from({length: last - first + 1}, (_, k) => first + k);

/** Table dont on déplie la fiche : famille de 8, les 5 régimes y sont représentés. */
const FEATURED_TABLE = 4;
const featuredGuests = guestsOfTable(FEATURED_TABLE);

// Géométrie de la fiche (fractions vW / vH, relatives au centre de la carte)
const ROW_FIRST_Y = -0.19;
const ROW_STEP_Y = 0.062;
const NAME_X = -0.165;
const DISH_X = -0.045;
const PICTO_FIRST_X = 0.04;
const PICTO_STEP_X = 0.027;
const LEGEND_FIRST_Y = -0.17;
const LEGEND_STEP_Y = 0.085;

const MONO = 'JetBrains Mono, DM Mono, monospace';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const roomRef = createRef<Layout>();
  const counterRef = createRef<Layout>();
  const honorTableRef = createRef<Rect>();
  const roundTableRefs: Reference<Circle>[] = range(1, TABLE_COUNT - 1).map(() => createRef<Circle>());
  const dotRefs: Reference<Circle>[] = GUESTS.map(() => createRef<Circle>());
  const cardRef = createRef<Rect>();
  const rowRefs: Reference<Layout>[] = featuredGuests.map(() => createRef<Layout>());
  const legendRef = createRef<Rect>();
  const legendRowRefs = {} as Record<Diet, Reference<Rect>>;
  const legendIconRefs = {} as Record<Diet, Reference<Icon>>;
  const pictoRefs = {} as Record<Diet, Reference<Icon>[]>;
  DIET_ORDER.forEach(diet => {
    legendRowRefs[diet] = createRef<Rect>();
    legendIconRefs[diet] = createRef<Icon>();
    pictoRefs[diet] = [];
  });
  const planNode = createRef<DiagramNode>();
  const twinNode = createRef<DiagramNode>();
  const planToCardArrow = createRef<ConnectionArrow>();
  const planToTwinArrow = createRef<ConnectionArrow>();

  const guestCount = createSignal(0);

  // Un pictogramme par régime présent, positionné dans la colonne de son type.
  const rowPictos = featuredGuests.map(guest =>
    guest.diets.map(diet => {
      const pictoRef = createRef<Icon>();
      pictoRefs[diet].push(pictoRef);
      return {diet, pictoRef, guestId: guest.id};
    }),
  );

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
      opacity={0}
    />

    {/* Salle vue de dessus */}
    <Layout key="room" ref={roomRef}>
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
      {GUESTS.map(guest => (
        <Circle key={`dot-${guest.id}`} ref={dotRefs[guest.id]}
          size={() => seatDotRadius(vW) * 2}
          x={() => seatSlot(guest.table, guest.seat, vW, vH)[0]}
          y={() => seatSlot(guest.table, guest.seat, vW, vH)[1]}
          fill={PALETTE.secondary}
          opacity={0}
        />
      ))}
    </Layout>

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
        color={PALETTE.vert}
      />
      <Txt key="guest-counter-value"
        text={() => Math.round(guestCount()).toString()}
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.05}
        fontFamily={MONO}
        fontWeight={700}
      />
    </Layout>

    {/* Fiche de table : naît sur la table, se déplie au centre */}
    <Rect key="table-card" ref={cardRef}
      width={() => vW() * 0.36}
      height={() => vH() * 0.64}
      x={() => tableCenter(FEATURED_TABLE, vW, vH)[0]}
      y={() => tableCenter(FEATURED_TABLE, vW, vH)[1]}
      scale={0.15}
      radius={() => vW() * 0.008}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.vert}
      lineWidth={2}
      opacity={0}
    >
      <Rect key="card-accent"
        width={() => vW() * 0.36}
        height={() => vH() * 0.004}
        y={() => vH() * -0.32 + vH() * 0.002}
        fill={PALETTE.vert}
      />
      <Icon key="card-header-icon" icon="mdi:table-furniture"
        x={() => vW() * -0.155}
        y={() => vH() * -0.265}
        size={() => vW() * 0.022}
        color={PALETTE.vert}
      />
      <Txt key="card-header-title"
        text={`TABLE ${FEATURED_TABLE}`}
        offset={[-1, 0]}
        x={() => vW() * -0.13}
        y={() => vH() * -0.265}
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.02}
        fontFamily={MONO}
        fontWeight={700}
      />
      {featuredGuests.map((guest, rowIndex) => (
        <Layout key={`card-row-${guest.id}`} ref={rowRefs[rowIndex]}
          y={() => vH() * (ROW_FIRST_Y + rowIndex * ROW_STEP_Y)}
          opacity={0}
        >
          <Txt key={`card-name-${guest.id}`}
            text={guest.name}
            offset={[-1, 0]}
            x={() => vW() * NAME_X}
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.0155}
            fontFamily={'DM Sans, Space Grotesk, sans-serif'}
            fontWeight={700}
          />
          <Txt key={`card-dish-${guest.id}`}
            text={guest.dish}
            offset={[-1, 0]}
            x={() => vW() * DISH_X}
            fill={PALETTE.secondary}
            fontSize={() => vW() * 0.0135}
            fontFamily={MONO}
          />
          {rowPictos[rowIndex].map(({diet, pictoRef}) => (
            <Icon key={`card-picto-${guest.id}-${diet}`} ref={pictoRef}
              icon={DIET_ICON[diet]}
              x={() => vW() * (PICTO_FIRST_X + DIET_ORDER.indexOf(diet) * PICTO_STEP_X)}
              size={() => vW() * 0.017}
              color={PALETTE.secondary}
            />
          ))}
        </Layout>
      ))}
    </Rect>

    {/* Légende des pictogrammes */}
    <Rect key="legend-card" ref={legendRef}
      width={() => vW() * 0.26}
      height={() => vH() * 0.52}
      x={() => vW() * 0.27}
      radius={() => vW() * 0.008}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.secondary}
      lineWidth={1}
      opacity={0}
    >
      {DIET_ORDER.map((diet, dietIndex) => (
        <Rect key={`legend-row-${diet}`} ref={legendRowRefs[diet]}
          width={() => vW() * 0.235}
          height={() => vH() * 0.07}
          y={() => vH() * (LEGEND_FIRST_Y + dietIndex * LEGEND_STEP_Y)}
          radius={() => vW() * 0.004}
          fill={'#00000000'}
        >
          <Icon key={`legend-icon-${diet}`} ref={legendIconRefs[diet]}
            icon={DIET_ICON[diet]}
            x={() => vW() * -0.09}
            size={() => vW() * 0.02}
            color={PALETTE.secondary}
          />
          <Txt key={`legend-label-${diet}`}
            text={DIET_LABEL[diet]}
            offset={[-1, 0]}
            x={() => vW() * -0.06}
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.0135}
            fontFamily={MONO}
          />
        </Rect>
      ))}
    </Rect>

    {/* Même fichier que le jumeau */}
    <DiagramNode key="plan-json-node" ref={planNode}
      iconName="mdi:code-json"
      label="plan.json"
      color={PALETTE.vert}
      initialState="active"
      width={() => vW() * 0.13}
      height={() => vH() * 0.26}
      x={() => vW() * 0.1}
      opacity={0}
    />
    <DiagramNode key="twin-node" ref={twinNode}
      iconName="mdi:cube-outline"
      label="jumeau"
      color={PALETTE.secondary}
      initialState="idle"
      width={() => vW() * 0.13}
      height={() => vH() * 0.26}
      x={() => vW() * 0.34}
      opacity={0}
    />
    <ConnectionArrow key="plan-to-card-arrow" ref={planToCardArrow}
      from={() => [vW() * 0.035, 0]}
      to={() => [vW() * -0.065, 0]}
      routing={0}
      stroke={PALETTE.vert}
      end={0}
      opacity={0}
    />
    <ConnectionArrow key="plan-to-twin-arrow" ref={planToTwinArrow}
      from={() => [vW() * 0.165, 0]}
      to={() => [vW() * 0.275, 0]}
      routing={0}
      stroke={PALETTE.secondary}
      end={0}
      opacity={0}
    />
  </>);

  // ── 1. tables ───────────────────────────────────────────────────────────────
  yield* waitUntil('tables');
  counterRef().opacity(1);
  yield* all(
    gridRef().opacity(0.12, 0.6),
    honorTableRef().opacity(1, 0.5),
    sequence(0.05, ...roundTableRefs.map(table => table().opacity(1, 0.4))),
    sequence(0.015, ...dotRefs.map(dot => dot().opacity(1, 0.3))),
    guestCount(GUEST_COUNT, 1.3, easeOutCubic),
  );

  // ── 2. fiche ────────────────────────────────────────────────────────────────
  yield* waitUntil('fiche');
  const featuredGuestIds = featuredGuests.map(guest => guest.id);
  yield* all(
    tableStroke(FEATURED_TABLE, PALETTE.vert, 0.4),
    ...featuredGuestIds.map(guestId => dotRefs[guestId]().fill(PALETTE.vert, 0.4)),
    roomRef().opacity(0.15, 0.7),
  );
  yield* all(
    cardRef().position([0, 0], 0.9, easeInOutCubic),
    cardRef().scale(1, 0.9, easeInOutCubic),
    cardRef().opacity(1, 0.5),
  );
  yield* sequence(0.12, ...rowRefs.map(row => row().opacity(1, 0.3)));

  // ── 3. legende ──────────────────────────────────────────────────────────────
  yield* waitUntil('legende');
  yield* all(
    cardRef().x(vW() * -0.2, 0.7, easeInOutCubic),
    legendRef().opacity(1, 0.6),
  );
  for (const diet of DIET_ORDER) {
    yield* all(
      legendRowRefs[diet]().fill(PALETTE.vert + '22', 0.2),
      legendIconRefs[diet]().color(PALETTE.vert, 0.2),
      ...pictoRefs[diet].map(picto => picto().color(PALETTE.vert, 0.2)),
      ...pictoRefs[diet].map(picto => picto().scale(1.6, 0.25, easeOutCubic)),
    );
    yield* all(
      legendRowRefs[diet]().fill('#00000000', 0.3),
      legendIconRefs[diet]().color(PALETTE.secondary, 0.3),
      ...pictoRefs[diet].map(picto => picto().scale(1, 0.3)),
      ...pictoRefs[diet].map(picto => picto().color(PALETTE.secondary, 0.3)),
    );
  }

  // ── 4. meme-fichier ─────────────────────────────────────────────────────────
  yield* waitUntil('meme-fichier');
  yield* all(
    legendRef().opacity(0, 0.4),
    cardRef().x(vW() * -0.25, 0.7, easeInOutCubic),
  );
  yield* all(planNode().opacity(1, 0.4), twinNode().opacity(1, 0.4));
  planToCardArrow().opacity(1);
  planToTwinArrow().opacity(1);
  yield* all(
    planToCardArrow().end(1, 0.5, easeInOutCubic),
    planToTwinArrow().end(1, 0.5, easeInOutCubic),
  );
});
