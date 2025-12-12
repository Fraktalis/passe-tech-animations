import {Circle, Grid, Layout, makeScene2D, Rect} from '@motion-canvas/2d';
import {all, createRef} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Create your animations here

  const grid = createRef<Grid>();
  

  view.add(
    <Layout>
    <Grid
        ref={grid}
        width={'100%'}
        height={'100%'}
        stroke={'#6E7681'}
        start={0}
        end={0}
        zIndex={-5000}
      />  
      <Rect zIndex={-10000} fill={"#1B1F23"} width={view.width} height={view.height}></Rect>
      </Layout>
  );

  yield* all (
    grid().end(0.5, 0.3).to(1, 0.3),
    grid().start(0.5, 0.3).to(0, 0.3)
  );

});
