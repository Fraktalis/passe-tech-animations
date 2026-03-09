import {
  makeScene2D,
  Rect,
  Txt,
  Layout,
  Grid,
} from '@motion-canvas/2d';
import {
  all,
  createRef,
  easeOutCubic,
  sequence,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const page = createRef<Rect>();

  const header = createRef<Rect>();
  const sidebar = createRef<Rect>();
  const content = createRef<Rect>();
  const footer = createRef<Rect>();
    const grid = createRef<Grid>();
    const client = createRef<Rect>();
    const server = createRef<Rect>();
    const mainLayout = createRef<Layout>();



  view.add(
    <Layout ref={mainLayout}>
      <Grid
        ref={grid}
        width={'100%'}
        height={'100%'}
        stroke={'#6E7681'}
        start={0}
        end={0}
        zIndex={-5000}
      />

      <Rect
       key='client'
        ref={client}
        width={view.width() / 4}
        height={view.height() / 4}
        fill={'#e42951'}
        radius={40}
        x={-1000}
        y={0}
        zIndex={-10}
        scale={1}
      >
        <Txt fontFamily="Space Grotesk"
          text="Client"
          fill="white"
          fontSize={128}
          y={-100}
        />
        </Rect>

        <Rect
        key='server'
        ref={server}
        width={view.width() / 4}
        height={view.height() / 4}
        fill={'#1c5c0e'}
        radius={40}
        x={1000}
        y={0}
        scale={1}
        zIndex={-10}
      >
        <Txt fontFamily="Space Grotesk"
          text="Serveur"
          fill="white"
          fontSize={128}
          y={-100}
        />
      </Rect>

      <Rect
      ref={page}
      width={view.width() / 3 - 200}
      height={view.height() / 2}
      radius={16}
      x={1000}
      fill={'#111827'}
      stroke={'#E5E7EB'}
      lineWidth={4}
      layout
      alignItems={'stretch'}
      padding={20}
      scale={0}
    >
      <Layout direction={'column'} gap={16} grow={1}>
        <Rect
          ref={header}
          height={256}
          radius={8}
          fill={'#2563EB'}
          opacity={0}
          y={-40}
        >
          <Txt text={'Header'} fill={'white'} fontFamily="Space Grotesk" fontSize={128} />
        </Rect>

        <Layout direction={'row'} gap={16} grow={1}>
          <Rect
            ref={sidebar}
            width={500}
            radius={8}
            fill={'#7C3AED'}
            opacity={0}
            x={-40}
          >
            <Txt text={'Sidebar'} fill={'white'} fontFamily="Space Grotesk" fontSize={128} />
          </Rect>

          <Rect
            ref={content}
            radius={8}
            fill={'#10B981'}
            grow={1}
            opacity={0}
            y={40}
          >
            <Txt text={'Content'} fill={'white'} fontFamily="Space Grotesk" fontSize={128} />
          </Rect>
        </Layout>

        <Rect
          ref={footer}
          height={128}
          radius={8}
          fill={'#F59E0B'}
          opacity={0}
          y={40}
        >
          <Txt text={'Footer'} fill={'white'} fontFamily="Space Grotesk" fontSize={128} />
        </Rect>
      </Layout>
    </Rect>

     


      <Rect zIndex={-10000} fill={"#1B1F23"} width={view.width} height={view.height}></Rect>
    </Layout>
  );


yield* all(
    grid().end(0.5, 0.3).to(1, 0.3),
    grid().start(0.5, 0.3).to(0, 0.3)
  );

  yield* all(
    client().width(view.width() / 3, 0.8),
    client().height(view.height() - 200, 0.8),
    client().childAs<Txt>(0).y(-800, 0.8)
  )

    yield* all(
    server().width(view.width() / 3, 0.8),
    server().height(view.height() - 200, 0.8),
    server().childAs<Txt>(0).y(-800, 0.8)
  )

  yield* page().scale(1, 0.8, easeOutCubic);


  yield* sequence(
    0.2,
    header().opacity(1, 0.5, easeOutCubic),
    sidebar().opacity(1, 0.5, easeOutCubic),
    content().opacity(1, 0.5, easeOutCubic),
    footer().opacity(1, 0.5, easeOutCubic),
  );

   yield* page().position(client().position, 1);

});