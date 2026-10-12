import {fitImage} from '../vision/preprocess.js';
import {detectLocalFace} from '../vision/face.js';
import {compileStrokes} from '../strokes/compiler.js';
import {compileStrokes as compileLegacy} from '../strokes/legacy.js';
import {StrokePlayer} from '../render/player.js';
import {paintStroke,PAPER,primitives} from '../render/pencil.js';
import {download,exportJSON,exportSVG,exportPNG} from '../render/export.js';
import {PAINT} from '../strokes/painting.js';
import {sampleImage} from './sample.js';
import {spec,checkpointFor} from '../learning/policy.js';
import {checkpointForStudio} from '../studio/policy.js';
import {checkpoint as academyCheckpoint} from '../academy/policy.js';
import detailCheckpoint from '../academy/detail-checkpoint.json' with {type:'json'};
import hierarchicalCheckpoint from '../hierarchy/checkpoint.json' with {type:'json'};
import {recommendedEngine} from '../academy/recommendation.js';
import {profiles} from '../studio/plan.js';
import {tools as studioTools} from '../studio/tools.js';
import visualModelInfo from '../visual/model-info.json' with {type:'json'};
import {highResolutionInput} from '../visual/source.js';
import {compileVisual} from '../visual/painter.js';
import {mountStudioPresence} from './studio-presence.js';
let studioMounted=false;
let visualCheckpoint=visualModelInfo,visualModelLoading;
async function loadVisualModel(){
 if(visualCheckpoint.layers)return visualCheckpoint;
 visualModelLoading??=import('../visual/model.js').then(module=>visualCheckpoint=module.default).catch(error=>{visualModelLoading=null;throw error;});
 return visualModelLoading;
}
export function mountStudio(){
if(studioMounted)return window.atelier;
studioMounted=true;
const $=id=>document.getElementById(id),player=new StrokePlayer($('art'),$('live'),$('pointer'),update);
let photo=null,photoURL='',artist='leonardo',medium='colour',generation=0,loadVersion=0,worker=null,compiling=false,metadata={},input=null,focus=null,editing=false,comparisonReady=false,firstStroke=0,started=0;
const setMsg=msg=>{$('busy').textContent=msg;};
const studioPalettes=Object.fromEntries(Object.entries(spec.artists).map(([name,study])=>[name,[...study.palette]]));
const isStudio=()=>['studio','studio-previous','studio-extended','academy','academy-detail','hierarchy','visual','recommended'].includes($('engine').value);
const effectiveEngine=()=>$('engine').value==='recommended'?recommendedEngine(artist,medium):$('engine').value;
const activeTools=()=>isStudio()?studioTools:spec.tools;
function selectedPolicy(){
 const engine=effectiveEngine();
 switch(engine){
  case 'visual':return visualCheckpoint;
  case 'hierarchy':return hierarchicalCheckpoint;
  case 'academy-detail':return detailCheckpoint;
  case 'academy':return academyCheckpoint;
  default:return isStudio()?checkpointForStudio(engine,artist,medium):checkpointFor($('finish').value);
 }
}
for(const [index,label,value,model] of [
 [1,'Expressive study · learned geometry','academy',academyCheckpoint],
 [2,'Detail study · experimental','academy-detail',detailCheckpoint],
 [3,'Hierarchical study · experimental','hierarchy',hierarchicalCheckpoint],
 [4,'Visual hand · experimental','visual',visualCheckpoint],
]){
 const option=new Option(label,value);option.disabled=!model.trained;$('engine').add(option,index);
}
function addStudioSelect(id,title,choices,anchor){
 const label=document.createElement('label');label.className='section-title';label.htmlFor=id;label.textContent=title;
 const select=document.createElement('select');select.id=id;select.className='studio-select';
 for(const [value,text] of choices)select.add(new Option(text,String(value)));
 anchor.after(label,select);return [label,select];
}
const [resolutionLabel,resolutionSelect]=addStudioSelect('resolution','Artwork resolution',[
 [960,'960 · quick study'],[1920,'1920 · detailed study'],[3840,'3840 · full resolution'],
],$('engineNote'));
const [taskLabel,taskSelect]=addStudioSelect('task','Study task',[
 ['reconstruction','Faithful reconstruction'],['interpretation','Artist interpretation · authored plan'],
],$('engineNote'));
const [strategyLabel,strategySelect]=addStudioSelect('visualStrategy','Mark selection',[
 ['visual','Trained policy'],['assisted','Policy + four material trials'],
 ['greedy','Best of sixteen material trials'],['optimize','Stroke optimizer · additional width trials'],
],taskSelect);
$('optionsToggle').onclick=()=>{const expanded=$('refinements').hidden;$('refinements').hidden=!expanded;$('optionsToggle').setAttribute('aria-expanded',String(expanded));$('optionsToggle').lastElementChild.textContent=expanded?'−':'+';};
const options=()=>({artist,medium,finish:$('finish').value,palette:[...studioPalettes[artist]],engine:$('engine').value,...(['hierarchy','visual'].includes($('engine').value)?{task:taskSelect.value,longEdge:Number(resolutionSelect.value)}:{}),...($('engine').value==='visual'?{method:strategySelect.value==='assisted'?'visual':strategySelect.value,lookahead:strategySelect.value==='assisted'?4:1}:{}),selectedTool:$('selectedTool').value,interpretation:Number($('interpretation').value),backdrop:$('backdrop').value,fidelity:Number($('fidelity').value),detail:Number($('detail').value),shading:Number($('shading').value),background:$('background').checked,focus,detected:null});
function update(){if(!document.querySelector('#progress'))return;const pct=Math.round(player.progress*100);
 $('progress').style.width=player.progress*100+'%';$('progressLabel').textContent=String(pct).padStart(2,'0')+'%';$('seekbar').setAttribute('aria-valuenow',pct);$('drawn').textContent=player.cursor.toLocaleString();$('counter').textContent=player.cursor.toLocaleString()+' / '+player.strokes.length.toLocaleString();
 const pass=player.strokes[player.cursor]?.pass??(compiling?2:4),names=medium==='colour'?['01 · Colour foundation','02 · Selective edges','03 · Colour modelling','04 · Brush details and lights','Drawing complete']:['01 · Observed construction','02 · Connected contours','03 · Form and shadow','04 · Focal accents','Drawing complete'];
 $('phase').textContent=player.strokes.length?names[pass]:'Awaiting reference';document.querySelectorAll('.leg').forEach(el=>el.classList.toggle('current',Number(el.dataset.pass)===pass));
 const active=player.strokes[Math.min(player.cursor,player.strokes.length-1)];$('toolReadout').textContent=active?.toolId?(activeTools().find(t=>t.id===active.toolId)?.name||active.toolId):active?active.material+' · '+active.tool:'The active tool will appear here.';
 if($('engine').value==='learned'&&player.strokes.length)$('phase').textContent=pass===0?'01 · Broad painting decisions':pass===2?'02 · Form, pigment and shadow':pass===3?'03 · Selected details and lights':'Painting complete';
 if(isStudio()&&player.strokes.length)$('phase').textContent=pass<4?String(pass+1).padStart(2,'0')+' · '+profiles.artists[artist].stages[pass]:'Study complete';
 $('state').textContent=!photo?'AWAITING A REFERENCE':compiling?'COMPILING · LOCAL WORKER':player.running?'DRAWING IN PROGRESS':player.strokes.length&&player.cursor>=player.strokes.length?'FINISHED DRAWING':'DRAWING PAUSED';$('play').textContent=player.running?'Ⅱ':'▶';
}
async function fileImage(file){if(!file||!file.type.startsWith('image/')){setMsg('Please choose an image file.');return;}const token=++loadVersion,url=URL.createObjectURL(file),image=new Image();
 try{image.src=url;await image.decode();if(token!==loadVersion){URL.revokeObjectURL(url);return;}if(photoURL)URL.revokeObjectURL(photoURL);photo=image;photoURL=url;focus=null;$('thumb').src=url;$('thumb').hidden=false;setMsg('Photo loaded · ready to draw');await compile();}catch{URL.revokeObjectURL(url);setMsg('Could not read this image. Try JPEG or PNG.');}
}
$('drop').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click();}};$('file').onchange=e=>fileImage(e.target.files[0]);
$('drop').ondragover=e=>{e.preventDefault();$('drop').classList.add('dragging');};$('drop').ondragleave=()=>$('drop').classList.remove('dragging');$('drop').ondrop=e=>{e.preventDefault();$('drop').classList.remove('dragging');fileImage(e.dataTransfer.files[0]);};
$('sample').onclick=async()=>{try{await fileImage(await sampleImage());}catch{setMsg('Sample could not be loaded.');}};
for(const id of ['detail','shading','fidelity','interpretation']){$(id).oninput=()=>{$(id+'Out').textContent=$(id).value+'%';};$(id).onchange=()=>photo&&compile();}
for(const id of ['engine','finish','selectedTool','backdrop','task','resolution','visualStrategy'])$(id).onchange=()=>{syncMedium();if(photo)compile();};
for(const id of ['background','localFace'])$(id).onchange=()=>photo&&compile();
document.querySelectorAll('.style').forEach(btn=>{btn.onclick=()=>{artist=btn.dataset.style;document.querySelectorAll('.style').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});syncMedium();if(photo)compile();};});
function syncMedium(){
 const studio=isStudio(),learned=$('engine').value!=='classical';for(const id of ['selectedTool','interpretation','backdrop'])$(id).disabled=!learned;$('finish').disabled=$('engine').value!=='learned';
 const checkpoint=selectedPolicy(),reduction=checkpoint.training.relative_loss_reduction??checkpoint.training.relative_error_reduction;
 const training=checkpoint.training;
 const selection=training.selected_episode===0?'Initialization retained after validation.':'Selected at refinement episode '+(training.selected_episode??0).toLocaleString()+'.';
 $('trainingSummary').textContent=training.base_training_episodes?training.episodes.toLocaleString()+' refinement episodes · '+training.steps_per_episode+' actions per exercise. '+selection+' Initialization selected from a '+training.base_training_episodes.toLocaleString()+'-episode experiment. '+(training.total_experiment_actions?training.total_experiment_actions.toLocaleString()+' total experimental decisions. ':'')+'Three artist heads; different people and artworks held out. CPU training.':training.episodes+' training episodes · '+training.steps_per_episode+' actions per exercise · '+Math.round(reduction*100)+'% locked synthetic '+(studio?'intent-loss':'pixel-error')+' reduction against initial weights. '+(studio?'Three artist heads; whole artworks held out. CPU training.':training.hardware+'.');
 $('modelScope').textContent=studio?'The hand learns mark selection within an authored four-stage plan. Structure, value masses and mark cost guide training. The small corpus includes Rembrandt works. This is an experimental interpretation, not verified historical technique.':'The original policy selects procedural candidates against a photo-derived plan. Fine details and Soft study retain their original weights and observation rules.';
 const chosen=$('selectedTool').value;$('selectedTool').replaceChildren(new Option(studio?'Artist’s sequence':'Let the hand choose · artist kit','auto'));for(const tool of activeTools().filter(t=>t.media.includes(medium)))$('selectedTool').add(new Option(tool.name,tool.id));if([...$('selectedTool').options].some(o=>o.value===chosen))$('selectedTool').value=chosen;
 if(effectiveEngine()==='academy'){$('trainingSummary').textContent=training.episodes.toLocaleString()+' GPU training episodes · '+training.training_actions.toLocaleString()+' training decisions · '+training.unique_train_images.toLocaleString()+' distinct training sources. Selected at episode '+training.selected_episode.toLocaleString()+'.';$('modelScope').textContent='The policy learns mark selection and bounded changes to geometry, pressure and opacity. Observed contours finish the study. Artist planning remains authored; historical authenticity is unverified.';}
 $('engineNote').textContent=studio?'Values, edge hierarchy and a staged material sequence shape the study.':$('engine').value==='learned'?'The preserved MVP policy chooses proposed strokes.':'The preserved photo-guided procedural engine.';
 if(effectiveEngine()==='academy')$('engineNote').textContent='Learned gestures, continuous pencil form and palette blends. Research edition.';
 if(effectiveEngine()==='academy-detail'){
  $('trainingSummary').textContent=training.episodes.toLocaleString()+' episodes in the model lineage · '+training.training_actions.toLocaleString()+' decisions. '+training.refinement_episodes.toLocaleString()+' new detail episodes on '+training.unique_train_images+' refinement sources; RTX 4060 training.';
  $('modelScope').textContent='Mark selection and bounded geometry are learned. Planning, detail accents and error safeguards are authored. Colour detail proxies improved; pencil and overall-accuracy tradeoffs kept this study experimental. Materials remain digital approximations.';
  $('engineNote').textContent='A detail-focused trained hand with guarded marks. Experimental; the recommended hand retains its verified defaults.';
 }
 taskLabel.hidden=taskSelect.hidden=!['hierarchy','visual'].includes(effectiveEngine());resolutionLabel.hidden=resolutionSelect.hidden=effectiveEngine()!=='visual';
 strategyLabel.hidden=strategySelect.hidden=effectiveEngine()!=='visual';
 if(effectiveEngine()==='visual'){const selection=training.selection_phase==='actual-canvas-supervised-calibration'?'Canvas calibration epoch '+training.calibration.selected_epoch+'; main RL warm start retained':training.selected_episode===0?'supervised warm start':'RL episode '+training.selected_episode;$('trainingSummary').textContent=(training.episodes??0).toLocaleString()+' experiment RL episodes · selected '+selection+' · '+visualCheckpoint.parameters.inference.toLocaleString()+' inference parameters.';$('modelScope').textContent='A custom visual encoder and recurrent memory guide region and mark selection. The worker is calibrated with measured Canvas gains. Tools and artist interpretation plans remain authored; learned creativity and physical materials are unverified.';}
 if(effectiveEngine()==='visual'&&['greedy','optimize'].includes(strategySelect.value))$('modelScope').textContent='Actual material trials choose marks by measured reconstruction gain. This strategy does not use the neural policy; tools and artist plans remain authored.';
 if(effectiveEngine()==='visual'&&strategySelect.value==='assisted')$('modelScope').textContent='The neural policy ranks marks; four actual material trials choose among its proposals. Measured lookahead contributes separately from learning. Tools and artist plans remain authored.';
 if(effectiveEngine()==='hierarchy'){
  $('trainingSummary').textContent=(training.episodes??0).toLocaleString()+' new hierarchical GPU episodes · '+(training.training_decisions??0).toLocaleString()+' mark decisions · '+(training.unique_train_images??0).toLocaleString()+' distinct training images. Two learned policy levels; validation-selected checkpoint.';
  $('modelScope').textContent='A trained manager chooses region and scale; a trained worker selects and adjusts marks. Reconstruction preserves source colours; pencil targets source tones. Interpretation uses an authored artist plan. Exact pixel matching, identity and historical creativity are unverified.';
  $('engineNote').textContent=taskSelect.value==='reconstruction'?'Match observed colours and tones with actual marks. Creativity controls are available in the interpretation task.':'The learned hierarchy executes an authored artist interpretation; creative composition is not learned.';
 }
 const fixedReconstruction=['hierarchy','visual'].includes(effectiveEngine())&&taskSelect.value==='reconstruction';
 for(const [id,value]of [['interpretation','0'],['fidelity','100'],['shading','100']]){
  const slider=$(id);if(fixedReconstruction){slider.dataset.reconstructionValue??=slider.value;slider.value=value;}else if(slider.dataset.reconstructionValue!==undefined){slider.value=slider.dataset.reconstructionValue;delete slider.dataset.reconstructionValue;}
  slider.disabled=fixedReconstruction;$(id+'Out').textContent=slider.value+'%';
 }
 $('toolDescription').textContent=$('selectedTool').value==='auto'?(studio?'Tools change with the artist’s painting stages.':'The hand chooses tools available for this medium.'):activeTools().find(t=>t.id===$('selectedTool').value)?.name+' · fixed tool';
 $('studyTitle').textContent='A '+profiles.artists[artist].name+' study';$('artistIntent').textContent=profiles.artists[artist].intent;
 $('pigments').replaceChildren(...studioPalettes[artist].map((colour,i)=>{const swatch=document.createElement('input');swatch.type='color';swatch.value=colour;swatch.title='Edit pigment '+(i+1);swatch.disabled=!learned||medium!=='colour'||fixedReconstruction;swatch.setAttribute('aria-label','Pigment '+(i+1));swatch.onchange=()=>{studioPalettes[artist][i]=swatch.value;if(photo)compile();};return swatch;}));
 $('colourControls').hidden=medium!=='colour';
 $('technique').textContent=studio?profiles.artists[artist].stages.join(' · '):medium==='colour'?PAINT[artist].label:({leonardo:'Soft tonal masses · curved pencil shading · selective edges',durer:'Narrow engraved lines · curved hatching · precise detail',rembrandt:'Grouped dark tones · expressive lines · focal accents'}[artist]);
 const labels=studio?profiles.artists[artist].stages.map((v,i)=>String(i+1).padStart(2,'0')+' · '+v):medium==='colour'?['01 · Colour foundation','02 · Selective edges','03 · Colour modelling','04 · Brush details and lights']:['01 · Structure','02 · Contour','03 · Tonal shading','04 · Fine detail'];
 document.querySelectorAll('.leg').forEach((el,i)=>el.lastChild.textContent=labels[i]);
}
document.querySelectorAll('[data-medium]').forEach(btn=>btn.onclick=()=>{medium=btn.dataset.medium;document.querySelectorAll('[data-medium]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',b===btn?'true':'false');});syncMedium();if(photo)compile();});
$('create').onclick=()=>photo?compile():$('file').click();
$('play').onclick=async()=>{if(player.running)player.pause();else{if(player.cursor>=player.strokes.length)await player.seek(0);player.play();}};
$('restart').onclick=async()=>{await player.seek(0);player.play();};$('end').onclick=()=>player.seek(player.strokes.length);$('speed').onchange=()=>{player.speed=Number($('speed').value);};
$('seekbar').tabIndex=0;$('seekbar').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();player.seek(player.strokes.length*Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)));};
$('seekbar').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const t=e.key==='Home'?0:e.key==='End'?1:player.progress+(e.key==='ArrowRight'?.05:-.05);player.seek(player.strokes.length*t);}};
function syncOverlay(){$('paper').classList.toggle('editing',editing);const visible=$('referenceToggle').checked||editing;$('reference').hidden=!visible;$('reference').style.opacity=editing?'.9':'.35';$('guides').hidden=!$('guidesToggle').checked&&!editing;$('focus').classList.toggle('active',editing);}
$('referenceToggle').onchange=syncOverlay;$('guidesToggle').onchange=syncOverlay;
function drawGuides(box=metadata.face?.box){const ctx=$('guides').getContext('2d');ctx.clearRect(0,0,800,960);if(!box)return;ctx.strokeStyle='#977742';ctx.lineWidth=1.6;ctx.setLineDash([7,5]);ctx.strokeRect(box.x*2,box.y*2,box.width*2,box.height*2);ctx.setLineDash([]);if(!editing)for(const l of metadata.face?.landmarks||[]){ctx.beginPath();ctx.arc(l.x*2,l.y*2,5,0,Math.PI*2);ctx.stroke();}}
$('focus').onclick=()=>{if(!photo)return setMsg('Choose a photograph first.');editing=!editing;syncOverlay();if(editing)$('paper').scrollIntoView({block:'center',behavior:'instant'});setMsg(editing?'Drag a rectangle around the face on the photograph.':'Face region unchanged.');};
$('clearFocus').onclick=()=>{focus=null;editing=false;syncOverlay();if(photo)compile();};
let drag=null;const paper=$('paper'),normalized=e=>{const r=paper.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))];};
paper.onpointerdown=e=>{if(!editing)return;drag=normalized(e);paper.setPointerCapture(e.pointerId);e.preventDefault();};
paper.onpointermove=e=>{if(!drag)return;const p=normalized(e);drawGuides({x:Math.min(drag[0],p[0])*400,y:Math.min(drag[1],p[1])*480,width:Math.abs(p[0]-drag[0])*400,height:Math.abs(p[1]-drag[1])*480});};
paper.onpointerup=e=>{if(!drag)return;const p=normalized(e),box={x:Math.min(drag[0],p[0]),y:Math.min(drag[1],p[1]),width:Math.abs(p[0]-drag[0]),height:Math.abs(p[1]-drag[1])};drag=null;paper.releasePointerCapture(e.pointerId);if(box.width>.04&&box.height>.04){focus=box;editing=false;syncOverlay();compile();}else setMsg('Draw a larger face region.');};
paper.onpointercancel=()=>{drag=null;};
 $('compareToggle').onchange=async()=>{const id=generation;if($('compareToggle').checked){await player.seek(player.strokes.length);if(id!==generation)return;if(!comparisonReady){setMsg('Preparing the original engine comparison…');await buildComparison(id);}if(id!==generation)return;setMsg('Original ATELIER and the current study · drag the comparison slider');}$('before').hidden=!$('compareToggle').checked;$('compareControl').hidden=!$('compareToggle').checked;updateCompare();};
function updateCompare(){const value=Number($('compareRange').value);$('before').style.clipPath=`inset(0 ${100-value}% 0 0)`;$('divider').style.left=value+'%';$('divider').hidden=!$('compareToggle').checked;}
$('compareRange').oninput=updateCompare;
function legacyFields(data){const {w,h,rgba}=data,grid=new Float32Array(w*h),gradX=new Float32Array(w*h),gradY=new Float32Array(w*h),gradM=new Float32Array(w*h);
 for(let i=0;i<grid.length;i++)grid[i]=(rgba[i*4]*.299+rgba[i*4+1]*.587+rgba[i*4+2]*.114)/255;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let i=y*w+x;gradX[i]=(grid[i+1]-grid[i-1])*.5;gradY[i]=(grid[i+w]-grid[i-w])*.5;gradM[i]=Math.hypot(gradX[i],gradY[i]);}return {w,h,grid,gradX,gradY,gradM};
}
async function buildComparison(v){const baseline=compileLegacy(legacyFields(input),artist,Number($('detail').value)/70),ctx=$('before').getContext('2d');ctx.fillStyle='#f1e9d9';ctx.fillRect(0,0,800,960);const color=artist==='rembrandt'?'#33281f':artist==='durer'?'#383026':'#564739';let t=performance.now();
 for(const s of baseline){if(v!==generation)return;ctx.strokeStyle=color;ctx.globalAlpha=s.alpha;ctx.lineWidth=s.width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(...s.p[0]);for(let j=1;j<s.p.length;j++)ctx.lineTo(...s.p[j]);ctx.stroke();if(performance.now()-t>8){await new Promise(r=>requestAnimationFrame(r));t=performance.now();}}
 ctx.globalAlpha=1;if(v!==generation)return;comparisonReady=true;$('compareToggle').disabled=false;
}
function exportReady(){if(compiling){setMsg('Wait for compilation to finish before exporting.');return false;}if(!player.strokes.length){setMsg('Create a drawing first.');return false;}return true;}
$('json').onclick=()=>{if(exportReady())download(exportJSON(player.strokes,artist,metadata),'painters-hand-'+artist+'-'+medium+'-strokes.json','application/json');};
$('svg').onclick=()=>{if(exportReady())download(exportSVG(player.strokes,artist,metadata.canvas),'painters-hand-'+artist+'-'+medium+'.svg','image/svg+xml');};
$('png').onclick=async()=>{if(!exportReady())return;const name='painters-hand-'+artist+'-'+medium+'.png';try{download(await exportPNG(player),name,'image/png');}catch(error){setMsg('PNG could not be saved: '+error.message);}};
$('checkpoint').onclick=async()=>{try{if(effectiveEngine()==='visual'){setMsg('Loading the experimental policy for download…');await loadVisualModel();}download(JSON.stringify(selectedPolicy()),'painters-hand-'+(isStudio()?$('engine').value:$('finish').value)+'-policy.json','application/json');}catch{setMsg('The experimental policy could not load. Please try again.');}};
async function compile(){if(!photo)return;const id=++generation;worker?.terminate();worker=null;compiling=true;player.compiling=true;player.reset();metadata={};comparisonReady=false;firstStroke=0;started=performance.now();$('create').disabled=true;$('compareToggle').checked=false;$('compareToggle').disabled=true;$('before').hidden=true;$('compareControl').hidden=true;$('divider').hidden=true;$('empty').hidden=true;$('empty').style.display='none';$('total').textContent='…';setMsg('Analyzing photograph locally…');
 try{input=fitImage(photo);if(effectiveEngine()==='visual'){input.native=highResolutionInput(photo,Number(resolutionSelect.value));player.resize(input.native.w,input.native.h);$('paper').style.aspectRatio=input.native.w+'/'+input.native.h;const rc=document.createElement('canvas');rc.width=input.native.w;rc.height=input.native.h;rc.getContext('2d').putImageData(new ImageData(input.native.rgba,input.native.w,input.native.h),0,0);$('reference').src=rc.toDataURL();}else{if(player.ctx.canvas.width!==800||player.ctx.canvas.height!==960)player.resize();$('paper').style.aspectRatio='800/960';$('reference').src=input.canvas.toDataURL();}}catch(error){compiling=false;player.compiling=false;$('create').disabled=false;setMsg('Could not analyze this photograph: '+error.message);return;}const settings=options();
 if(settings.engine==='visual'&&settings.method==='visual'){
  setMsg('Loading the experimental trained hand… The stroke optimizer works without this download.');
  try{await loadVisualModel();}catch{if(id!==generation)return;compiling=false;player.compiling=false;$('create').disabled=false;setMsg('The experimental hand could not load. Try again, or choose Recommended hand or Stroke optimizer.');return;}
  if(id!==generation)return;
 }
 if($('localFace').checked){settings.detected=await Promise.race([detectLocalFace(photo,input.fit),new Promise(r=>setTimeout(()=>r(null),600))]);if(id!==generation)return;}
 const message=data=>{if(id!==generation)return;
  if(data.type==='analysis'){metadata.face=data.face;drawGuides();$('faceStatus').textContent=data.face?data.face.source+' · '+data.face.landmarks.length+' focal regions':'No face estimate · general image contours';}
  if(data.type==='batch'){const first=firstStroke===0;if(first){firstStroke=performance.now()-started;setMsg('Drawing first strokes · shading is compiling…');}player.append(data.strokes);if(first)player.play();}
  if(data.type==='done'){compiling=false;player.compiling=false;metadata={...metadata,...data.stats,options:data.options,compileMs:data.compileMs,firstStrokeMs:firstStroke,referenceVersion:loadVersion,generation};$('create').disabled=false;$('total').textContent=player.strokes.length.toLocaleString();$('length').textContent=(data.stats.distance/1000).toFixed(1)+'k';$('build').textContent=Math.round(data.compileMs)+'ms';$('firstStroke').textContent=Math.round(firstStroke)+'ms';$('artlabel').textContent='THE PAINTER’S HAND · '+artist.toUpperCase()+' · '+(['studio','studio-previous','studio-extended'].includes(data.options.engine)?'ARTIST STUDY':data.options.engine==='learned'?'LEARNED STROKE POLICY':medium==='colour'?PAINT[artist].label.toUpperCase():'GRAPHITE STUDY');const decisionLabel=data.options.engine==='visual'?(data.stats.method==='visual'?((data.options.lookahead??1)>1?'policy with material trials':'trained policy decisions'):'measured material trials'):((data.stats.learnedActions||data.stats.studioActions)?'trained policy decisions':data.face?'facial features prioritized':'general image study');setMsg(player.strokes.length.toLocaleString()+' actual paths · '+decisionLabel);worker?.terminate();worker=null;update();$('compareToggle').disabled=false;}
  if(data.type==='error'){compiling=false;player.compiling=false;player.pause();$('create').disabled=false;setMsg('Drawing could not compile: '+data.message);}
 };
 const fallback=async()=>{if(id!==generation)return;worker?.terminate();worker=null;metadata.compilerRoute='main-thread';setMsg('Using local compatibility compiler…');await new Promise(r=>setTimeout(r,0));try{const t=performance.now(),result=settings.engine==='visual'?await compileVisual(input.native,settings,batch=>message({type:'batch',strokes:batch}),visualCheckpoint,{cancelled:()=>id!==generation}):compileStrokes(input,settings,batch=>message({type:'batch',strokes:batch}));message({type:'analysis',face:result.face});message({type:'done',...result,compileMs:performance.now()-t});}catch(e){message({type:'error',message:e.message});}};
 try{worker=new Worker(new URL('../strokes/worker.js',import.meta.url),{type:'module'});metadata.compilerRoute='worker';worker.onmessage=e=>message(e.data);worker.onerror=e=>{e.preventDefault();fallback();};worker.postMessage({id,...(settings.engine==='visual'?{visualModel:visualCheckpoint}:{}),input:{w:input.w,h:input.h,fit:input.fit,rgba:input.rgba,...(input.native?{native:input.native}:{})},options:settings});}catch{fallback();}
}
syncMedium();update();
// Small deterministic integration surface used by browser regressions and benchmarks.
window.atelier={player,get strokes(){return player.strokes;},get metadata(){return metadata;},get compiling(){return compiling;},get comparisonReady(){return comparisonReady;},get artist(){return artist;},get medium(){return medium;},compile,complete:()=>player.seek(player.strokes.length),exportJSON:()=>exportJSON(player.strokes,artist,metadata),exportSVG:()=>exportSVG(player.strokes,artist,metadata.canvas),paintStroke,primitives,get paper(){return PAPER;},get referenceVersion(){return loadVersion;}};
window.paintersHand=window.atelier;
mountStudioPresence(document.querySelector('[data-studio]'));
setMsg('Choose a reference to begin.');
if($('file').files.length)fileImage($('file').files[0]);
return window.atelier;
}
// Hosted studio documents initialize immediately. The offline exhibition mounts
// its embedded studio on entry, and keeps that single instance across views.
if(!document.querySelector('#offline-studio'))mountStudio();
