import {makeScene2D, Rect, Txt} from '@motion-canvas/2d';
import {createRef, waitUntil} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

// ── Modifier ce texte à chaque utilisation ────────────────────────────────────
const BADGE_TEXT = '--privileged';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const badgeRef = createRef<Rect>();

  view.add(
    <Rect
      key="badge"
      ref={badgeRef}
      layout
      paddingTop={() => vH() * 0.028}
      paddingBottom={() => vH() * 0.028}
      paddingLeft={() => vW() * 0.040}
      paddingRight={() => vW() * 0.040}
      radius={() => vH() * 0.022}
      fill={'#13131A'}
      stroke={PALETTE.rose + '66'}
      lineWidth={3}
      opacity={1}
    >
      <Txt
        key="badge-text"
        text={BADGE_TEXT}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.075}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
      />
    </Rect>,
  );

  yield* waitUntil('show');
  yield* badgeRef().opacity(1, 0.35);

  yield* waitUntil('hide');
  yield* badgeRef().opacity(0, 0.35);
});
