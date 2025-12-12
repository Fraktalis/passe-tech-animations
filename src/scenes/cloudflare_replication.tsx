import {Circle, Grid, Layout, Line, makeScene2D, Path, Rect, SVG} from '@motion-canvas/2d';
import {all, createRef, easeInOutBounce, PossibleVector2, sequence} from '@motion-canvas/core';
import fileCheck from '../img/file-check-svgrepo-com.svg?raw';
import fileBad from '../img/file-xmark-svgrepo-com.svg?raw';
import worldSvg from '../img/world.svg?raw';

  const graphContainer = createRef<Layout>();

function createGraphNodes(coordinates: PossibleVector2[]) {
  const nodes: Circle[] = [];
  let counter = 0;
  for (let coordinate of coordinates) {
    const circle = (<Circle zIndex={10} key={`Circle ${counter++}`} position={coordinate} scale={0} width={64} height={64} lineWidth={3} stroke={"#1B1F23"} fill={'#2F9E44'} />) as Circle;
    nodes.push(circle);
    graphContainer().add(circle);
  }

  return nodes;
}

function createGraphEdges(edgeCouples: [Circle, Circle][]) {
  const edges: Line[] = [];
  
  for (let edgeCouple of edgeCouples) {
    const line = (<Line points={[edgeCouple[0].position, edgeCouple[1].position]} end={0} lineWidth={8} stroke={"#F9F9F6"} />) as Line;
    edges.push(line);
    graphContainer().add(line);
  }

  return edges;
}

export default makeScene2D(function* (view) {
  // Create your animations here

  const circle = createRef<Circle>();
  const goodFile = createRef<SVG>();
  const badFile = createRef<SVG>();
  const world = createRef<SVG>();
  const mainLayout = createRef<Layout>();
  const grid = createRef<Grid>();

  view.add(
    <Layout ref={mainLayout}>
      <Grid
      
        ref={grid}
        width={'100%'}
        height={'100%'}
        stroke={'#6E7681'}
        start={0}
        end={0}
        zIndex={20000}
      />  
      <Rect zIndex={10000} fill={"#1B1F23"} width={view.width} height={view.height}>
        <SVG scale={0.3} stroke={"#2F9E44"} position={[-1500, -600]} ref={goodFile} svg={fileCheck} />
        <SVG scale={0.3} stroke={"#FF4F64"} position={[-1500, 600]} ref={badFile} svg={fileBad} />  
        <SVG scale={3} zIndex={-500} stroke={"#ff6699"} ref={world} svg={worldSvg} />  
        
      </Rect> 
      <Layout zIndex={20001} ref={graphContainer}>

        </Layout>
    </Layout>
  
  
  );

      /**
   * Color are applied on the deepest element of hierarchy, otherwise color is ignored
   */
  (goodFile().childAs(0).childAs(0) as Path).stroke("#2F9E44");
  (badFile().childAs(0).childAs(0) as Path).stroke("#FF4F64");

  //#region Workspace init
  const nodes = createGraphNodes([
    [-505,-333],
    [-1000,-300],
    [-750,80],
    [-950,60],
    [-650,380],
    [-50,-50],
    [0,-200],
    [50,300],
    [10,600],
    [300,-200],
    [600,-400],
    [550,250],
    [850,150],
    [950,350],
    [1150,650],
  ]);

  const edges = createGraphEdges([
    [nodes[0], nodes[1]],
    [nodes[0], nodes[3]],
    [nodes[0], nodes[4]],
    [nodes[0], nodes[6]],
    [nodes[2], nodes[1]],
    [nodes[2], nodes[3]],
    [nodes[2], nodes[4]],
    [nodes[2], nodes[6]],
    [nodes[2], nodes[5]],
    [nodes[5], nodes[6]],
    [nodes[5], nodes[7]],
    [nodes[7], nodes[8]],
    [nodes[7], nodes[9]],
    [nodes[7], nodes[11]],
    [nodes[9], nodes[11]],
    [nodes[11], nodes[12]],
    [nodes[10], nodes[12]],
    [nodes[9], nodes[10]],
    [nodes[12], nodes[13]],
    [nodes[13], nodes[14]],
  ]);

      yield* all(
    grid().end(0.5, 0.3).to(1, 0.3).wait(1),
    grid().start(0.5, 0.3).to(0, 0.3).wait(1),
  );


  
  yield * sequence(0.005, ...(world().childAs(0).children().map((path: Path) => {
    path.stroke("#6E7681");
    path.lineWidth(2).fill("#1B1F23");
    return path.scale(0).scale(1, 0.05, easeInOutBounce);    
    
  })));


  yield* sequence(0.1, ...nodes.map(node => {
    return node.scale(1.2, 0.2).to(1, 0.2);
  }));

  yield* all(...edges.map(edge => {
    return edge.end(1,0.7);
  }));
  
  //#endregion

  yield* all(goodFile().position([-1500, -600], 0.3).to(nodes[5].position, 0.6), nodes[5].fill("#2F9E44", 0.2))
  yield* all(badFile().position([-1500, 600], 0.3).to(nodes[2].position, 0.6), nodes[2].fill("#FF4F64", 0.3));

  yield* sequence(0.3, 
    goodFile().position(nodes[6].position, 0.6),
    badFile().position(nodes[1].position, 0.6),
    nodes[6].fill("#2F9E44", 0.2),
    nodes[1].fill("#FF4F64", 0.2),
    goodFile().position(nodes[0].position, 0.6),
    badFile().position(nodes[1].position, 0.6),
    nodes[0].fill("#2F9E44", 0.2),
    nodes[1].fill("#FF4F64", 0.2),
    goodFile().position(nodes[3].position, 0.6),
    badFile().position(nodes[0].position, 0.6),
    nodes[3].fill("#2F9E44", 0.2),
    nodes[0].fill("#FF4F64", 0.2),
    goodFile().position(nodes[2].position, 0.6),
    badFile().position(nodes[6].position, 0.6),
    nodes[2].fill("#2F9E44", 0.2),
    nodes[6].fill("#FF4F64", 0.2),
    goodFile().position(nodes[1].position, 0.6),
    badFile().position(nodes[5].position, 0.6),
    nodes[1].fill("#2F9E44", 0.2),
    nodes[5].fill("#FF4F64", 0.2),
    goodFile().position(nodes[0].position, 0.6),
    badFile().position(nodes[2].position, 0.6),
    nodes[0].fill("#2F9E44", 0.2),
    nodes[2].fill("#FF4F64", 0.2),
)

});
