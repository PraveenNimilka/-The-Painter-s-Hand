import {pathLength} from '../strokes/geometry.js';
/** Digital deposition controls, not a spectral pigment or wet-fluid solver. */
export function visualPrimitives(s){
 const points=s.p,contact=s.contact??{},load=Math.max(0,Math.min(1,contact.loading??1)),depletion=Math.max(0,contact.depletion??.12),speed=Math.max(0,contact.speed??.2),tilt=Math.max(0,Math.min(1,contact.tilt??.15));
 const length=pathLength(points),widths=[],travel=[0];for(let i=1;i<points.length;i++)travel[i]=travel[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);
 for(let i=0;i<points.length;i++)widths.push(Math.max(.02,s.width*s.pressure[i]*(1+tilt*.3)*(.75+.25*Math.exp(-depletion*travel[i]/Math.max(s.width,1)))));
 const base={p:points,reference:points,color:s.color,length,offset:0},alpha=Math.max(0,Math.min(1,s.alpha*load/(1+speed*.25))),result=[];
 const add=(ratio,opacity,shift=0,color=s.color)=>{const p=points.map((v,k)=>{const a=points[Math.max(0,k-1)],b=points[Math.min(points.length-1,k+1)],d=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [v[0]-(b[1]-a[1])/d*shift*widths[k],v[1]+(b[0]-a[0])/d*shift*widths[k]];});result.push({...base,p,color,width:s.width*ratio,widths:widths.map(v=>v*ratio),alpha:opacity});};
 if(s.material==='glaze'||s.material==='sidelead'){add(1,alpha*.18);add(.72,alpha*.32);add(.4,alpha*.35);add(.16,alpha*.18);}
 else if(s.material==='wash'){add(1,alpha*.25);add(.87,alpha*.24);add(.66,alpha*.12);}
 else if(s.material==='drybrush'){const n=Math.round(4+tilt*5);for(let i=0;i<n;i++)add(.48/n,alpha*(.7-.25*i/n),(i-(n-1)/2)/n*.82);}
 else if(s.material==='graphite'||s.material==='chalk'){add(1,alpha*(s.material==='chalk'?.46:.58));const n=3+Math.round(tilt*3);for(let i=0;i<n;i++)add(.15,alpha*.24,(i-(n-1)/2)/n*.7);}
 else if(s.material==='metalpoint')add(.75,alpha*.50);
 else if(s.material==='ink'){add(.72,alpha);add(.20,alpha*.18,.16);}
 else if(s.material==='reed'){add(1,alpha);add(.28,alpha*.18,.25);}
 else {add(1,alpha);if(s.material==='impasto')add(.16,alpha*.16,-.18,'#f2e3c4');}
 return result;
}
