/**
 * source-de-verite — Une source, deux écrivains, une IA qu'on relit (CH.7 — LEÇON).
 *
 * Les deux mariés écrivent dans la même source. Flashback rapide : un seul
 * écrivain, l'autre reste derrière une barrière, ses notes s'accumulent ailleurs
 * et la source se périme (l'opacité baisse). Enfin une sortie d'IA est comparée
 * à la source par une ligne de balayage : une différence fine (un accent) est
 * détectée et surlignée.
 *
 * Couleur active : vert. Rose pour la variante ratée et la différence détectée.
 * Alex = bleu, sa femme = rose (identité fixe).
 */
import {makeScene2D, Grid, Circle, Rect, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  Reference,
  all,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  Vector2,
} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge, Packet} from '../../components';
import {PALETTE} from '../../theme';

type Box = {position(): Vector2; width(): number; height(): number};

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const MONO = 'JetBrains Mono, DM Mono, monospace';

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const badgeSize  = () => vW() * 0.06;
  const edgeMargin = () => vW() * 0.008;
  const alexX = () => -vW() * 0.30;
  const wifeX = () => vW() * 0.30;
  const barrierX = () => vW() * 0.19;

  const docWidth  = () => vW() * 0.26;
  const docHeight = () => vH() * 0.40;
  const sourceDocX = () => -vW() * 0.17;
  const aiDocX     = () => vW() * 0.17;
  const rowOffsetX = () => -docWidth() / 2 + vW() * 0.025;
  const rowYs = [() => -vH() * 0.12, () => -vH() * 0.04, () => vH() * 0.04, () => vH() * 0.12];
  const docIconY = () => -vH() * 0.29;
  const rowFontSize = () => vW() * 0.016;

  const toPoint = (vector: Vector2): [number, number] => [vector.x, vector.y];

  /** Point sur le bord de `source` en direction de `target`, décalé de `margin`. */
  const edgePoint = (source: Box, target: Box, margin: number): [number, number] => {
    const sourcePosition = source.position();
    const targetPosition = target.position();
    const deltaX = targetPosition.x - sourcePosition.x;
    const deltaY = targetPosition.y - sourcePosition.y;
    const distance = Math.hypot(deltaX, deltaY) || 1;
    const scaleX = deltaX === 0 ? Infinity : source.width() / 2 / Math.abs(deltaX);
    const scaleY = deltaY === 0 ? Infinity : source.height() / 2 / Math.abs(deltaY);
    const ratio = Math.min(scaleX, scaleY);
    return [
      sourcePosition.x + deltaX * ratio + (deltaX / distance) * margin,
      sourcePosition.y + deltaY * ratio + (deltaY / distance) * margin,
    ];
  };

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const alexBadge = createRef<Circle>();
  const wifeBadge = createRef<Circle>();
  const sourceNode = createRef<DiagramNode>();
  const alexEdge = createRef<DiagramEdge>();
  const wifeEdge = createRef<DiagramEdge>();
  const alexPacket = createRef<Packet>();
  const wifePacket = createRef<Packet>();

  const flashbackVeil = createRef<Rect>();
  const wifeBarrier = createRef<Rect>();
  const unloggedDocA = createRef<Icon>();
  const unloggedDocB = createRef<Icon>();
  const unloggedDocC = createRef<Icon>();

  const sourceDoc = createRef<Rect>();
  const aiDoc = createRef<Rect>();
  const sourceDocIcon = createRef<Icon>();
  const aiDocIcon = createRef<Icon>();
  const scanLine = createRef<Rect>();
  const sourceDiffBox = createRef<Rect>();
  const aiDiffBox = createRef<Rect>();

  /** Ligne de document : texte simple, ou préfixe + caractère différent isolé et surlignable. */
  const docRow = (
    rowKey: string,
    prefix: string,
    rowIndex: number,
    diff?: {character: string; boxRef: Reference<Rect>; color: string},
  ) => diff ? (
    <Rect key={rowKey}
      layout direction={'row'} alignItems={'center'}
      offset={[-1, 0]}
      x={rowOffsetX} y={rowYs[rowIndex]}
    >
      <Txt key={`${rowKey}-prefix`} text={prefix}
        fill={PALETTE.cream} fontSize={rowFontSize} fontFamily={MONO} />
      <Rect key={rowKey + '-diff-box'} ref={diff.boxRef}
        layout
        padding={() => vW() * 0.002}
        fill={diff.color + '00'}
        stroke={diff.color + '00'}
        lineWidth={2}
        radius={() => vW() * 0.002}
      >
        <Txt key={`${rowKey}-diff-char`} text={diff.character}
          fill={PALETTE.cream} fontSize={rowFontSize} fontFamily={MONO} />
      </Rect>
    </Rect>
  ) : (
    <Txt key={rowKey} text={prefix}
      fill={PALETTE.cream} fontSize={rowFontSize} fontFamily={MONO}
      offset={[-1, 0]}
      x={rowOffsetX} y={rowYs[rowIndex]}
    />
  );

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid key="bg-grid" ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* Les deux écrivains et la source */}
    <Circle key="badge-alex" ref={alexBadge}
      width={badgeSize} height={badgeSize}
      fill={PALETTE.nodeBg} stroke={PALETTE.blue} lineWidth={2}
      x={alexX} y={0}
      opacity={0}
    >
      <Icon key="badge-alex-icon" icon="mdi:account" color={PALETTE.blue} size={() => vW() * 0.035} />
    </Circle>
    <Circle key="badge-wife" ref={wifeBadge}
      width={badgeSize} height={badgeSize}
      fill={PALETTE.nodeBg} stroke={PALETTE.rose} lineWidth={2}
      x={wifeX} y={0}
      opacity={0}
    >
      <Icon key="badge-wife-icon" icon="mdi:account" color={PALETTE.rose} size={() => vW() * 0.035} />
    </Circle>
    <DiagramNode key="source-node" ref={sourceNode}
      iconName="mdi:database"
      label="SOURCE"
      color={PALETTE.vert}
      initialState="idle"
      width={() => vW() * 0.14} height={() => vH() * 0.24}
      x={0} y={0}
      opacity={0}
    />
    <DiagramEdge key="edge-alex-source" ref={alexEdge}
      from={() => edgePoint(alexBadge(), sourceNode(), edgeMargin())}
      to={() => edgePoint(sourceNode(), alexBadge(), edgeMargin())}
      stroke={PALETTE.vert}
      end={0} opacity={0}
    />
    <DiagramEdge key="edge-wife-source" ref={wifeEdge}
      from={() => edgePoint(wifeBadge(), sourceNode(), edgeMargin())}
      to={() => edgePoint(sourceNode(), wifeBadge(), edgeMargin())}
      stroke={PALETTE.vert}
      end={0} opacity={0}
    />
    <Packet key="alex-packet" ref={alexPacket}
      content="md"
      color={PALETTE.vert}
      packetSize="sm"
      width={() => vW() * 0.03} height={() => vH() * 0.04}
      x={alexX} y={0}
      opacity={0}
    />
    <Packet key="wife-packet" ref={wifePacket}
      content="md"
      color={PALETTE.vert}
      packetSize="sm"
      width={() => vW() * 0.03} height={() => vH() * 0.04}
      x={wifeX} y={0}
      opacity={0}
    />

    {/* Flashback : voile, barrière, notes qui restent dehors */}
    <Rect key="wife-barrier" ref={wifeBarrier}
      width={() => vW() * 0.008} height={() => vH() * 0.22}
      fill={PALETTE.rose}
      radius={() => vW() * 0.003}
      x={barrierX} y={0}
      opacity={0}
    />
    <Icon key="unlogged-doc-a" ref={unloggedDocA}
      icon="mdi:file-document-outline" color={PALETTE.rose}
      size={() => vW() * 0.022}
      x={() => vW() * 0.41} y={() => -vH() * 0.08}
      opacity={0}
    />
    <Icon key="unlogged-doc-b" ref={unloggedDocB}
      icon="mdi:file-document-outline" color={PALETTE.rose}
      size={() => vW() * 0.022}
      x={() => vW() * 0.41} y={0}
      opacity={0}
    />
    <Icon key="unlogged-doc-c" ref={unloggedDocC}
      icon="mdi:file-document-outline" color={PALETTE.rose}
      size={() => vW() * 0.022}
      x={() => vW() * 0.41} y={() => vH() * 0.08}
      opacity={0}
    />
    <Rect key="flashback-veil" ref={flashbackVeil}
      width={'100%'} height={'100%'}
      fill={'#00000055'}
      opacity={0}
    />

    {/* Comparaison : source / sortie IA */}
    <Rect key="source-doc" ref={sourceDoc}
      width={docWidth} height={docHeight}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.vert}
      lineWidth={2}
      radius={() => vW() * 0.004}
      x={sourceDocX} y={0}
      opacity={0}
    >
      {docRow('source-row-1', 'Camille', 0)}
      {docRow('source-row-2', 'Zo', 1, {character: 'é', boxRef: sourceDiffBox, color: PALETTE.vert})}
      {docRow('source-row-3', 'Louis', 2)}
      {docRow('source-row-4', 'Inès', 3)}
    </Rect>
    <Rect key="ai-doc" ref={aiDoc}
      width={docWidth} height={docHeight}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.secondary}
      lineWidth={2}
      radius={() => vW() * 0.004}
      x={aiDocX} y={0}
      opacity={0}
    >
      {docRow('ai-row-1', 'Camille', 0)}
      {docRow('ai-row-2', 'Zo', 1, {character: 'e', boxRef: aiDiffBox, color: PALETTE.rose})}
      {docRow('ai-row-3', 'Louis', 2)}
      {docRow('ai-row-4', 'Inès', 3)}
    </Rect>
    <Icon key="source-doc-icon" ref={sourceDocIcon}
      icon="mdi:database" color={PALETTE.vert}
      size={() => vW() * 0.03}
      x={sourceDocX} y={docIconY}
      opacity={0}
    />
    <Icon key="ai-doc-icon" ref={aiDocIcon}
      icon="logos:claude-icon"
      size={() => vW() * 0.03}
      x={aiDocX} y={docIconY}
      opacity={0}
    />
    <Rect key="scan-line" ref={scanLine}
      width={() => vW() * 0.62} height={() => vH() * 0.005}
      fill={PALETTE.vert}
      shadowColor={PALETTE.vert}
      shadowBlur={() => vW() * 0.01}
      x={0} y={() => -vH() * 0.19}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Les deux écrivent dans la même source
  yield* waitUntil('source');
  yield* gridRef().opacity(0.07, 0.6);
  yield* sourceNode().opacity(1, 0.5);
  yield* sequence(0.2, alexBadge().opacity(1, 0.4), wifeBadge().opacity(1, 0.4));
  alexEdge().opacity(1);
  wifeEdge().opacity(1);
  yield* all(
    alexEdge().end(1, 0.6, easeInOutCubic),
    wifeEdge().end(1, 0.6, easeInOutCubic),
  );
  alexPacket().position(toPoint(alexBadge().position()));
  wifePacket().position(toPoint(wifeBadge().position()));
  yield* all(alexPacket().opacity(1, 0.15), wifePacket().opacity(1, 0.15));
  yield* all(
    alexPacket().flyTo(edgePoint(sourceNode(), alexBadge(), 0), 0.9),
    wifePacket().flyTo(edgePoint(sourceNode(), wifeBadge(), 0), 0.9),
  );
  yield* all(
    alexPacket().opacity(0, 0.15),
    wifePacket().opacity(0, 0.15),
    sourceNode().setState('active', 0.3),
  );
  yield* waitFor(0.5);

  // 2. Flashback : un seul écrivain, la source se périme
  yield* waitUntil('un-seul-ecrivain');
  yield* all(
    flashbackVeil().opacity(1, 0.25),
    wifeEdge().opacity(0, 0.25),
    wifeBarrier().opacity(1, 0.25),
  );
  const unloggedDocs = [unloggedDocA, unloggedDocB, unloggedDocC];
  const stalenessLevels = [0.7, 0.5, 0.3];
  for (let i = 0; i < unloggedDocs.length; i++) {
    wifePacket().position(toPoint(wifeBadge().position()));
    yield* wifePacket().opacity(1, 0.1);
    yield* wifePacket().flyTo([barrierX() + vW() * 0.015, 0], 0.3);
    yield* all(
      wifePacket().position(toPoint(wifeBadge().position()), 0.3, easeInOutCubic),
      wifePacket().opacity(0, 0.3),
      unloggedDocs[i]().opacity(1, 0.3),
      sourceNode().opacity(stalenessLevels[i], 0.3),
    );
  }
  yield* waitFor(0.3);
  // Retour au présent
  yield* all(
    flashbackVeil().opacity(0, 0.3),
    wifeBarrier().opacity(0, 0.3),
    unloggedDocA().opacity(0, 0.3),
    unloggedDocB().opacity(0, 0.3),
    unloggedDocC().opacity(0, 0.3),
    sourceNode().opacity(1, 0.3),
    wifeEdge().opacity(1, 0.3),
  );

  // 3. La sortie de l'IA est comparée à la source : une différence fine
  yield* waitUntil('ia-comparee');
  yield* all(
    alexBadge().opacity(0, 0.4),
    wifeBadge().opacity(0, 0.4),
    alexEdge().opacity(0, 0.4),
    wifeEdge().opacity(0, 0.4),
    sourceNode().opacity(0, 0.4),
  );
  yield* all(
    sourceDoc().opacity(1, 0.5),
    aiDoc().opacity(1, 0.5),
    sourceDocIcon().opacity(1, 0.5),
    aiDocIcon().opacity(1, 0.5),
  );
  yield* scanLine().opacity(1, 0.2);
  yield* scanLine().y(rowYs[1](), 1.4, easeInOutCubic);
  // La ligne s'arrête sur la différence : l'accent
  sourceDiffBox().fill(PALETTE.vert + '33');
  sourceDiffBox().stroke(PALETTE.vert);
  yield* all(
    scanLine().fill(PALETTE.rose, 0.2),
    aiDiffBox().fill(PALETTE.rose + '33', 0.2),
    aiDiffBox().stroke(PALETTE.rose, 0.2),
    aiDoc().stroke(PALETTE.rose, 0.2),
  );
  yield* all(
    aiDiffBox().scale(1.25, 0.2),
    sourceDiffBox().scale(1.25, 0.2),
  );
  yield* all(
    aiDiffBox().scale(1, 0.25),
    sourceDiffBox().scale(1, 0.25),
  );
  yield* waitFor(1);
});
