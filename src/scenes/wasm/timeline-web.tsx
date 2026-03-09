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
  const controller = createRef<Rect>();
  const model = createRef<Rect>();
  const vue = createRef<Rect>();
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

      <Rect
        ref={controller}
        shadowBlur={0}
        shadowColor={"#ffffff"}
        width={view.width() / 4}
        height={view.height() / 4}
        fill={'#F7931E'}
        radius={40}
        x={1000}
        y={-500}
        scale={0}
        zIndex={10}
      >
        <Txt fontFamily="Space Grotesk"
          text="Controlleur"
          fill="white"
          fontSize={128}
          y={-100}
        />
      </Rect>

      <Rect
        ref={model}
        width={view.width() / 4}
        height={view.height() / 4}
        fill={'#A5D6A7'}
        radius={40}
        x={1400}
        y={400}
        scale={0}
        zIndex={10}
      >
        <Txt fontFamily="Space Grotesk"
          text="Modèle"
          fill="white"
          fontSize={128}
          y={-100}
        />
      </Rect>


      <Rect
        ref={vue}
        width={view.width() / 4}
        height={view.height() / 4}
        fill={'#6E7681'}
        radius={40}
        x={400}
        y={400}
        scale={0}
        zIndex={10}
      >
        <Txt fontFamily="Space Grotesk"
          text="Vue"
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

  yield* waitUntil("1991");

  const line = new Line({
    points: [client().position, server().position],
    stroke: '#0099FF',
    lineWidth:80,
    arrowSize:160,
    endArrow: true,
    end: 0
  });

  mainLayout().add(line);
  yield* line.end(1, 0.8);
  yield* line.start(1, 0.8);

  yield* line.end(0);
  yield* line.start(0);


  const html = new SVG({
    svg: htmlRaw,
    zIndex: 10,
    scale: 0,
    position: server().position
  });


  applyRecursivelyToSVGSubPath(html, {
    stroke: '#000000',
    lineWidth: 5,
    fill: '#fff'
  });

  mainLayout().add(html);

  yield* html.scale(0.6, 0.6);
  yield* html.position(client().position, 2);

  yield* html.scale(0, 1);

  yield* waitUntil("1996");

  yield* html.position(server().position);

  yield* line.end(1, 0.8);
  yield* line.start(1, 0.8);

  const css = new SVG({
    svg: cssRaw,
    zIndex: 10,
    scale: 0,
    position: server().position
  });


  applyRecursivelyToSVGSubPath(css, {
    stroke: '#000000',
    lineWidth: 5,
    fill: '#fff'
  });


  mainLayout().add(css);

  yield* sequence(0.6, 
      html.scale(0.6, 0.6),
      html.position(client().position, 2),
      css.scale(0.6, 0.6),
      html.scale(0, 1),
      css.position(client().position, 2),
      css.scale(0, 1)
  );

  yield* waitUntil("1997");

  yield* html.position(server().position);
  yield* css.position(server().position);
  yield* line.end(0);
  yield* line.start(0);


    const js = new SVG({
    svg: jsRaw,
    zIndex: 10,
    scale: 0,
    position: server().position
  });


  applyRecursivelyToSVGSubPath(js, {
    stroke: '#000000',
    lineWidth: 5,
    fill: '#fff'
  });


  mainLayout().add(js);


    yield* line.end(1, 0.8);
    yield* line.start(1, 0.8);

    yield* sequence(0.6, 
      html.scale(0.6, 0.6),
      html.position(client().position, 2),
      css.scale(0.6, 0.6),
      html.scale(0, 1),
      css.position(client().position, 2),
      js.scale(0.6, 0.6),
      css.scale(0, 1),
      js.position(client().position, 2),
      js.scale(0, 1),
  );

  yield* waitUntil("2000");


  yield* html.position(controller().position);
  yield* css.position(controller().position);
  yield* js.position(controller().position);
  yield* line.end(0);
  yield* line.start(0);

  yield* all(
    client().width(view.width() / 5, 1),
    client().height(view.height() / 5, 1),
    client().x(-1200, 1)
);

  yield* sequence(0.3,
    server().width(view.width() / 20, 1),
    server().height(view.height() / 2, 1),
    server().childAs<Txt>(0).y(- server().height() / 2 - 400, 1),
    server().x(-300, 1)
  );

  yield* all(
    model().scale(1, 0.6),
    controller().scale(1, 0.6),
    vue().scale(1, 0.6),
  )

  yield* line.end(1, 0.6);
  yield* line.start(1, 0.6);

  yield* line.points([server().position, controller().position], 0.6)
  yield* line.end(0);
  yield* line.start(0);
  

  yield* line.end(1, 0.6);
  yield* line.start(1, 0.6);

  yield* controller().shadowBlur(500, 0.6);

  yield* line.points([model().position, controller().position], 0.6)
  yield* line.end(0);
  yield* line.start(0);
  yield* line.end(1, 0.6);
  yield* line.start(1, 0.6);

  yield* line.points([vue().position, controller().position], 0.6)
  yield* line.end(0);
  yield* line.start(0);
  yield* line.end(1, 0.6);
  yield* line.start(1, 0.6);

  yield* sequence(0.6, 
      html.scale(0.6, 0.6),
      controller().shadowBlur(0, 1),
      html.position(server().position, 1),
      html.position(client().position, 1),
      html.scale(0, 0.6)
  );

  yield* waitUntil("2010");

  yield* all(
  controller().scale(0, 0.6),
  model().scale(0, 0.6),
  vue().scale(0, 0.6),
);

yield* all(
  server().width(view.width() / 8, 0.6),
  server().childAs<Txt>(0).text("API", 0.6),
  server().x(1200, 0.6)
);


yield* all(
  client().width(view.width() / 2, 0.8),
  client().height(view.height() / 2, 0.8),
  client().childAs<Txt>(0).y(-670, 0.6),
  client().x(-700, 0.8),
  client().childAs<Layout>(1).opacity(1, 0.8),
);

const json = new Txt({
  text: "{ JSON }",
  fill: "#00E5FF",
  fontSize: 64,
  position: server().position,
  opacity: 0,
});

mainLayout().add(json);

yield* json.opacity(1, 0.3);
yield* sequence(
  1,
  json.position(client().position, 1),
  json.position(server().position, 1),
  json.position(client().position, 1),
  json.position(server().position, 1),
  json.position(client().position, 1),
  json.position(server().position, 1),
  json.position(client().position, 1),
  json.position(server().position, 1),
  json.position(client().position, 1),
);
yield* json.opacity(0, 0.3);

});
