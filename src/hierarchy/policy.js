import checkpoint from './checkpoint.json' with {type:'json'};
export {checkpoint};
export const rectangles=[1,2,5].flatMap(d=>Array.from({length:d*d},(_,i)=>({x:(i%d)*400/d,y:Math.floor(i/d)*480/d,w:400/d,h:480/d})));
export function managerScores(features,model=checkpoint){
 if(model.format!=='painters-hand-hierarchy-v1'||model.manager.network.join(',')!=='20,48,1')throw new Error('Hierarchical model does not match region features.');
 const m=model.manager;return features.map((f,k)=>{const s=model.option_schedule;if(s&&(f[12]>=s.fine_start?k<5:f[12]>=s.coarse_end?k<1:false))return -1e9;let score=m.b2;for(let j=0;j<48;j++){let z=m.b1[j];for(let i=0;i<20;i++)z+=f[i]*m.w1[i][j];score+=Math.tanh(z)*m.w2[j];}return score;});
}
export function selectRegion(features,model){const scores=managerScores(features,model);return scores.reduce((best,v,i)=>v>scores[best]?i:best,0);}
