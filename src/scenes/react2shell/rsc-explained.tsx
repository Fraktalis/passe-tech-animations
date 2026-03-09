import {
  makeScene2D,
  Rect,
  Txt,
  Layout,
  Line,
  Grid,
} from '@motion-canvas/2d';
import {
  all,
  createRef,
  DEFAULT,
  easeInBounce,
  easeInElastic,
  easeOutBounce,
  easeOutCubic,
  sequence,
  waitFor,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const server = createRef<Rect>();
  const browser = createRef<Rect>();

      const mainLayout = createRef<Layout>();
      const grid = createRef<Grid>();

  const serverComponent = createRef<Rect>();
  const clientComponent = createRef<Rect>();

  const htmlPayload = createRef<Rect>();
  const jsPayload = createRef<Rect>();

  const line = createRef<Line>();

  view.add(
    <Layout ref={mainLayout}>
          <Grid
            ref={grid}
            width={'100%'}
            height={'100%'}
            stroke={'#6E7681'}
            start={0}
            end={1}
            zIndex={-5000}
          />

    <Layout direction={'row'} gap={80} alignItems={'center'}>
      {/* SERVER */}
      <Rect
        ref={server}
        width={view.width() / 3}
        height={view.height() / 3}
        radius={16}
        fill={'#0F172A'}
        stroke={'#22C55E'}
        x={view.width() / 4}
        lineWidth={4}
        layout
        scale={0}
        direction={'column'}
        padding={20}
        gap={16}
      >
        <Txt text={'Serveur'} fill={'#22C55E'} fontFamily="Space Grotesk" fontSize={128} />

        <Rect
          ref={serverComponent}
          radius={10}
          fill={'#16A34A'}
          height={80}
          opacity={0}
        >
          <Txt text={'Server Component'} fill={'white'} />
        </Rect>

        <Rect
          ref={clientComponent}
          radius={10}
          fill={'#2563EB'}
          height={80}
          opacity={0}
        >
          <Txt text={'Client Component'} fill={'white'} />
        </Rect>
      </Rect>

      {/* ARROW */}
      <Line
        points={[[-40, 0], [40, 0]]}
        stroke={'#E5E7EB'}
        lineWidth={18}
        arrowSize={50}
        start={0}
        end={0}
        ref={line}
        endArrow
      />

      {/* Client */}
      <Rect
        ref={browser}
        width={view.width() / 3}
        height={view.height() / 3}
        radius={16}
        scale={0}
        fill={'#020617'}
        stroke={'#e42951'}
        lineWidth={4}
        layout
        x={-view.width() / 4}
        direction={'column'}
        padding={20}
        gap={16}
      > 
        <Txt text={'Client'} fill={'#e42951'} fontFamily="Space Grotesk" fontSize={128} />

        <Rect
          ref={htmlPayload}
          radius={10}
          fill={'#4ADE80'}
          height={80}
          opacity={0}
        >
          <Txt text={'HTML + Data'} fill={'#052E16'} />
        </Rect>

        <Rect
          ref={jsPayload}
          radius={10}
          fill={'#60A5FA'}
          height={80}
          opacity={0}
        >
                <Txt text={'JS + Hydration'} fill={'#020617'} />
            </Rect>
            </Rect>
        </Layout>

        <Rect zIndex={-10000} fill={"#1B1F23"} width={view.width} height={view.height}></Rect>
    </Layout>
   
   

  );

  yield* sequence(
    0.4,
    browser().scale(1, 0.6, easeOutBounce),
    server().scale(1, 0.6, easeOutBounce),
  );

  // Animation sequence
  yield* sequence(
    0.4,
    serverComponent().opacity(1, 0.6),
    clientComponent().opacity(1, 0.6),
  );

  yield* waitFor(0.5);

yield* line().points([server().position, browser().position]);
  yield* line().y(-25, 2)
  yield* line().stroke("#2563EB", 0.6)

  yield* line().end(1, 0.9);
  yield* line().start(1, 0.9);

  // Client Component → JS + hydration
  yield* all(
    jsPayload().opacity(1, 0.6),
    clientComponent().opacity(0.2, 0.4),
    jsPayload().absolutePosition(DEFAULT, 0.4),
  );

    yield* waitFor(0.5);
    
      yield* line().end(0, 0);
  yield* line().start(0, 0);

   yield* waitFor(0.5);


     yield* line().points([server().position, browser().position]);
  yield* line().y(-125, 2)
  yield* line().stroke("#4ADE80", 0.6)


  yield* line().end(1, 0.9);
  yield* line().start(1, 0.9);
  // Server Component → HTML only
  yield* all(
    serverComponent().opacity(0.2, 0.4),
    htmlPayload().absolutePosition(DEFAULT, 0.4),
    htmlPayload().opacity(1, 0.6),
  );


});
