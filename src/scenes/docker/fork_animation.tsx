import {Circle, Grid, Img, Layout, makeScene2D, Rect, Txt} from '@motion-canvas/2d';
import {all, createRef, sequence, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Create your animations here


  const grid = createRef<Grid>();
  const oracle = createRef<Img>();
  const mariadb = createRef<Img>();
  const mysql = createRef<Img>();
  const openoffice = createRef<Img>();
  const libreoffice = createRef<Img>();
  const jenkins = createRef<Img>();
  const amazon = createRef<Img>();
  const opensearch = createRef<Img>();
  const elasticsearch = createRef<Img>();
  const terraform = createRef<Img>();
  const opentofu = createRef<Img>();
  const redis = createRef<Img>();
  const valkey = createRef<Img>();

  const hudson = createRef<Txt>();

  view.add(<Layout>
    <Grid
      
        ref={grid}
        width={'100%'}
        height={'100%'}
        stroke={'#6E7681'}
        start={0}
        end={0}
        zIndex={-5000}
      />  

      <Img position={[-2500,0]} scale={2} ref={oracle} zIndex={10} src="src/img/oracle.png"/>
      <Img ref={mysql} scale={0} src="src/img/mysql.png"/>
      <Img ref={mariadb} scale={0} src="src/img/mariadb.png"/>


      <Img ref={libreoffice} scale={0} src="src/img/libreoffice.png"/>
      <Img ref={openoffice} scale={0} src="src/img/openoffice.png"/>

      <Img ref={jenkins} scale={0} src="src/img/jenkins.png"/>
      <Txt ref={hudson} text={""} fontFamily={"'JetBrains Mono'"} fontSize={300} fill={"#ffffff"}/>

      <Img ref={elasticsearch} scale={0} src="src/img/elasticsearch.png"/>
      <Img ref={opensearch} scale={0} src="src/img/opensearch.png"/>
      <Img ref={amazon} scale={0} src="src/img/amazon.png"/>

      <Img ref={opentofu} scale={0} src="src/img/opentofu.png"/>
      <Img ref={terraform} scale={0} src="src/img/terraform.png"/>

      <Img ref={valkey} scale={0} src="src/img/valkey.png"/>
      <Img ref={redis} scale={0} src="src/img/redis.png"/>


      <Rect zIndex={-10000} fill={"#1B1F23"} width={view.width} height={view.height}></Rect>
    </Layout>);

      yield* all (
    grid().end(0.5, 0.3).to(1, 0.3),
    grid().start(0.5, 0.3).to(0, 0.3),
    mysql().scale(2.3, 0.3).to(2, 0.3)
  );

  yield* all(mariadb().scale(2, 0.2),
     mariadb().offset([0, -3], 0.3))


     yield* sequence(0.5,
      oracle().position(mysql().position, 0.5),
      mysql().scale(0, 0.3),
      oracle().position([2500, 0], 0.5)
     );

     yield* mariadb().offset([0, -8], 0.5);

     yield* waitUntil("libreoffice");

     // Open office vs Libre Office

     yield* openoffice().scale(2.3, 0.3).to(2, 0.3);

       yield* all(libreoffice().scale(2, 0.2),
     libreoffice().offset([0, -5], 0.3))

     yield* sequence(0.5,
      oracle().position(openoffice().position, 0.5),
      openoffice().scale(0, 0.3),
      oracle().position([-2500, 0], 0.5)
     );

     yield* libreoffice().offset([0, -10], 0.5);

     // Jenkins

     yield* hudson().text("Hudson", 0.5);

     yield* all(jenkins().scale(2, 0.2),
     jenkins().offset([0, -3], 0.3))

     yield* sequence(0.5,
      oracle().position(hudson().position, 0.5),
      hudson().scale(0, 0.3),
      oracle().position([2500, 0], 0.5)
     );

     yield* jenkins().offset([0, -10], 0.5);

    // opensearch

    yield* elasticsearch().scale(1.2, 0.3).to(1, 0.3);

    yield* all(
      elasticsearch().offset([2,0], 0.3),
      amazon().offset([-2, 0], 0.3),
      amazon().scale(2.3, 0.3).to(2, 0.3)
    )

    yield* all(elasticsearch().offset([1,0], 0.1),
      amazon().offset([-1, 0], 0.1))

    yield* all(elasticsearch().offset([2,0], 0.3),
      amazon().offset([-2, 0], 0.3))
    
    yield* elasticsearch().offset([10,0], 0.3)

    yield* all(
      amazon().offset([-1.5, 0], 0.1).to([-3, 0], 0.3),
      opensearch().scale(2.3, 0.1).to(2, 0.1)
    )

    yield* all(
      opensearch().scale(2.3, 0.3).to(2, 0.1)
    )
    
    yield* waitUntil("OpenTofu")
    // OpenTofu

    yield* all(
      amazon().offset([-3, -10], 0.3),
      opensearch().offset([0, -15], 0.3)
    )

    

     yield* all(
      terraform().scale(2.3, 0.3).to(2, 0.3)
    )

    yield* terraform().scale(5, 1);

    yield* all(
      terraform().scale(2, 0),
      terraform().offset([-1.5, 0], 0),
      opentofu().scale(2, 0),
      opentofu().offset([1.5, 0], 0),
    );

    yield* waitUntil("redis")

     yield* all(
      terraform().offset([-10.5, 0], 0.6),
      opentofu().offset([10.5, 0], 0.6),
    );

    // redis

         yield* all(
      redis().scale(2.3, 0.3).to(2, 0.3)
    )

    yield* redis().scale(5, 1);

    yield* all(
      redis().scale(2, 0),
      redis().offset([-1.5, 0], 0),
      valkey().scale(2, 0),
      valkey().offset([1.5, 0], 0),
    );

    yield* waitUntil("valkey")

     yield* all(
      redis().offset([-10.5, 0], 0.6),
      valkey().offset([10.5, 0], 0.6),
    );
}); 
