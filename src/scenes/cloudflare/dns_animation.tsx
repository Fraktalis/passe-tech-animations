// File: dns-resolution.scene.ts
import {makeScene2D} from '@motion-canvas/2d';
import {
  Rect,
  Txt,
  Line,
  Layout,
} from '@motion-canvas/2d/lib/components';
import {createRef, all, waitFor, sequence} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // Nodes
  const client = createRef<Rect>();
  const dns = createRef<Rect>();
  const webServer = createRef<Rect>();
  const rootLayer = createRef<Rect>();
  const countryLayer = createRef<Rect>();
  const lastLayer = createRef<Rect>();
  const queryArrow = createRef<Line>();
  const responseLine = createRef<Line>();
  const finalLink = createRef<Line>();
  const dnsLayers = createRef<Layout>();
  const dnsIp = createRef<Txt>();
  const mobileDnsIP = createRef<Txt>();
  const webServerIp = createRef<Txt>();

  // Main layout
  view.add(
    <>
      <Layout>
<Rect
        ref={client}
        width={1000}
        height={480}
        fill={'#e42951'}
        radius={40}
        x={-1300}
        y={300}
        scale={0}
      >
        <Txt fontFamily="Space Grotesk"
          text="Client"
          fill="white"
          fontSize={128}
          y={-100}
        />
        <Txt fontFamily="Space Grotesk"
          text="youtube.com"
          fontSize={80}
          fill="white"
          y={50}
        />
      </Rect>

      <Rect
        ref={dns}
        width={1000}
        height={480}
        fill={'#60A5FA'}
        radius={40}
        x={0}
        y={-600}
        scale={0}
      >
        <Txt fontFamily="Space Grotesk" text="Serveur DNS" fill="white" fontSize={128} />
      </Rect>

      <Rect
        ref={webServer}
        width={1000}
        height={480}
        fill={'#FACC15'}
        radius={40}
        x={1300}
        y={300}
        scale={0 }
      >
        <Txt fontFamily="Space Grotesk" text="Serveur Web" fill="black" fontSize={128} y={-100} />
        <Txt fontFamily="Space Grotesk" ref={webServerIp} text="???" fontSize={80} y={50} />
      </Rect>

      <Line
        ref={queryArrow}
        points={[
          client().position().add({x: client().width()/2, y: 0}),
          dns().position().sub({x: dns().width()/2, y: 0}),
        ]}
        stroke={'#93C5FD'}
        lineWidth={16}
        arrowSize={80}
        endArrow
        opacity={0}
        end={0}
      />

      <Line
        ref={responseLine}
        points={[
          dns().position().sub({x: dns().width()/2, y: 0}),
          client().position().add({x: client().width()/2, y: 0}),
        ]}
        stroke={'#93C5FD'}
        lineWidth={16}
        arrowSize={80}
        opacity={0}
        endArrow
        end={0}
      />

      <Line
        ref={finalLink}
        points={[
          client().position().add({x: client().width()/2, y: 0}),
          webServer().position().sub({x: webServer().width()/2, y: 0}),
        ]}
        stroke={'#93C5FD'}
        lineWidth={16}
        arrowSize={80}
        opacity={1}
        endArrow
        end={0}
      />

      </Layout>
      

      <Layout
        ref={dnsLayers}
        width={1800}
        direction="column"
        justifyContent={"center"}
        alignContent={"center"}
        alignItems={"center"}
        gap={160}
        opacity={0}
        x={0}
        y={300}
        layout
      >
        <Rect ref={rootLayer} width={400} height={120} fill="#1E3A8A" radius={40}>
          <Txt fontFamily="Space Grotesk" text="Racine (.)" fontSize={80} fill="white" />
        </Rect>
        <Layout
          key='first-level-dns'
          width={800}
          direction={'row'}
          gap={80}
        >
          <Rect ref={countryLayer} width={200} height={120} fill="#1D4ED8" radius={40}>
          <Txt fontFamily="Space Grotesk" text=".com" fontSize={80} fill="white" />
          </Rect>
          <Rect width={120} height={128} fill="#1D4ED8" radius={40}>
          <Txt fontFamily="Space Grotesk" text=".fr" fontSize={80} fill="white" />
          </Rect>
          <Rect width={200} height={128} fill="#1D4ED8" radius={40}>
          <Txt fontFamily="Space Grotesk" text=".org" fontSize={80} fill="white" />
          </Rect>
        </Layout>

          <Layout
          key='second-level-dns'
          width={1600}
          direction={'row'}
          gap={80}
        >
          <Rect ref={lastLayer} width={600} height={120} fill="#3B82F6" radius={40} layout direction="column">
          <Txt fontFamily="Space Grotesk" text="youtube.com"  fontSize={80} fill="white" />
          <Txt fontFamily="Space Grotesk" ref={dnsIp} text="192.178.155.91" fontSize={70} fill="white" opacity={0} />
          </Rect>
          <Rect width={600} height={120} fill="#3B82F6" radius={40}>
          <Txt fontFamily="Space Grotesk" text="wikipedia.fr" fontSize={80} fill="white" />
          </Rect>
          <Rect width={600} height={120} fill="#3B82F6" radius={40}>
          <Txt fontFamily="Space Grotesk" text="wikipedia.org" fontSize={80} fill="white" />
          </Rect>
        </Layout>
      </Layout>
      <Txt fontFamily="Space Grotesk" ref={mobileDnsIP} text="192.178.155.91" zIndex={-10} fontSize={70} fill="white" opacity={0} />
      <Rect key='background' width={view.width()} height={view.height()} fill="#1B1F23" zIndex={-1000}></Rect>
    </>
  );

  // Animation timeline
  yield* sequence(0.4, 
    client().scale(1.3, 0.4).to(1, 0.8),
    dns().scale(1.3, 0.4).to(1, 0.8),
    webServer().scale(1.3, 0.4).to(1, 0.8)
  );


  // Step 1 — Query leaves the client
  yield* queryArrow().opacity(1, 0.6);
  yield* queryArrow().end(1, 0.6);
  yield* waitFor(0.6);
  yield* queryArrow().start(1, 0.6);

  // Step 2 — Inside DNS: reveal hierarchy
  yield* dnsLayers().opacity(1, 0.8);
  yield* waitFor(0.2);
  yield* rootLayer().scale(1.1, 0.3).to(1, 0.2);
  yield* countryLayer().scale(1.1, 0.3).to(1, 0.2);
  yield* lastLayer().scale(1.1, 0.3).to(1, 0.2)
  yield* waitFor(0.2);
  yield* all(
    lastLayer().height(240, 0.3),
    dnsIp().opacity(1, 0.8),
    mobileDnsIP().absolutePosition(dnsIp().absolutePosition(),0.2),
  );

    yield* all(
    
    lastLayer().height(120, 0.8),
    dnsIp().opacity(0, 0.3),
    mobileDnsIP().opacity(1,0.3),
  );

  yield* mobileDnsIP().position(dns().position(), 1.5)
  yield* dnsLayers().opacity(0, 0.8);
 // Step 3 — Response back to client
  yield* responseLine().opacity(1, 0.6);
  yield* all(responseLine().end(1, 0.6),
  mobileDnsIP().position(client().position(), 3)
  )
  yield* responseLine().start(1, 0.6);
  
    yield* all(
      webServerIp().text("192.178.155.91", 1),
      mobileDnsIP().opacity(0, 0.8)

  );



  

 

  yield* finalLink().opacity(1, 0.6);
  yield* finalLink().end(1, 0.6);
  yield* waitFor(0.6);
  yield* finalLink().start(1, 0.6);
  yield* waitFor(1.5);  

  // Step 4 — Connect to the real server
  
});
