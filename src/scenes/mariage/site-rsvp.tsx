/**
 * site-rsvp — Le site des invités, et le champ de saisie de trop (CH.4 — JUMEAU → site).
 *
 * Un site Astro servi depuis le homelab, en lecture seule : tout est calme. Dès
 * qu'un champ de saisie apparaît, une pile de briques s'empile sous le homelab
 * (base de données, CSRF, anti-bot, sauvegarde) et vacille. Pour un compteur à
 * « 1 » : la pile s'effondre, le champ devient un lien vers Google Forms, hors
 * du homelab.
 *
 * Couleur active : cyan. Rose uniquement pour la pile qui vacille.
 * Zone « homelab » : même rendu que dans `systeme-briques` (label, cyan, tirets).
 */
import {makeScene2D, Grid, Circle, Rect, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  Reference,
  all,
  cancel,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  Vector2,
  ThreadGenerator,
} from '@motion-canvas/core';
import {DiagramNode, DiagramEdge, Packet, Zone} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxReset, sfxFlush} from '../../sfx';

type Box = {position(): Vector2; width(): number; height(): number};

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const MONO = 'JetBrains Mono, DM Mono, monospace';

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const edgeMargin = () => vW() * 0.008;
  const zoneX = () => -vW() * 0.28;
  const siteY = () => -vH() * 0.20;

  const browserX = () => vW() * 0.22;
  const browserY = () => -vH() * 0.12;
  const fieldY   = () => browserY() + vH() * 0.05;

  const formsX = () => vW() * 0.35;
  const formsY = () => vH() * 0.33;

  const stackLabels = ['base de données', 'CSRF', 'anti-bot', 'sauvegarde'];
  // Du bas vers le haut : la première brique pose la pile.
  const stackYs = [() => vH() * 0.31, () => vH() * 0.23, () => vH() * 0.15, () => vH() * 0.07];
  const stackBlocks: Reference<Rect>[] = stackLabels.map(() => createRef<Rect>());

  const thumbnails = [
    {name: 'map', icon: 'mdi:map-outline', offsetX: -0.095},
    {name: 'faq', icon: 'mdi:help-circle-outline', offsetX: 0},
    {name: 'photos', icon: 'mdi:image-outline', offsetX: 0.095},
  ];

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
  const homelabZone = createRef<Zone>();
  const siteNode = createRef<DiagramNode>();
  const browserWindow = createRef<Rect>();
  const siteToBrowserEdge = createRef<DiagramEdge>();
  const pagePacket = createRef<Packet>();
  const inputField = createRef<Rect>();
  const inputCaret = createRef<Rect>();
  const linkChip = createRef<Rect>();
  const usageLabel = createRef<Txt>();
  const formsNode = createRef<DiagramNode>();
  const linkToFormsEdge = createRef<DiagramEdge>();

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid key="bg-grid" ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* Zone homelab — rendu identique à systeme-briques */}
    <Zone key="homelab-zone" ref={homelabZone}
      label="HOMELAB"
      color={PALETTE.cyan}
      width={() => vW() * 0.32}
      height={() => vH() * 0.80}
      x={zoneX} y={0}
      opacity={0}
    />
    <DiagramNode key="site-node" ref={siteNode}
      iconName="logos:astro-icon"
      label="SITE INVITÉS"
      color={PALETTE.cyan}
      initialState="idle"
      width={() => vW() * 0.12} height={() => vH() * 0.22}
      x={zoneX} y={siteY}
      opacity={0}
    />

    {/* Navigateur : trois pages en vignettes */}
    <Rect key="browser-window" ref={browserWindow}
      width={() => vW() * 0.30} height={() => vH() * 0.50}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.secondary}
      lineWidth={2}
      radius={() => vW() * 0.006}
      clip
      x={browserX} y={browserY}
      opacity={0}
    >
      <Rect key="browser-title-bar"
        width={'100%'} height={() => vH() * 0.06}
        fill={PALETTE.ghost + '40'}
        y={() => -vH() * 0.22}
      />
      <Circle key="browser-dot-close" width={() => vW() * 0.007} height={() => vW() * 0.007}
        fill={PALETTE.rose} x={() => -vW() * 0.135} y={() => -vH() * 0.22} />
      <Circle key="browser-dot-min" width={() => vW() * 0.007} height={() => vW() * 0.007}
        fill={PALETTE.jaune} x={() => -vW() * 0.12} y={() => -vH() * 0.22} />
      <Circle key="browser-dot-max" width={() => vW() * 0.007} height={() => vW() * 0.007}
        fill={PALETTE.vert} x={() => -vW() * 0.105} y={() => -vH() * 0.22} />
      <Icon key="browser-title-icon" icon="mdi:web" color={PALETTE.secondary}
        size={() => vW() * 0.014} x={() => -vW() * 0.075} y={() => -vH() * 0.22} />
      {thumbnails.map(thumbnail => (
        <Rect key={`thumb-${thumbnail.name}`}
          width={() => vW() * 0.075} height={() => vH() * 0.15}
          fill={PALETTE.bg}
          stroke={PALETTE.cyan + '88'}
          lineWidth={1}
          radius={() => vW() * 0.003}
          x={() => thumbnail.offsetX * vW()}
          y={() => -vH() * 0.10}
        >
          <Icon key={`thumb-${thumbnail.name}-icon`} icon={thumbnail.icon}
            color={PALETTE.cyan} size={() => vW() * 0.022} />
        </Rect>
      ))}
    </Rect>

    <Packet key="page-packet" ref={pagePacket}
      content="html"
      color={PALETTE.cyan}
      packetSize="sm"
      width={() => vW() * 0.035} height={() => vH() * 0.04}
      x={zoneX} y={siteY}
      opacity={0}
    />
    <DiagramEdge key="edge-site-browser" ref={siteToBrowserEdge}
      from={() => edgePoint(siteNode(), browserWindow(), edgeMargin())}
      to={() => edgePoint(browserWindow(), siteNode(), edgeMargin())}
      stroke={PALETTE.cyan}
      end={0} opacity={0}
    />

    {/* Le champ de saisie, puis le lien qui le remplace */}
    <Rect key="input-field" ref={inputField}
      width={() => vW() * 0.22} height={() => vH() * 0.06}
      fill={PALETTE.bg}
      stroke={PALETTE.cyan}
      lineWidth={2}
      radius={() => vW() * 0.003}
      x={browserX} y={fieldY}
      opacity={0}
    >
      <Rect key="input-caret" ref={inputCaret}
        width={() => vW() * 0.0018} height={() => vH() * 0.035}
        fill={PALETTE.cream}
        x={() => -vW() * 0.095}
      />
    </Rect>
    <Rect key="link-chip" ref={linkChip}
      width={() => vW() * 0.07} height={() => vH() * 0.06}
      fill={PALETTE.cyan + '22'}
      stroke={PALETTE.cyan}
      lineWidth={2}
      radius={() => vW() * 0.003}
      x={browserX} y={fieldY}
      opacity={0}
    >
      <Icon key="link-chip-icon" icon="mdi:link-variant" color={PALETTE.cyan} size={() => vW() * 0.02} />
    </Rect>

    {/* La pile de briques sous le homelab */}
    {stackLabels.map((label, blockIndex) => (
      <Rect key={`stack-block-${blockIndex}`} ref={stackBlocks[blockIndex]}
        width={() => vW() * 0.22} height={() => vH() * 0.06}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.cyan}
        lineWidth={2}
        radius={() => vW() * 0.003}
        x={zoneX} y={stackYs[blockIndex]}
        opacity={0}
      >
        <Txt key={`stack-block-${blockIndex}-label`} text={label}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.011}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
    ))}

    <Txt key="usage-label" ref={usageLabel}
      text="utilisations : 1"
      fill={PALETTE.cream}
      fontSize={() => vW() * 0.015}
      fontFamily={MONO}
      fontWeight={700}
      x={() => vW() * 0.11} y={formsY}
      opacity={0}
    />

    {/* Hors du homelab */}
    <DiagramNode key="forms-node" ref={formsNode}
      iconName="simple-icons:googleforms"
      label="GOOGLE FORMS"
      color={PALETTE.cyan}
      initialState="idle"
      width={() => vW() * 0.12} height={() => vH() * 0.20}
      x={formsX} y={formsY}
      opacity={0}
    />
    <DiagramEdge key="edge-link-forms" ref={linkToFormsEdge}
      from={() => edgePoint(linkChip(), formsNode(), edgeMargin())}
      to={() => edgePoint(formsNode(), linkChip(), edgeMargin())}
      stroke={PALETTE.cyan}
      edgeStyle="dashed"
      end={0} opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  sfxReset();

  // 1. Le site, calme, en lecture seule
  yield* waitUntil('site');
  yield* gridRef().opacity(0.07, 0.6);
  yield* all(homelabZone().opacity(1, 0.5), siteNode().opacity(1, 0.5));
  yield* browserWindow().opacity(1, 0.5);
  siteToBrowserEdge().opacity(1);
  sfx('draw');
  yield* siteToBrowserEdge().end(1, 0.6, easeInOutCubic);
  sfx('activate');
  yield* siteNode().setState('active', 0.3);
  pagePacket().position(toPoint(siteNode().position()));
  yield* pagePacket().opacity(1, 0.15);
  sfx('travel');
  yield* pagePacket().flyTo(edgePoint(browserWindow(), siteNode(), 0), 0.9);
  yield* pagePacket().opacity(0, 0.15);
  yield* waitFor(0.6);

  // 2. Un champ de saisie : la pile de briques s'empile et vacille
  yield* waitUntil('formulaire');
  yield* inputField().opacity(1, 0.3);
  const caretBlink: ThreadGenerator = yield (function* () {
    while (true) {
      yield* inputCaret().opacity(0, 0.4);
      yield* inputCaret().opacity(1, 0.4);
    }
  })();
  for (const blockRef of stackBlocks) {
    blockRef().y(blockRef().y() - vH() * 0.04);
  }
  stackBlocks.forEach((_, blockIndex) => sfx('land', 0.8, 0.15 * blockIndex + 0.3));
  yield* sequence(0.15,
    ...stackBlocks.map((blockRef, blockIndex) => all(
      blockRef().opacity(1, 0.25),
      blockRef().y(stackYs[blockIndex](), 0.3, easeInOutCubic),
    )),
  );
  yield* all(...stackBlocks.map(blockRef => blockRef().stroke(PALETTE.rose, 0.5)));
  for (let i = 0; i < 3; i++) {
    sfx('tick');
    yield* all(...stackBlocks.map((blockRef, blockIndex) =>
      blockRef().rotation(blockIndex % 2 === 0 ? 3 : -3, 0.14)));
    sfx('tick');
    yield* all(...stackBlocks.map((blockRef, blockIndex) =>
      blockRef().rotation(blockIndex % 2 === 0 ? -3 : 3, 0.14)));
  }
  yield* all(...stackBlocks.map(blockRef => blockRef().rotation(0, 0.14)));

  // 3. Une seule utilisation
  yield* waitUntil('une-fois');
  yield* usageLabel().opacity(1, 0.4);
  sfx('emphasis');
  yield* usageLabel().scale(1.25, 0.2);
  yield* usageLabel().scale(1, 0.25);
  yield* waitFor(0.4);

  // 4. La pile s'effondre, le champ devient un lien vers Google Forms
  yield* waitUntil('google-form');
  cancel(caretBlink);
  stackBlocks.forEach((_, reversedIndex) => sfx('collapse', 0.5, 0.1 * reversedIndex + 0.4));
  yield* sequence(0.1,
    ...[...stackBlocks].reverse().map((blockRef, reversedIndex) => all(
      blockRef().y(blockRef().y() + vH() * 0.10, 0.5, easeInOutCubic),
      blockRef().rotation(reversedIndex % 2 === 0 ? 14 : -14, 0.5),
      blockRef().opacity(0, 0.5),
    )),
  );
  sfx('swap');
  yield* all(inputField().opacity(0, 0.3), linkChip().opacity(1, 0.3), formsNode().opacity(1, 0.5));
  linkToFormsEdge().opacity(1);
  sfx('draw');
  yield* linkToFormsEdge().end(1, 0.6, easeInOutCubic);
  sfx('success');
  yield* all(formsNode().setState('success', 0.4), siteNode().setState('active', 0.4));
  yield* waitFor(1);
  sfxFlush('site-rsvp');
});
