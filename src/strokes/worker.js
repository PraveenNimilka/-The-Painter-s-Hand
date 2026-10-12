import {analyze,compileStrokes} from './compiler.js';
import {compileVisual} from '../visual/painter.js';
self.onmessage=async({data:{id,input,options,visualModel}})=>{
 if(options.engine==='visual'){try{const start=performance.now();self.postMessage({id,type:'analysis',face:null});const result=await compileVisual(input.native,options,batch=>self.postMessage({id,type:'batch',strokes:batch}),visualModel);self.postMessage({id,type:'done',face:result.face,stats:result.stats,options:result.options,compileMs:performance.now()-start});}catch(error){self.postMessage({id,type:'error',message:error.message});}return;}
 try{const start=performance.now(),analysis=analyze(input,options);self.postMessage({id,type:'analysis',face:analysis.face});const result=compileStrokes(input,options,batch=>self.postMessage({id,type:'batch',strokes:batch}),analysis);
 self.postMessage({id,type:'done',face:result.face,stats:result.stats,options:result.options,compileMs:performance.now()-start});
 }catch(error){self.postMessage({id,type:'error',message:error.message});}
};
