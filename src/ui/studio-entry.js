const status=document.getElementById('busy'),file=document.getElementById('file'),drop=document.getElementById('drop');
let sampleRequested=false,loading;
drop.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();file.click();}};
drop.addEventListener('dragover',event=>event.preventDefault());
drop.addEventListener('drop',event=>{if(window.atelier)return;event.preventDefault();if(event.dataTransfer.files.length){file.files=event.dataTransfer.files;file.dispatchEvent(new Event('change'));}});
file.addEventListener('change',()=>{if(!window.atelier&&file.files.length)status.textContent='Photo selected. Opening the painting tools…';});
document.getElementById('sample').addEventListener('click',()=>{if(!window.atelier){sampleRequested=true;status.textContent='Opening the painting tools for the studio portrait…';}});
document.getElementById('create').addEventListener('click',()=>{if(!window.atelier)file.click();});
async function openStudio(){
 status.textContent=file.files.length?'Photo selected. Opening the painting tools…':'Opening the painting tools… You can choose a photograph now.';
 try{loading??=import('./app.js');(await loading).mountStudio();if(sampleRequested&&!file.files.length){sampleRequested=false;document.getElementById('sample').click();}}
 catch(error){loading=null;status.replaceChildren(document.createTextNode('The painting tools could not load. Check your connection and '));const retry=document.createElement('button');retry.type='button';retry.className='text-button';retry.textContent='Reload studio';retry.onclick=()=>location.reload();status.append(retry);console.error('Studio startup failed:',error);}
}
openStudio();
