import {makeProject} from '@motion-canvas/core';

import mainScene from './scenes/openclaw-flow?scene';
import mainScene2 from './scenes/bitShift?scene';
import controlVsData from './scenes/llm-control-vs-data?scene';
import namespacePid from './scenes/namespace-pid?scene';
import namespaceNet from './scenes/namespace-net?scene';
import cgroups from './scenes/cgroups?scene';
import subscribeCta from './scenes/subscribe-cta?scene';
import audio from './audio/introduction_p1.wav';

export default makeProject({
  scenes: [subscribeCta],
  audio
});
