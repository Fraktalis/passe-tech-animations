/**
 * documents-source-unique — Une source, sept documents (DOCUMENTS).
 *
 * J-14 : `plan.json`, les notes et la charte graphique convergent vers Claude.
 * La charte est un gabarit verrouillé (cadre + cadenas) : elle s'impose à tout.
 * Sept documents sortent en éventail avec la même bordure, pendant qu'une frise
 * « 13 → 18 août » se remplit.
 *
 * Couleur active : jaune. Le reste en secondary / ghost.
 */
import {makeScene2D, Grid, Layout, Rect, Circle, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxFill, sfxReset, sfxFlush} from '../../sfx';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const DISPLAY = 'Space Grotesk, sans-serif';
  const BODY = 'DM Sans, Space Grotesk, sans-serif';

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const sourceX = () => -vW() * 0.4;
  const sourceWidth = () => vW() * 0.13;
  const sourceHeight = () => vH() * 0.19;
  const planY = () => -vH() * 0.29;
  const notesY = () => -vH() * 0.07;
  const charteY = () => vH() * 0.22;
  const charteHeight = () => vH() * 0.27;

  const claudeWidth = () => vW() * 0.12;
  const claudeHeight = () => vH() * 0.2;

  const dialSize = () => vW() * 0.1;
  const dialTopY = () => -vH() * 0.33;

  const docWidth = () => vW() * 0.13;
  const docHeight = () => vH() * 0.06;
  const docCount = 7;
  const docY = (docIndex: number) => vH() * 0.095 * (docIndex - 3);
  const docX = (docIndex: number) =>
    vW() * 0.2 + Math.sqrt(Math.max(0, (vW() * 0.2) ** 2 - docY(docIndex) ** 2));
  const documents: Array<{label: string; icon: string}> = [
    {label: 'panneaux', icon: 'mdi:sign-direction'},
    {label: 'clés', icon: 'mdi:key-variant'},
    {label: 'cocktail', icon: 'mdi:glass-cocktail'},
    {label: 'menu', icon: 'mdi:silverware-fork-knife'},
    {label: 'tables', icon: 'mdi:table-furniture'},
    {label: 'bancs', icon: 'mdi:bench'},
    {label: 'traiteur', icon: 'mdi:chef-hat'},
  ];

  const friseY = () => vH() * 0.43;
  const friseLeft = () => -vW() * 0.05;
  const friseWidth = () => vW() * 0.45;
  const friseDays = ['13', '14', '15', '16', '17', '18'];
  const friseTickX = (dayIndex: number) =>
    friseLeft() + (friseWidth() * dayIndex) / (friseDays.length - 1);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const dialGroup = createRef<Layout>();
  const dialRing = createRef<Circle>();
  const planNode = createRef<DiagramNode>();
  const notesNode = createRef<DiagramNode>();
  const charteCard = createRef<Rect>();
  const claudeNode = createRef<DiagramNode>();
  const planEdge = createRef<DiagramEdge>();
  const notesEdge = createRef<DiagramEdge>();
  const charteEdge = createRef<DiagramEdge>();
  const lockFrame = createRef<Rect>();
  const lockBadge = createRef<Circle>();
  const docRefs = Array.from({length: docCount}, () => createRef<Rect>());
  const friseGroup = createRef<Layout>();
  const friseFill = createRef<Rect>();
  const friseTickRefs = friseDays.map(() => createRef<Circle>());

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

    {/* Compte à rebours J-14 */}
    <Layout key="dial-group" ref={dialGroup} opacity={0} scale={1.6}>
      <Circle key="dial-track"
        width={dialSize} height={dialSize}
        fill={'#00000000'}
        stroke={PALETTE.ghost}
        lineWidth={6}
      />
      <Circle key="dial-ring" ref={dialRing}
        width={dialSize} height={dialSize}
        fill={'#00000000'}
        stroke={PALETTE.jaune}
        lineWidth={6}
        startAngle={-90}
        endAngle={270}
        end={0}
      />
      <Txt key="dial-text"
        text="J-14"
        fill={PALETTE.jaune}
        fontSize={() => vW() * 0.03}
        fontFamily={DISPLAY}
        fontWeight={800}
      />
    </Layout>

    {/* Sources */}
    <DiagramNode key="plan-node" ref={planNode}
      iconName="mdi:code-json"
      label="plan.json"
      color={PALETTE.secondary}
      initialState="idle"
      width={sourceWidth} height={sourceHeight}
      x={sourceX} y={planY}
      opacity={0}
    />
    <DiagramNode key="notes-node" ref={notesNode}
      iconName="mdi:notebook-outline"
      label="notes"
      color={PALETTE.secondary}
      initialState="idle"
      width={sourceWidth} height={sourceHeight}
      x={sourceX} y={notesY}
      opacity={0}
    />

    {/* Charte : palette + deux polices + motif floral */}
    <Rect key="charte-card" ref={charteCard}
      width={sourceWidth} height={charteHeight}
      x={sourceX} y={charteY}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.secondary + '66'}
      lineWidth={2}
      radius={() => vW() * 0.005}
      opacity={0}
    >
      <Txt key="charte-label"
        text="charte"
        fill={PALETTE.cream}
        fontSize={() => vH() * 0.027}
        fontFamily={MONO}
        fontWeight={700}
        y={() => -charteHeight() * 0.36}
      />
      {[-0.045, -0.015, 0.015, 0.045].map((swatchX, swatchIndex) => (
        <Circle key={`charte-swatch-${swatchIndex}`}
          width={() => vW() * 0.012} height={() => vW() * 0.012}
          x={() => vW() * swatchX}
          y={() => -charteHeight() * 0.2}
          fill={[PALETTE.jaune, PALETTE.rose, PALETTE.vert, PALETTE.blue][swatchIndex]}
        />
      ))}
      <Txt key="charte-font-display"
        text="Aa"
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.02}
        fontFamily={DISPLAY}
        fontWeight={800}
        x={() => -vW() * 0.025}
        y={() => charteHeight() * 0.02}
      />
      <Txt key="charte-font-body"
        text="Aa"
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.02}
        fontFamily={BODY}
        fontWeight={300}
        x={() => vW() * 0.025}
        y={() => charteHeight() * 0.02}
      />
      <Icon key="charte-flower"
        icon="mdi:flower-tulip-outline"
        size={() => vW() * 0.026}
        color={PALETTE.secondary}
        y={() => charteHeight() * 0.27}
      />
    </Rect>

    {/* Gabarit verrouillé autour de la charte */}
    <Rect key="lock-frame" ref={lockFrame}
      width={() => sourceWidth() + vW() * 0.02}
      height={() => charteHeight() + vH() * 0.04}
      x={sourceX} y={charteY}
      fill={'#00000000'}
      stroke={PALETTE.jaune}
      lineWidth={2}
      lineDash={[10, 8]}
      radius={() => vW() * 0.007}
      opacity={0}
    />
    <Circle key="lock-badge" ref={lockBadge}
      width={() => vW() * 0.03} height={() => vW() * 0.03}
      x={() => sourceX() + sourceWidth() / 2 + vW() * 0.01}
      y={() => charteY() - charteHeight() / 2 - vH() * 0.02}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.jaune}
      lineWidth={2}
      opacity={0}
    >
      <Icon key="lock-icon"
        icon="mdi:lock"
        size={() => vW() * 0.018}
        color={PALETTE.jaune}
      />
    </Circle>

    {/* Claude */}
    <DiagramNode key="claude-node" ref={claudeNode}
      iconName="mdi:creation"
      label="Claude"
      color={PALETTE.jaune}
      initialState="idle"
      width={claudeWidth} height={claudeHeight}
      opacity={0}
    />
    <DiagramEdge key="plan-edge" ref={planEdge}
      from={() => [sourceX() + sourceWidth() / 2 + vW() * 0.006, planY()]}
      to={() => [-claudeWidth() / 2 - vW() * 0.006, -claudeHeight() * 0.25]}
      stroke={PALETTE.jaune}
      end={0}
      opacity={0}
    />
    <DiagramEdge key="notes-edge" ref={notesEdge}
      from={() => [sourceX() + sourceWidth() / 2 + vW() * 0.006, notesY()]}
      to={() => [-claudeWidth() / 2 - vW() * 0.006, 0]}
      stroke={PALETTE.jaune}
      end={0}
      opacity={0}
    />
    <DiagramEdge key="charte-edge" ref={charteEdge}
      from={() => [sourceX() + sourceWidth() / 2 + vW() * 0.016, charteY()]}
      to={() => [-claudeWidth() / 2 - vW() * 0.006, claudeHeight() * 0.25]}
      stroke={PALETTE.jaune}
      end={0}
      opacity={0}
    />

    {/* Sept documents — même bordure, même couleur de charte */}
    {documents.map((documentEntry, documentIndex) => (
      <Rect key={`doc-${documentIndex}`} ref={docRefs[documentIndex]}
        width={docWidth} height={docHeight}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.jaune}
        lineWidth={2}
        radius={() => vW() * 0.004}
        scale={0.4}
        opacity={0}
      >
        <Rect key={`doc-band-${documentIndex}`}
          width={docWidth} height={() => vH() * 0.008}
          y={() => -docHeight() / 2 + vH() * 0.004}
          fill={PALETTE.jaune}
        />
        <Icon key={`doc-icon-${documentIndex}`}
          icon={documentEntry.icon}
          size={() => vW() * 0.022}
          color={PALETTE.jaune}
          x={() => -docWidth() * 0.32}
          y={() => vH() * 0.004}
        />
        <Txt key={`doc-label-${documentIndex}`}
          text={documentEntry.label}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.011}
          fontFamily={MONO}
          fontWeight={700}
          x={() => docWidth() * 0.08}
          y={() => vH() * 0.004}
        />
      </Rect>
    ))}

    {/* Frise 13 → 18 août */}
    <Layout key="frise-group" ref={friseGroup} opacity={0}>
      <Rect key="frise-track"
        width={friseWidth} height={() => vH() * 0.01}
        x={() => friseLeft() + friseWidth() / 2} y={friseY}
        fill={PALETTE.ghost}
        radius={() => vH() * 0.005}
      />
      <Rect key="frise-fill" ref={friseFill}
        width={0} height={() => vH() * 0.01}
        offset={[-1, 0]}
        x={friseLeft} y={friseY}
        fill={PALETTE.jaune}
        radius={() => vH() * 0.005}
      />
      {friseDays.map((dayLabel, dayIndex) => (
        <Circle key={`frise-tick-${dayIndex}`} ref={friseTickRefs[dayIndex]}
          width={() => vW() * 0.012} height={() => vW() * 0.012}
          x={() => friseTickX(dayIndex)} y={friseY}
          fill={PALETTE.nodeBg}
          stroke={PALETTE.ghost}
          lineWidth={2}
        />
      ))}
      {friseDays.map((dayLabel, dayIndex) => (
        <Txt key={`frise-day-${dayIndex}`}
          text={dayLabel}
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.011}
          fontFamily={MONO}
          x={() => friseTickX(dayIndex)}
          y={() => friseY() + vH() * 0.035}
        />
      ))}
      <Txt key="frise-month"
        text="AOÛT"
        fill={PALETTE.jaune}
        fontSize={() => vW() * 0.012}
        fontFamily={MONO}
        fontWeight={700}
        x={() => friseLeft() - vW() * 0.04}
        y={friseY}
      />
    </Layout>
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Deux semaines : le compte à rebours
  sfxReset();
  yield* waitUntil('deux-semaines');
  yield* all(
    gridRef().opacity(0.07, 0.8),
    dialGroup().opacity(1, 0.5),
  );
  sfxFill(0, 1, 1.4, {ease: easeInOutCubic, steps: 8});
  yield* dialRing().end(1, 1.4, easeInOutCubic);
  yield* waitFor(0.4);

  // 2. Les sources
  yield* waitUntil('sources');
  sfx('travel', 0.4);
  [0, 0.3, 0.6].forEach(delay => sfx('tick', 0.8, 0.8 + delay));
  yield* all(
    dialGroup().position([0, dialTopY()], 0.8, easeInOutCubic),
    dialGroup().scale(0.7, 0.8, easeInOutCubic),
  );
  yield* sequence(0.3,
    planNode().opacity(1, 0.5),
    notesNode().opacity(1, 0.5),
    charteCard().opacity(1, 0.5),
  );
  yield* waitFor(0.4);

  // 3. Tout converge vers Claude ; la charte est un gabarit imposé
  yield* waitUntil('claude');
  yield* claudeNode().opacity(1, 0.5);
  planEdge().opacity(1);
  notesEdge().opacity(1);
  charteEdge().opacity(1);
  sfx('draw', 0.6);
  yield* sequence(0.2,
    planEdge().end(1, 0.6, easeInOutCubic),
    notesEdge().end(1, 0.6, easeInOutCubic),
    charteEdge().end(1, 0.6, easeInOutCubic),
  );
  sfx('activate');
  yield* claudeNode().setState('active', 0.3);
  sfx('land', 0.5);
  yield* all(
    lockFrame().opacity(1, 0.4),
    lockBadge().opacity(1, 0.4),
  );
  yield* lockBadge().scale(1.25, 0.2, easeOutCubic);
  yield* lockBadge().scale(1, 0.25);
  yield* waitFor(0.4);

  // 4. Sept documents en éventail, la frise se remplit
  yield* waitUntil('sept-documents');
  yield* friseGroup().opacity(1, 0.4);
  docRefs.forEach((_, docIndex) => sfx('tick', 0.8, 0.4 * docIndex));
  sfx('success', 0.8, 3.5);
  yield* all(
    sequence(0.4,
      ...docRefs.map((docRef, docIndex) => all(
        docRef().position([docX(docIndex), docY(docIndex)], 0.7, easeOutCubic),
        docRef().opacity(1, 0.4),
        docRef().scale(1, 0.7, easeOutCubic),
      )),
    ),
    friseFill().width(friseWidth(), 2.8 + 0.7),
    sequence(0.48,
      ...friseTickRefs.map(tickRef => all(
        tickRef().fill(PALETTE.jaune, 0.3),
        tickRef().stroke(PALETTE.jaune, 0.3),
      )),
    ),
  );
  yield* waitFor(1);
  sfxFlush('documents-source-unique');
});
