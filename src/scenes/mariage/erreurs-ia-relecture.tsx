/**
 * erreurs-ia-relecture — Les erreurs de l'IA trouvées à la relecture (CRISE).
 *
 * Une pile de documents générés par l'IA, une loupe qui les passe un par un,
 * des diffs sur des prénoms fictifs (accent ajouté, lettre ajoutée, lettre
 * supprimée), un compteur qui s'arrête sous 10, puis un tampon « relu » avant
 * l'envoi à l'imprimante.
 *
 * Battements : relecture · diffs · compteur · tampon
 * Couleur active : rose (erreur). Vert uniquement pour le tampon « relu ».
 */
import {makeScene2D, Grid, Layout, Rect, Txt, Line, Icon} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  Reference,
  all,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  easeOutCubic,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

type WordSegment = {text: string; faulty?: boolean};

type DiffRow = {
  left: WordSegment[];
  right: WordSegment[];
  centerY: number;
};

// Prénoms fictifs. Un segment `faulty` est le caractère qui diffère (« _ » = absent).
const DIFF_ROWS: DiffRow[] = [
  {
    left:  [{text: 'H'}, {text: 'e', faulty: true}, {text: 'l'}, {text: 'e', faulty: true}, {text: 'ne'}],
    right: [{text: 'H'}, {text: 'é', faulty: true}, {text: 'l'}, {text: 'è', faulty: true}, {text: 'ne'}],
    centerY: -0.2,
  },
  {
    left:  [{text: 'An'}, {text: '_', faulty: true}, {text: 'ais'}],
    right: [{text: 'An'}, {text: 'n', faulty: true}, {text: 'ais'}],
    centerY: -0.04,
  },
  {
    left:  [{text: 'Mathi'}, {text: 'l', faulty: true}, {text: 'de'}],
    right: [{text: 'Mathi'}, {text: '_', faulty: true}, {text: 'de'}],
    centerY: 0.12,
  },
];

const DOC_COUNT = 5;
const MONO = 'JetBrains Mono, DM Mono, monospace';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef         = createRef<Grid>();
  const docGroup        = createRef<Layout>();
  const loupeIcon       = createRef<Icon>();
  const printerIcon     = createRef<Icon>();
  const counterGroup    = createRef<Layout>();
  const docRefs         = Array.from({length: DOC_COUNT}, () => createRef<Rect>());
  const stampRefs       = Array.from({length: DOC_COUNT}, () => createRef<Rect>());
  const diffRowRefs     = DIFF_ROWS.map(() => createRef<Rect>());
  // Caractères fautifs par ligne de diff (gauche + droite) — allumés en rose au battement « diffs ».
  const faultyCharRefs  = DIFF_ROWS.map(() => [] as Reference<Txt>[]);

  const errorCount   = createSignal(0);
  const trackWidth   = () => vW() * 0.3;
  const trackCenterX = () => vW() * 0.04;

  const docSpreadX = (docIndex: number) => (docIndex - (DOC_COUNT - 1) / 2) * vW() * 0.13;

  // ── Helpers de construction ────────────────────────────────────────────────
  const buildWord = (keyPrefix: string, rowIndex: number, segments: WordSegment[]) =>
    segments.map((segment, segmentIndex) => {
      const segmentRef = createRef<Txt>();
      if (segment.faulty) faultyCharRefs[rowIndex].push(segmentRef);
      return (
        <Txt
          key={`${keyPrefix}-${segmentIndex}`}
          ref={segmentRef}
          text={segment.text}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.032}
          fontFamily={MONO}
          fontWeight={700}
        />
      );
    });

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

    {/* Pile de documents + loupe */}
    <Layout key="doc-group" ref={docGroup} y={() => vH() * -0.03}>
      {docRefs.map((docRef, docIndex) => (
        <Rect
          key={`doc-${docIndex}`}
          ref={docRef}
          width={() => vW() * 0.085}
          height={() => vH() * 0.22}
          x={() => vW() * 0.004 * docIndex}
          y={() => vH() * -0.004 * docIndex}
          fill={PALETTE.bgCard}
          stroke={PALETTE.secondary}
          lineWidth={2}
          radius={() => vW() * 0.004}
          opacity={0}
        >
          {[0, 1, 2, 3, 4].map(lineIndex => (
            <Rect
              key={`doc-${docIndex}-line-${lineIndex}`}
              width={() => vW() * (lineIndex === 4 ? 0.032 : 0.062)}
              height={() => vH() * 0.008}
              x={() => vW() * (lineIndex === 4 ? -0.015 : 0)}
              y={() => vH() * (-0.07 + lineIndex * 0.03)}
              fill={PALETTE.ghost}
              radius={() => vW() * 0.001}
            />
          ))}
          <Rect
            key={`doc-${docIndex}-stamp`}
            ref={stampRefs[docIndex]}
            width={() => vW() * 0.07}
            height={() => vH() * 0.045}
            y={() => vH() * 0.05}
            rotation={-12}
            fill={'#00000000'}
            stroke={PALETTE.vert}
            lineWidth={3}
            radius={() => vW() * 0.003}
            scale={1.8}
            opacity={0}
          >
            <Txt
              key={`doc-${docIndex}-stamp-label`}
              text="RELU"
              fill={PALETTE.vert}
              fontSize={() => vW() * 0.016}
              fontFamily={MONO}
              fontWeight={700}
            />
          </Rect>
        </Rect>
      ))}
      <Icon
        key="loupe-icon"
        ref={loupeIcon}
        icon="mdi:magnify"
        color={PALETTE.rose}
        size={() => vW() * 0.06}
        x={() => vW() * -0.45}
        y={() => vH() * 0.08}
        opacity={0}
      />
    </Layout>

    {/* Diffs : source → sortie IA */}
    {DIFF_ROWS.map((diffRow, rowIndex) => (
      <Rect
        key={`diff-row-${rowIndex}`}
        ref={diffRowRefs[rowIndex]}
        layout
        direction={'row'}
        alignItems={'center'}
        justifyContent={'center'}
        gap={() => vW() * 0.025}
        width={() => vW() * 0.5}
        height={() => vH() * 0.12}
        y={() => vH() * diffRow.centerY}
        fill={PALETTE.bgCard}
        stroke={PALETTE.ghost}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
      >
        <Layout
          key={`diff-row-${rowIndex}-left`}
          layout
          direction={'row'}
          justifyContent={'end'}
          width={() => vW() * 0.18}
        >
          {buildWord(`diff-row-${rowIndex}-left-char`, rowIndex, diffRow.left)}
        </Layout>
        <Icon
          key={`diff-row-${rowIndex}-arrow`}
          icon="mdi:arrow-right"
          color={PALETTE.secondary}
          size={() => vW() * 0.03}
        />
        <Layout
          key={`diff-row-${rowIndex}-right`}
          layout
          direction={'row'}
          justifyContent={'start'}
          width={() => vW() * 0.18}
        >
          {buildWord(`diff-row-${rowIndex}-right-char`, rowIndex, diffRow.right)}
        </Layout>
      </Rect>
    ))}

    {/* Compteur d'erreurs — s'arrête sous 10 */}
    <Layout key="counter-group" ref={counterGroup} y={() => vH() * 0.34} opacity={0}>
      <Icon
        key="counter-icon"
        icon="mdi:alert-circle-outline"
        color={PALETTE.rose}
        size={() => vW() * 0.045}
        x={() => vW() * -0.27}
      />
      <Txt
        key="counter-value"
        text={() => errorCount().toFixed(0)}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.07}
        fontFamily={MONO}
        fontWeight={700}
        x={() => vW() * -0.19}
      />
      <Rect
        key="counter-track"
        width={trackWidth}
        height={() => vH() * 0.025}
        x={trackCenterX}
        fill={PALETTE.bgCard}
        stroke={PALETTE.ghost}
        lineWidth={2}
        radius={() => vW() * 0.003}
      />
      <Rect
        key="counter-fill"
        offset={[-1, 0]}
        x={() => trackCenterX() - trackWidth() / 2}
        width={() => trackWidth() * errorCount() / 10}
        height={() => vH() * 0.025}
        fill={PALETTE.rose}
        radius={() => vW() * 0.003}
      />
      <Line
        key="counter-limit-tick"
        points={() => [
          [trackCenterX() + trackWidth() / 2, -vH() * 0.03],
          [trackCenterX() + trackWidth() / 2, vH() * 0.03],
        ]}
        stroke={PALETTE.secondary}
        lineWidth={3}
      />
      <Txt
        key="counter-limit-label"
        text="10"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.022}
        fontFamily={MONO}
        fontWeight={700}
        x={() => trackCenterX() + trackWidth() / 2 + vW() * 0.03}
      />
    </Layout>

    <Icon
      key="printer-icon"
      ref={printerIcon}
      icon="mdi:printer"
      color={PALETTE.secondary}
      size={() => vW() * 0.09}
      x={() => vW() * 0.4}
      y={() => vH() * -0.03}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────
  yield* gridRef().opacity(0.07, 0.8);

  // 1. relecture — la pile s'étale, la loupe passe document par document
  yield* waitUntil('relecture');
  yield* sequence(0.1, ...docRefs.map(docRef => docRef().opacity(1, 0.35)));
  yield* all(
    ...docRefs.map((docRef, docIndex) =>
      all(
        docRef().x(docSpreadX(docIndex), 0.7, easeInOutCubic),
        docRef().y(0, 0.7, easeInOutCubic),
      ),
    ),
  );
  loupeIcon().opacity(1);
  for (let docIndex = 0; docIndex < DOC_COUNT; docIndex++) {
    yield* loupeIcon().x(docSpreadX(docIndex) + vW() * 0.015, 0.45, easeInOutCubic);
    yield* docRefs[docIndex]().stroke(PALETTE.cream, 0.2);
  }
  yield* loupeIcon().opacity(0, 0.3);

  // 2. diffs — les documents reculent, les erreurs apparaissent comme un diff
  yield* waitUntil('diffs');
  yield* all(
    docGroup().y(vH() * -0.38, 0.7, easeInOutCubic),
    docGroup().scale(0.6, 0.7, easeInOutCubic),
  );
  yield* sequence(0.35, ...diffRowRefs.map(diffRowRef => diffRowRef().opacity(1, 0.4)));
  for (let rowIndex = 0; rowIndex < DIFF_ROWS.length; rowIndex++) {
    yield* all(
      diffRowRefs[rowIndex]().stroke(PALETTE.rose, 0.3),
      ...faultyCharRefs[rowIndex].map(faultyChar => faultyChar().fill(PALETTE.rose, 0.3)),
    );
    yield* waitFor(0.3);
  }

  // 3. compteur — il monte, puis s'arrête sous 10
  yield* waitUntil('compteur');
  yield* counterGroup().opacity(1, 0.4);
  for (let count = 1; count <= 7; count++) {
    yield* errorCount(count, 0.18);
    yield* waitFor(0.2);
  }
  yield* waitFor(0.4);

  // 4. tampon — chaque document est tamponné « relu » puis part à l'impression
  yield* waitUntil('tampon');
  yield* all(
    ...diffRowRefs.map(diffRowRef => diffRowRef().opacity(0, 0.4)),
    counterGroup().opacity(0, 0.4),
    docGroup().y(0, 0.7, easeInOutCubic),
    docGroup().scale(1, 0.7, easeInOutCubic),
  );
  yield* printerIcon().opacity(1, 0.4);
  yield* sequence(0.2, ...stampRefs.map(stampRef =>
    all(
      stampRef().opacity(1, 0.15),
      stampRef().scale(1, 0.3, easeOutCubic),
    ),
  ));
  yield* waitFor(0.3);
  yield* sequence(0.25, ...docRefs.map(docRef =>
    all(
      docRef().x(vW() * 0.4, 0.7, easeInOutCubic),
      docRef().scale(0.4, 0.7, easeInOutCubic),
      docRef().opacity(0, 0.7),
    ),
  ));
  yield* printerIcon().scale(1.15, 0.2);
  yield* printerIcon().scale(1, 0.25);
  yield* waitFor(0.4);
});
