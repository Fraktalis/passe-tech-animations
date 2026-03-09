import { Circle, Grid, Layout, Line, makeScene2D, Rect, SVG, Txt } from '@motion-canvas/2d';
import { all, createRef, easeInOutCubic, sequence, waitUntil } from '@motion-canvas/core';

import htmlRaw from "../img/html-svgrepo-com.svg?raw"
import cssRaw from "../img/css-svgrepo-com.svg?raw"
import jsRaw from "../img/js-svgrepo-com.svg?raw"
import { applyRecursivelyToSVGSubPath } from '../applyRecursivelyToPath';

export default makeScene2D(function* (view) {
  // Create your animations here

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
        zIndex={10}
        scale={0}
      >
        <Txt fontFamily="Space Grotesk"
          text="Client"
          fill="white"
          fontSize={128}
          y={-100}
        />
        <Layout opacity={0} layout direction={"column"}>
          <Txt fontFamily="Space Grotesk"
            text="├─ Composants"
            fill="white"
            fontSize={128}
          />
          <Txt fontFamily="Space Grotesk"
            text="├─ Routeur"
            fill="white"
            fontSize={128}
          />
          <Txt fontFamily="Space Grotesk"
            text="├─ State"
            fill="white"
            fontSize={128}
          />
        </Layout>
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
        scale={0}
        zIndex={10}
      >
        <Txt fontFamily="Space Grotesk"
          text="Serveur"
          fill="white"
          fontSize={128}
          y={-100}
        />
      </Rect>

     


      <Rect zIndex={-10000} fill={"#1B1F23"} width={view.width} height={view.height}></Rect>
    </Layout>
  );

  yield* all(
    grid().end(0.5, 0.3).to(1, 0.3),
    grid().start(0.5, 0.3).to(0, 0.3)
  );

  yield* client().scale(1, 0.3, easeInOutCubic);
  yield* server().scale(1, 0.3, easeInOutCubic);

  const js = new SVG({
    svg: jsRaw,
    zIndex: 10,
    scale: 0,
  });


  applyRecursivelyToSVGSubPath(js, {
    stroke: '#000000',
    lineWidth: 5,
    fill: '#fff'
  });

});
