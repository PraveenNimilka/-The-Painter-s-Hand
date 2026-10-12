import checkpoint from './checkpoint.json' with {type:'json'};
import previousCheckpoint from './previous-checkpoint.json' with {type:'json'};
import deployment from './deployment.json' with {type:'json'};
import {featureNames} from './environment.js';
export {checkpoint,previousCheckpoint,deployment};
export const checkpointForStudio=(engine,artist,medium)=>engine==='studio-previous'||(engine==='studio'&&deployment.routes[artist+'-'+medium]==='previous')?previousCheckpoint:checkpoint;
export function score(features,artist,weights=checkpoint.weights,model=checkpoint){
 const ai=model.artists.indexOf(artist);if(ai<0)throw new Error('Unknown artist head.');
 if(model.feature_names.length!==featureNames.length||model.feature_names.some((name,i)=>name!==featureNames[i])||model.grammar!=='studio-materials-v2')throw new Error('Studio checkpoint does not match the action grammar.');
 return features.map(f=>{let out=0;for(let j=0;j<weights.b1.length;j++){let z=weights.b1[j];for(let i=0;i<f.length;i++)z+=f[i]*weights.w1[i][j];out+=Math.tanh(z)*weights.heads[ai][j];}return out;});
}
export function choose(features,artist,weights,model){const logits=score(features,artist,weights,model);let best=0;for(let i=1;i<logits.length;i++)if(logits[i]>logits[best])best=i;return best;}
