import {makeProject} from '@motion-canvas/core';

import mainScene from './scenes/openclaw-flow?scene';
import mainScene2 from './scenes/bitShift?scene';
import controlVsData from './scenes/llm-control-vs-data?scene';
import namespacePid from './scenes/namespace-pid?scene';
import namespaceNet from './scenes/namespace-net?scene';
import cgroups from './scenes/cgroups?scene';
import subscribeCta from './scenes/subscribe-cta?scene';
import dockerRecipe from './scenes/docker-recipe?scene';
import bioDocker from './scenes/bio-docker?scene';
import isolationEras from './scenes/isolation-eras?scene';
import wasmPipeline from './scenes/wasm-pipeline?scene';
import nbodyComplexity from './scenes/nbody-complexity?scene';
import wasmHistory from './scenes/wasm-history?scene';
import audio from './audio/docker_process.wav';

export default makeProject({
  scenes: [wasmHistory],
  audio
});
