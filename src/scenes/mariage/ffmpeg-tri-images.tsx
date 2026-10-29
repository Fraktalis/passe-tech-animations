/**
 * ffmpeg-tri-images — Découper la vidéo, trier les images (JUMEAU, ch. 4).
 *
 * Une bande vidéo à perforations entre dans « ffmpeg » et ressort en pile de
 * vignettes. Les images floues tombent en rose, un doublon disparaît. Les images
 * gardées s'alignent en chaîne : chaque paire voisine se recouvre (zone jaune,
 * les mêmes formes se retrouvent des deux côtés). On retire une image au
 * milieu : la chaîne se casse (rose), on la remet.
 *
 * Couleur active : jaune. Rose uniquement pour ce qui est rejeté / cassé.
 *
 * Battements : decoupe · tri · recouvrement
 */
import {makeScene2D, Grid, Layout, Rect, Circle, blur} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
  useRandom,
} from '@motion-canvas/core';
import {DiagramNode} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxReset, sfxFlush} from '../../sfx';

// ── Données statiques ────────────────────────────────────────────────────────

const GRID_COLUMNS = 4;
const GRID_ROWS = 3;
const THUMB_COUNT = GRID_COLUMNS * GRID_ROWS;
const BLURRY_THUMBS = [1, 6, 10];
const DUPLICATE_THUMB = 5; // jumeau de la vignette 4
const KEPT_THUMBS = [0, 2, 3, 4, 7, 8, 9, 11];

/** Largeur de l'image et décalage entre deux images voisines (en fraction de vW). */
const IMAGE_WIDTH = 0.12;
const CHAIN_PITCH = 0.09;
const IMAGE_HEIGHT = 0.16; // fraction de vH
const GRID_SCALE = 0.65;

/** Fenêtre du « panorama » vue par chaque vignette. */
function windowIndexOf(thumbIndex: number): number {
  if (BLURRY_THUMBS.includes(thumbIndex)) return [1, 4, 6][BLURRY_THUMBS.indexOf(thumbIndex)];
  if (thumbIndex === DUPLICATE_THUMB) return KEPT_THUMBS.indexOf(DUPLICATE_THUMB - 1);
  return KEPT_THUMBS.indexOf(thumbIndex);
}

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Panorama : mêmes formes à des positions absolues, chaque vignette en voit une tranche ──
  const random = useRandom(1503, true);
  const panoramaShapes = Array.from({length: 18}, (_, shapeIndex) => ({
    panoramaX: 0.02 + shapeIndex * 0.043,
    offsetY: random.nextFloat(-0.045, 0.045),
    size: random.nextFloat(0.012, 0.024),
    isCircle: shapeIndex % 2 === 0,
    isHighlight: shapeIndex % 3 === 0,
  }));

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const ffmpegX = () => vW() * -0.1;
  const gridCenterX = 0.27; // fraction de vW
  const gridSlot = (thumbIndex: number): [number, number] => [
    vW() * (gridCenterX + ((thumbIndex % GRID_COLUMNS) - 1.5) * 0.095),
    vH() * (Math.floor(thumbIndex / GRID_COLUMNS) - 1) * 0.125,
  ];
  const chainSlot = (keptOrder: number): [number, number] => [
    vW() * (keptOrder - 3.5) * CHAIN_PITCH,
    vH() * -0.02,
  ];
  const perforationCount = 8;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const filmStrip = createRef<Layout>();
  const ffmpegNode = createRef<DiagramNode>();
  const thumbRefs = Array.from({length: THUMB_COUNT}, () => createRef<Rect>());
  const overlapRefs = Array.from({length: KEPT_THUMBS.length - 1}, () => createRef<Rect>());
  const holeMarker = createRef<Rect>();

  // ── Contenu d'une vignette ─────────────────────────────────────────────────
  const thumbShapes = (thumbIndex: number) => {
    const windowCenter = windowIndexOf(thumbIndex) * CHAIN_PITCH + IMAGE_WIDTH / 2;
    return panoramaShapes
      .map((shape, shapeIndex) => ({...shape, shapeIndex, localX: shape.panoramaX - windowCenter}))
      .filter(shape => Math.abs(shape.localX) < IMAGE_WIDTH / 2 + shape.size);
  };

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

    {/* Bande vidéo à perforations */}
    <Layout key="film-strip" ref={filmStrip}
      x={() => vW() * -0.42} y={0}
      opacity={0}
    >
      <Rect key="film-strip-body"
        width={() => vW() * 0.16} height={() => vH() * 0.15}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.jaune}
        lineWidth={2}
        radius={() => vW() * 0.003}
      />
      {Array.from({length: perforationCount}, (_, perforationIndex) => (
        <Rect key={`film-perforation-top-${perforationIndex}`}
          width={() => vW() * 0.008} height={() => vH() * 0.014}
          fill={PALETTE.jaune + '88'}
          x={() => (perforationIndex - (perforationCount - 1) / 2) * vW() * 0.0185}
          y={() => vH() * -0.062}
          radius={() => vW() * 0.001}
        />
      ))}
      {Array.from({length: perforationCount}, (_, perforationIndex) => (
        <Rect key={`film-perforation-bottom-${perforationIndex}`}
          width={() => vW() * 0.008} height={() => vH() * 0.014}
          fill={PALETTE.jaune + '88'}
          x={() => (perforationIndex - (perforationCount - 1) / 2) * vW() * 0.0185}
          y={() => vH() * 0.062}
          radius={() => vW() * 0.001}
        />
      ))}
      {[-1, 0, 1].map(frameOffset => (
        <Rect key={`film-frame-${frameOffset}`}
          width={() => vW() * 0.04} height={() => vH() * 0.075}
          stroke={PALETTE.jaune + 'AA'}
          lineWidth={2}
          x={() => frameOffset * vW() * 0.048}
          radius={() => vW() * 0.002}
        />
      ))}
    </Layout>

    {/* Nœud ffmpeg — recouvre la bande quand elle entre */}
    <DiagramNode key="ffmpeg-node" ref={ffmpegNode}
      iconName="mdi:filmstrip"
      label="ffmpeg"
      color={PALETTE.jaune}
      initialState="idle"
      width={() => vW() * 0.22} height={() => vH() * 0.3}
      x={ffmpegX} y={0}
      opacity={0}
    />

    {/* Marqueur du trou dans la chaîne */}
    <Rect key="hole-marker" ref={holeMarker}
      width={() => vW() * IMAGE_WIDTH} height={() => vH() * IMAGE_HEIGHT}
      stroke={PALETTE.rose}
      lineWidth={3}
      lineDash={[10, 8]}
      radius={() => vW() * 0.004}
      x={() => chainSlot(3)[0]} y={() => chainSlot(3)[1]}
      opacity={0}
    />

    {/* Vignettes */}
    {Array.from({length: THUMB_COUNT}, (_, thumbIndex) => (
      <Rect key={`thumb-${thumbIndex}`} ref={thumbRefs[thumbIndex]}
        width={() => vW() * IMAGE_WIDTH} height={() => vH() * IMAGE_HEIGHT}
        fill={PALETTE.bgCard}
        stroke={PALETTE.secondary}
        lineWidth={2}
        radius={() => vW() * 0.004}
        clip
        scale={0.3}
        x={() => ffmpegX() + vW() * 0.11} y={0}
        opacity={0}
      >
        <Layout key={`thumb-content-${thumbIndex}`}
          filters={BLURRY_THUMBS.includes(thumbIndex) ? [blur(() => vW() * 0.004)] : []}
        >
          {thumbShapes(thumbIndex).map(shape => shape.isCircle ? (
            <Circle key={`thumb-${thumbIndex}-shape-${shape.shapeIndex}`}
              size={() => vW() * shape.size * 2}
              fill={shape.isHighlight ? PALETTE.jaune + 'CC' : PALETTE.secondary + 'AA'}
              x={() => vW() * shape.localX}
              y={() => vH() * shape.offsetY}
            />
          ) : (
            <Rect key={`thumb-${thumbIndex}-shape-${shape.shapeIndex}`}
              width={() => vW() * shape.size * 2}
              height={() => vW() * shape.size * 2}
              fill={shape.isHighlight ? PALETTE.jaune + 'CC' : PALETTE.secondary + 'AA'}
              x={() => vW() * shape.localX}
              y={() => vH() * shape.offsetY}
            />
          ))}
        </Layout>
      </Rect>
    ))}

    {/* Zones de recouvrement entre images voisines */}
    {overlapRefs.map((overlapRef, pairIndex) => (
      <Rect key={`overlap-${pairIndex}`} ref={overlapRef}
        width={() => vW() * (IMAGE_WIDTH - CHAIN_PITCH)} height={() => vH() * IMAGE_HEIGHT}
        fill={PALETTE.jaune + '55'}
        stroke={PALETTE.jaune}
        lineWidth={2}
        x={() => (chainSlot(pairIndex)[0] + chainSlot(pairIndex + 1)[0]) / 2}
        y={() => chainSlot(pairIndex)[1]}
        opacity={0}
      />
    ))}
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  sfxReset();

  // 1. Découpe : la bande entre dans ffmpeg, ressort en pile d'images
  yield* waitUntil('decoupe');
  yield* gridRef().opacity(0.07, 0.8);
  yield* all(
    filmStrip().opacity(1, 0.5),
    ffmpegNode().opacity(1, 0.5),
  );
  sfx('travel', 0.5);
  sfx('activate', 1, 0.3);
  yield* all(
    filmStrip().x(ffmpegX(), 1.4, easeInOutCubic),
    ffmpegNode().setState('active', 1),
  );
  yield* filmStrip().opacity(0, 0.2);
  thumbRefs.forEach((_, thumbIndex) => sfx('tick', 0.6, 0.07 * thumbIndex));
  yield* sequence(0.07, ...thumbRefs.map((thumb, thumbIndex) => all(
    thumb().opacity(1, 0.3),
    thumb().scale(GRID_SCALE, 0.6, easeOutCubic),
    thumb().position(gridSlot(thumbIndex), 0.6, easeOutCubic),
  )));

  // 2. Tri : les floues tombent en rose, un doublon disparaît
  yield* waitUntil('tri');
  yield* all(...BLURRY_THUMBS.map(thumbIndex => thumbRefs[thumbIndex]().stroke(PALETTE.rose, 0.3)));
  sfx('swap', 0.6);
  yield* all(...BLURRY_THUMBS.map(thumbIndex => all(
    thumbRefs[thumbIndex]().y(gridSlot(thumbIndex)[1] + vH() * 0.2, 0.9, easeInOutCubic),
    thumbRefs[thumbIndex]().opacity(0, 0.9),
  )));
  yield* all(
    thumbRefs[DUPLICATE_THUMB - 1]().stroke(PALETTE.jaune, 0.3),
    thumbRefs[DUPLICATE_THUMB]().stroke(PALETTE.jaune, 0.3),
  );
  yield* waitFor(0.3);
  sfx('disappear');
  yield* all(
    thumbRefs[DUPLICATE_THUMB]().opacity(0, 0.5),
    thumbRefs[DUPLICATE_THUMB]().scale(0.3, 0.5),
    thumbRefs[DUPLICATE_THUMB - 1]().stroke(PALETTE.secondary, 0.5),
  );

  // 3. Recouvrement : les gardées forment une chaîne, on retire une image, on la remet
  yield* waitUntil('recouvrement');
  yield* ffmpegNode().opacity(0, 0.4);
  sfx('travel', 0.5);
  yield* all(...KEPT_THUMBS.map((thumbIndex, keptOrder) => all(
    thumbRefs[thumbIndex]().position(chainSlot(keptOrder), 0.9, easeInOutCubic),
    thumbRefs[thumbIndex]().scale(1, 0.9, easeInOutCubic),
    thumbRefs[thumbIndex]().stroke(PALETTE.jaune, 0.9),
  )));
  overlapRefs.forEach((_, overlapIndex) => sfx('tick', 0.8, 0.1 * overlapIndex));
  yield* sequence(0.1, ...overlapRefs.map(overlapRef => overlapRef().opacity(1, 0.3)));
  yield* waitFor(0.4);

  // Une image du milieu part : trou, chaîne cassée
  const removedKeptOrder = 3;
  const removedThumb = thumbRefs[KEPT_THUMBS[removedKeptOrder]];
  sfx('failure', 0.8);
  yield* all(
    removedThumb().y(chainSlot(removedKeptOrder)[1] - vH() * 0.22, 0.6, easeInOutCubic),
    removedThumb().opacity(0.3, 0.6),
    holeMarker().opacity(1, 0.4),
    overlapRefs[removedKeptOrder - 1]().stroke(PALETTE.rose, 0.3),
    overlapRefs[removedKeptOrder - 1]().fill(PALETTE.rose + '55', 0.3),
    overlapRefs[removedKeptOrder]().stroke(PALETTE.rose, 0.3),
    overlapRefs[removedKeptOrder]().fill(PALETTE.rose + '55', 0.3),
  );
  yield* all(
    overlapRefs[removedKeptOrder - 1]().opacity(0, 0.5),
    overlapRefs[removedKeptOrder]().opacity(0, 0.5),
  );
  yield* waitFor(0.5);

  // On la remet : la chaîne se rétablit
  sfx('travel', 0.5);
  yield* all(
    removedThumb().position(chainSlot(removedKeptOrder), 0.6, easeInOutCubic),
    removedThumb().opacity(1, 0.6),
    holeMarker().opacity(0, 0.4),
  );
  overlapRefs[removedKeptOrder - 1]().stroke(PALETTE.jaune);
  overlapRefs[removedKeptOrder - 1]().fill(PALETTE.jaune + '55');
  overlapRefs[removedKeptOrder]().stroke(PALETTE.jaune);
  overlapRefs[removedKeptOrder]().fill(PALETTE.jaune + '55');
  sfx('success', 0.8);
  yield* all(
    overlapRefs[removedKeptOrder - 1]().opacity(1, 0.4),
    overlapRefs[removedKeptOrder]().opacity(1, 0.4),
  );
  sfxFlush('ffmpeg-tri-images');
});
