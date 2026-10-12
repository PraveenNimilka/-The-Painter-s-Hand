import checkpoint from './checkpoint.json' with {type:'json'};
import {artists,featureNames} from './environment.js';
export {checkpoint};
function latent(f,weights){const {w1,b1,w2,b2}=weights,first=Float64Array.from(b1),second=Float64Array.from(b2);for(let i=0;i<64;i++){const row=w1[i],v=f[i];for(let j=0;j<96;j++)first[j]+=v*row[j];}for(let i=0;i<96;i++){const v=Math.tanh(first[i]),row=w2[i];for(let j=0;j<48;j++)second[j]+=v*row[j];}for(let j=0;j<48;j++)second[j]=Math.tanh(second[j]);return second;}
export function scores(features,artist,model=checkpoint){
 if(model.feature_names.length!==64||model.feature_names.some((v,i)=>v!==featureNames[i])||model.grammar!=='studio-materials-v2')throw new Error('Academy model does not match the executable mark grammar.');
 const head=model.weights.heads[artists.indexOf(artist)];if(!head)throw new Error('Unknown artist.');
 return features.map(f=>{const h=latent(f,model.weights);let score=0;for(let j=0;j<48;j++)score+=h[j]*head[j];return score;});
}
export function choose(features,artist,model){const logits=scores(features,artist,model);return logits.reduce((best,v,i)=>v>logits[best]?i:best,0);}
export function geometryFor(features,artist,model=checkpoint){if(!model.weights.geometry)return [0,0,0,0,0,0];const ai=artists.indexOf(artist),h=latent(features,model.weights);return model.weights.geometry[ai].map((row,k)=>row.reduce((s,v,j)=>s+v*h[j],model.weights.geometry_bias[ai][k]));}
