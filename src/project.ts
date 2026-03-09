import {makeProject} from '@motion-canvas/core';
import {Code, LezerHighlighter} from '@motion-canvas/2d';
import {parser} from '@lezer/javascript';

Code.defaultHighlighter = new LezerHighlighter(parser);

import mainScene from './scenes/_misc/openclaw-flow?scene';
import mainScene2 from './scenes/_misc/bitShift?scene';
import controlVsData from './scenes/_misc/llm-control-vs-data?scene';
import namespacePid from './scenes/docker/namespace-pid?scene';
import namespaceNet from './scenes/docker/namespace-net?scene';
import cgroups from './scenes/docker/cgroups?scene';
import subscribeCta from './scenes/_shared/subscribe-cta?scene';
import dockerRecipe from './scenes/docker/docker-recipe?scene';
import bioDocker from './scenes/docker/bio-docker?scene';
import isolationEras from './scenes/docker/isolation-eras?scene';
import wasmPipeline from './scenes/wasm/wasm-pipeline?scene';
import nbodyComplexity from './scenes/wasm/nbody-complexity?scene';
import wasmHistory from './scenes/wasm/wasm-history?scene';
import jitCompiler from './scenes/wasm/jit-compiler?scene';
import audio from './audio/docker_process.wav';

export default makeProject({
  scenes: [jitCompiler],
  audio
});
