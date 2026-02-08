import {makeProject} from '@motion-canvas/core';

import mainScene from './scenes/openclaw-flow?scene';
import mainScene2 from './scenes/bitShift?scene';
import controlVsData from './scenes/llm-control-vs-data?scene';

export default makeProject({
  scenes: [controlVsData],

});
