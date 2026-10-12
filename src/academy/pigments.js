import {spec} from '../learning/policy.js';
const linear=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const srgb=v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
export function paletteFor(artist,colors){return (colors??spec.artists[artist].palette).map(s=>[1,3,5].map(k=>parseInt(s.slice(k,k+2),16)/255));}
/** A documented digital colour blend, not measured spectral paint optics. */
export function paletteBlend(mean,palette,amount){
 const target=mean.map(linear),colors=[...palette,[.9607843137,.9450980392,.9098039216]].map(c=>c.map(linear)),nearest=colors.map((c,i)=>({i,d:c.reduce((s,v,k)=>s+(v-target[k])**2,0)})).sort((a,b)=>a.d-b.d),i=nearest[0].i,j=nearest[1].i,a=colors[i],b=colors[j],delta=b.map((v,k)=>v-a[k]),den=delta.reduce((s,v)=>s+v*v,0),t=Math.max(0,Math.min(1,delta.reduce((s,v,k)=>s+v*(target[k]-a[k]),0)/(den||1)));
 return {color:target.map((v,k)=>srgb(Math.max(0,Math.min(1,v*(1-amount)+(a[k]+delta[k]*t)*amount)))),mix:{pigments:[i,j],secondWeight:t,blend:amount,space:'linear-srgb',paperIndex:palette.length}};
}
