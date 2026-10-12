import {at,clamp} from './fields.js';
/** Joint colour filtering retains boundaries that a luminance-only blur misses.
 * Clearance limits the physical footprint of a brush, not just its centreline. */
export function analyzeColour({rgba,w,h},subject){
 const channels=[0,1,2].map(c=>Float32Array.from({length:w*h},(_,i)=>rgba[i*4+c]/255));
 const smooth=channels.map(()=>new Float32Array(w*h)),clearance=new Float32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;let weights=0,sums=[0,0,0];
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
   const j=clamp(y+dy,0,h-1)*w+clamp(x+dx,0,w-1);
   const d=channels.reduce((s,c)=>s+(c[i]-c[j])**2,0),weight=Math.exp(-(dx*dx+dy*dy)/5-d/.018);
   weights+=weight;for(let c=0;c<3;c++)sums[c]+=channels[c][j]*weight;
  }
  for(let c=0;c<3;c++)smooth[c][i]=sums[c]/weights;
  const edge=x===0||y===0||x===w-1||y===h-1||subject[i]<.55||[i-1,i+1,i-w,i+w].some(j=>j>=0&&j<w*h&&channels.reduce((s,c)=>s+(c[i]-c[j])**2,0)>.018);
  clearance[i]=edge?0:1000;
 }
 // Conservative four-connected distance to mask and chromatic boundaries.
 for(let y=1;y<h;y++)for(let x=1;x<w;x++){const i=y*w+x;clearance[i]=Math.min(clearance[i],clearance[i-1]+1,clearance[i-w]+1);}
 for(let y=h-2;y>=0;y--)for(let x=w-2;x>=0;x--){const i=y*w+x;clearance[i]=Math.min(clearance[i],clearance[i+1]+1,clearance[i+w]+1);}
 return {channels:smooth,clearance,w,h};
}
export function sampleColour(colour,x,y){return colour.channels.map(c=>at(c,colour.w,colour.h,x,y));}
export function hex(rgb){return '#'+rgb.map(v=>Math.round(clamp(v)*255).toString(16).padStart(2,'0')).join('');}
/** Modest palette interpretation, never a single sepia tint. Fidelity=1 keeps
 * source RGB; zero uses our documented, deliberately limited style rules. */
export function artistColour(rgb,artist,fidelity=.65){
 const l=rgb[0]*.299+rgb[1]*.587+rgb[2]*.114;let mapped;
 if(artist==='leonardo')mapped=rgb.map((v,c)=>l*.30+v*.65+[.065,.040,-.015][c]);
 else if(artist==='durer')mapped=rgb.map(v=>l+(v-l)*1.20);
 else {const shadow=clamp((.55-l)/.55),light=clamp((l-.45)/.55);mapped=rgb.map((v,c)=>v*(.90-.18*shadow)+[.10,.035,-.03][c]*light+[.013,.008,.015][c]*shadow);}
 return hex(rgb.map((v,c)=>v*fidelity+mapped[c]*(1-fidelity)));
}
