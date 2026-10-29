/**
 * plan-traiteur-totaux — Le plan pour le traiteur et ses totaux par plat
 * (chapitre 5, DOCUMENTS).
 *
 * Le plan de salle mis à plat (tables de cpsat-solution) avec les convives,
 * les totaux par plat qui se calculent (risotto 32 / jarret 28 = 60), puis
 * l'erreur de l'IA : deux prénoms presque identiques (Mathis / Matis) sont
 * fusionnés à tort, le total tombe à 59. Vérification à la main : la ligne
 * est restaurée, retour à 60.
 *
 * Couleur active : rose (l'erreur), vert à la vérification.
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
import {PALETTE} from '../../theme';
import {
  Dish,
  DISH_TOTALS,
  GUEST_COUNT,
  GUESTS,
  guestsOfTable,
  honorTableSize,
  seatDotRadius,
  seatSlot,
  tableCenter,
  tableRadius,
  TABLE_COUNT,
  TABLE_SIZES,
  HONOR_TABLE,
} from './salle';

const range = (first: number, last: number) =>
  Array.from({length: last - first + 1}, (_, k) => first + k);

const MONO = 'JetBrains Mono, DM Mono, monospace';
const DISH_COLOR: Record<Dish, string> = {risotto: PALETTE.cream, jarret: PALETTE.secondary};

/** Les deux prénoms presque identiques, à la même table (table 3). */
const MATHIS_ID = 22;
const MATIS_ID = 23;
const FUSION_TABLE = GUESTS[MATHIS_ID].table;
const fusionGuests = guestsOfTable(FUSION_TABLE);
const mathisRow = fusionGuests.findIndex(guest => guest.id === MATHIS_ID);
const matisRow = fusionGuests.findIndex(guest => guest.id === MATIS_ID);

// Géométrie de la fiche de fusion (fractions vW / vH, relatives au centre de la carte)
const CARD_CENTER_Y = -0.06;
const ROW_FIRST_Y = -0.16;
const ROW_STEP_Y = 0.055;
const rowY = (rowIndex: number) => ROW_FIRST_Y + rowIndex * ROW_STEP_Y;

/** Direction (unitaire) dans laquelle poser le prénom d'un convive, en s'éloignant de la table. */
function labelDirection(table: number, seat: number): [number, number] {
  if (table === HONOR_TABLE) return [0, 1];
  const angle = -Math.PI / 2 + (2 * Math.PI * seat) / TABLE_SIZES[table];
  return [Math.cos(angle), Math.sin(angle)];
}

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const roomRef = createRef<Layout>();
  const honorTableRef = createRef<Rect>();
  const roundTableRefs: Reference<Circle>[] = range(1, TABLE_COUNT - 1).map(() => createRef<Circle>());
  const dotRefs: Reference<Circle>[] = GUESTS.map(() => createRef<Circle>());
  const nameRefs: Reference<Txt>[] = GUESTS.map(() => createRef<Txt>());
  const totalsRef = createRef<Layout>();
  const jarretNumberRef = createRef<Txt>();
  const totalNumberRef = createRef<Txt>();
  const cardRef = createRef<Rect>();
  const cardRowRefs: Reference<Layout>[] = fusionGuests.map(() => createRef<Layout>());
  const cardNameRefs: Reference<Txt>[] = fusionGuests.map(() => createRef<Txt>());
  const magnifierRef = createRef<Icon>();
  const handRef = createRef<Icon>();

  const risottoCount = createSignal(0);
  const jarretCount = createSignal(0);
  const totalCount = createSignal(() => risottoCount() + jarretCount());

  const dotsOfDish = (dish: Dish) =>
    GUESTS.filter(guest => guest.dish === dish).map(guest => dotRefs[guest.id]);

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

    {/* Plan de salle mis à plat, réduit pour laisser la place aux totaux */}
    <Layout key="room" ref={roomRef}
      y={() => vH() * -0.06}
      scale={0.8}
    >
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
          fill={DISH_COLOR[guest.dish]}
          opacity={0}
        />
      ))}
      {GUESTS.map(guest => {
        const [directionX, directionY] = labelDirection(guest.table, guest.seat);
        return (
          <Txt key={`name-${guest.id}`} ref={nameRefs[guest.id]}
            text={guest.name}
            offset={[-directionX, -directionY]}
            x={() => seatSlot(guest.table, guest.seat, vW, vH)[0] + directionX * vW() * 0.014}
            y={() => seatSlot(guest.table, guest.seat, vW, vH)[1] + directionY * vW() * 0.014}
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.0092}
            fontFamily={'DM Sans, Space Grotesk, sans-serif'}
            fontWeight={500}
            opacity={0}
          />
        );
      })}
    </Layout>

    {/* Totaux par plat (bas de l'écran) */}
    <Layout key="totals" ref={totalsRef}
      y={() => vH() * 0.4}
      opacity={0}
    >
      <Rect key="tile-risotto"
        width={() => vW() * 0.2}
        height={() => vH() * 0.1}
        x={() => vW() * -0.25}
        radius={() => vW() * 0.006}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary + '66'}
        lineWidth={2}
      >
        <Circle key="tile-risotto-swatch"
          size={() => vW() * 0.016}
          x={() => vW() * -0.075}
          fill={DISH_COLOR.risotto}
        />
        <Txt key="tile-risotto-label"
          text={'risotto'}
          offset={[-1, 0]}
          x={() => vW() * -0.06}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.015}
          fontFamily={MONO}
          fontWeight={700}
        />
        <Txt key="tile-risotto-number"
          text={() => Math.round(risottoCount()).toString()}
          x={() => vW() * 0.07}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.03}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
      <Rect key="tile-jarret"
        width={() => vW() * 0.2}
        height={() => vH() * 0.1}
        x={() => vW() * -0.02}
        radius={() => vW() * 0.006}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary + '66'}
        lineWidth={2}
      >
        <Circle key="tile-jarret-swatch"
          size={() => vW() * 0.016}
          x={() => vW() * -0.075}
          fill={DISH_COLOR.jarret}
        />
        <Txt key="tile-jarret-label"
          text={'jarret'}
          offset={[-1, 0]}
          x={() => vW() * -0.06}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.015}
          fontFamily={MONO}
          fontWeight={700}
        />
        <Txt key="tile-jarret-number" ref={jarretNumberRef}
          text={() => Math.round(jarretCount()).toString()}
          x={() => vW() * 0.07}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.03}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
      <Rect key="tile-total"
        width={() => vW() * 0.24}
        height={() => vH() * 0.1}
        x={() => vW() * 0.24}
        radius={() => vW() * 0.006}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary + '66'}
        lineWidth={2}
      >
        <Icon key="tile-total-icon" icon="mdi:sigma"
          x={() => vW() * -0.09}
          size={() => vW() * 0.022}
          color={PALETTE.secondary}
        />
        <Txt key="tile-total-number" ref={totalNumberRef}
          text={() => Math.round(totalCount()).toString()}
          x={() => vW() * -0.015}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.04}
          fontFamily={MONO}
          fontWeight={700}
        />
        <Txt key="tile-total-expected"
          text={`/ ${GUEST_COUNT}`}
          offset={[-1, 0]}
          x={() => vW() * 0.035}
          fill={PALETTE.ghost}
          fontSize={() => vW() * 0.022}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
    </Layout>

    {/* Fiche de la table où l'IA fusionne deux prénoms */}
    <Rect key="fusion-card" ref={cardRef}
      width={() => vW() * 0.3}
      height={() => vH() * 0.56}
      y={() => vH() * CARD_CENTER_Y}
      radius={() => vW() * 0.008}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.rose}
      lineWidth={2}
      opacity={0}
    >
      <Rect key="fusion-card-accent"
        width={() => vW() * 0.3}
        height={() => vH() * 0.004}
        y={() => vH() * -0.28 + vH() * 0.002}
        fill={PALETTE.rose}
      />
      <Txt key="fusion-card-title"
        text={`TABLE ${FUSION_TABLE}`}
        y={() => vH() * -0.235}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.018}
        fontFamily={MONO}
        fontWeight={700}
      />
      {fusionGuests.map((guest, rowIndex) => (
        <Layout key={`fusion-row-${guest.id}`} ref={cardRowRefs[rowIndex]}
          y={() => vH() * rowY(rowIndex)}
        >
          <Txt key={`fusion-name-${guest.id}`} ref={cardNameRefs[rowIndex]}
            text={guest.name}
            offset={[-1, 0]}
            x={() => vW() * -0.12}
            fill={PALETTE.cream}
            fontSize={() => vW() * 0.016}
            fontFamily={'DM Sans, Space Grotesk, sans-serif'}
            fontWeight={700}
          />
          <Circle key={`fusion-swatch-${guest.id}`}
            size={() => vW() * 0.013}
            x={() => vW() * 0.03}
            fill={DISH_COLOR[guest.dish]}
          />
          <Txt key={`fusion-dish-${guest.id}`}
            text={guest.dish}
            offset={[-1, 0]}
            x={() => vW() * 0.045}
            fill={PALETTE.secondary}
            fontSize={() => vW() * 0.0135}
            fontFamily={MONO}
          />
        </Layout>
      ))}
    </Rect>

    {/* Vérification à la main : main + loupe */}
    <Icon key="hand" ref={handRef}
      icon="mdi:hand-pointing-right"
      size={() => vW() * 0.035}
      color={PALETTE.cream}
      opacity={0}
    />
    <Icon key="magnifier" ref={magnifierRef}
      icon="mdi:magnify"
      size={() => vW() * 0.04}
      color={PALETTE.vert}
      opacity={0}
    />
  </>);

  // ── 1. plan ─────────────────────────────────────────────────────────────────
  yield* waitUntil('plan');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    honorTableRef().opacity(1, 0.5),
    sequence(0.05, ...roundTableRefs.map(table => table().opacity(1, 0.4))),
    sequence(0.015, ...dotRefs.map(dot => dot().opacity(1, 0.3))),
    sequence(0.015, ...nameRefs.map(name => name().opacity(0.9, 0.3))),
  );

  // ── 2. totaux ───────────────────────────────────────────────────────────────
  yield* waitUntil('totaux');
  yield* totalsRef().opacity(1, 0.4);
  yield* all(
    risottoCount(DISH_TOTALS.risotto, 1.2, easeOutCubic),
    sequence(0.015, ...dotsOfDish('risotto').map(dot => dot().scale(1.5, 0.15).to(1, 0.15))),
  );
  yield* all(
    jarretCount(DISH_TOTALS.jarret, 1.1, easeOutCubic),
    sequence(0.015, ...dotsOfDish('jarret').map(dot => dot().scale(1.5, 0.15).to(1, 0.15))),
  );

  // ── 3. fusion ───────────────────────────────────────────────────────────────
  yield* waitUntil('fusion');
  yield* all(
    roomRef().opacity(0.2, 0.5),
    cardRef().opacity(1, 0.5),
  );
  yield* all(
    cardNameRefs[mathisRow]().fill(PALETTE.rose, 0.3),
    cardNameRefs[matisRow]().fill(PALETTE.rose, 0.3),
  );
  // La ligne « Matis » glisse sur « Mathis » ; les lignes suivantes remontent d'un cran.
  yield* all(
    cardRowRefs[matisRow]().y(vH() * rowY(mathisRow), 0.7, easeInOutCubic),
    cardRowRefs[matisRow]().opacity(0, 0.7),
    ...fusionGuests.map((_, rowIndex) =>
      rowIndex > matisRow
        ? cardRowRefs[rowIndex]().y(vH() * rowY(rowIndex - 1), 0.7, easeInOutCubic)
        : all(),
    ),
  );
  // Le plat de la ligne supprimée disparaît des totaux : 60 devient 59.
  yield* all(
    jarretCount(DISH_TOTALS.jarret - 1, 0.4),
    jarretNumberRef().fill(PALETTE.rose, 0.3),
    totalNumberRef().fill(PALETTE.rose, 0.3),
  );

  // ── 4. verification ─────────────────────────────────────────────────────────
  yield* waitUntil('verification');
  yield* all(
    cardRowRefs[matisRow]().y(vH() * rowY(matisRow), 0.7, easeInOutCubic),
    cardRowRefs[matisRow]().opacity(1, 0.7),
    ...fusionGuests.map((_, rowIndex) =>
      rowIndex > matisRow
        ? cardRowRefs[rowIndex]().y(vH() * rowY(rowIndex), 0.7, easeInOutCubic)
        : all(),
    ),
    jarretCount(DISH_TOTALS.jarret, 0.6),
  );

  // La main et la loupe parcourent la fiche ligne par ligne.
  const handX = vW() * -0.17;
  const magnifierX = vW() * 0.135;
  const rowScreenY = (rowIndex: number) => vH() * (CARD_CENTER_Y + rowY(rowIndex));
  handRef().position([handX, rowScreenY(0)]);
  magnifierRef().position([magnifierX, rowScreenY(0)]);
  yield* all(handRef().opacity(1, 0.25), magnifierRef().opacity(1, 0.25));
  for (let rowIndex = 0; rowIndex < fusionGuests.length; rowIndex++) {
    yield* all(
      handRef().y(rowScreenY(rowIndex), 0.18),
      magnifierRef().y(rowScreenY(rowIndex), 0.18),
      cardNameRefs[rowIndex]().fill(PALETTE.vert, 0.18),
    );
  }
  yield* all(
    handRef().opacity(0, 0.3),
    magnifierRef().opacity(0, 0.3),
    jarretNumberRef().fill(PALETTE.vert, 0.4),
    totalNumberRef().fill(PALETTE.vert, 0.4),
    cardRef().stroke(PALETTE.vert, 0.4),
  );
});
