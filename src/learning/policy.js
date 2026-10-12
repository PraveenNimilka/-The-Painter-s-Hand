import spec from './spec.json' with {type:'json'};
import checkpoint from './checkpoint.json' with {type:'json'};
import originalCheckpoint from './soft-checkpoint.json' with {type:'json'};
export {spec,checkpoint};
export const softCheckpoint={...originalCheckpoint,observation_version:1};
export const checkpointFor=finish=>finish==='soft'?softCheckpoint:checkpoint;
if(checkpoint.observation_version!==spec.observation_version)throw new Error('Policy observation version does not match the painter; rebuild after training.');
/** Exact NumPy tanh actor forward pass, implemented locally for offline use. */
export function scoreActions(features,weights=checkpoint.weights){
 return features.map(row=>{let score=0;for(let j=0;j<weights.b1.length;j++){let v=weights.b1[j];for(let i=0;i<row.length;i++)v+=row[i]*weights.w1[i][j];score+=Math.tanh(v)*weights.w2[j];}return score;});
}
export function selectAction(features,weights=checkpoint.weights){const scores=scoreActions(features,weights);let best=0;for(let i=1;i<scores.length;i++)if(scores[i]>scores[best])best=i;return {index:best,score:scores[best]};}
