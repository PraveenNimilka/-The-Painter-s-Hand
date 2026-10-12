import {readFileSync,writeFileSync,readdirSync,mkdirSync} from 'node:fs';
import {join,basename} from 'node:path';

const folder='dist-offline',assets=join(folder,'assets');
let html=readFileSync(join(folder,'index.html'),'utf8');
const main=html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)?.[1];
if(!main)throw new Error('Offline build has no module entry');
let script=readFileSync(join(assets,basename(main)),'utf8');
const worker=readdirSync(assets).find(name=>/^worker-.*\.js$/.test(name));
if(!worker)throw new Error('Offline worker bundle missing');
const workerCode=readFileSync(join(assets,worker),'utf8');
script=script.replace(/new URL\("[^\"]*worker-[^\"]+\.js",import\.meta\.url\)/g,'ATELIER_WORKER_URL');
if(!script.includes('ATELIER_WORKER_URL'))throw new Error('Could not locate bundled worker URL');
script=script.replace(/new Worker\(ATELIER_WORKER_URL,\{type:"module"\}\)/g,'new Worker(ATELIER_WORKER_URL)');
// With inlined dynamic imports Vite wraps the worker URL in a second URL.
script=script.replace(/new Worker\(new URL\(""\+ATELIER_WORKER_URL\.href,import\.meta\.url\),\{type:"module"\}\)/g,'new Worker(ATELIER_WORKER_URL)');
if(!script.includes('new Worker(ATELIER_WORKER_URL)')||/new Worker\([^;]{0,200}ATELIER_WORKER_URL[^;]{0,200}type:"module"/.test(script))throw new Error('Offline worker constructor was not converted to a classic Blob worker');
script='const ATELIER_WORKER_URL=URL.createObjectURL(new Blob(['+JSON.stringify(workerCode)+'],{type:"text/javascript"}));\n'+script;
html=html.replace(/<script type="module" crossorigin src="[^"]+"><\/script>/,'');
html=html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g,(_,file)=>'<style>'+readFileSync(join(assets,basename(file)),'utf8')+'</style>');
html=html.replace(/<link rel="modulepreload"[^>]*>/g,'');
// The canonical studio document has its own presentation. Its source styles
// contain no network assets; include them with the embedded offline view.
html=html.replace(/<link rel="stylesheet" href="\.\/src\/ui\/studio(?:-release)?\.css">/g,'');
const studioStyles=['studio.css','studio-release.css'].map(name=>readFileSync('src/ui/'+name,'utf8')).join('\n');
html=html.replace('</head>',()=>'<style>'+studioStyles+'</style></head>');
const body=file=>readFileSync(file,'utf8').match(/<body[^>]*>([\s\S]*)<\/body>/)[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
const studio='<div id="offline-studio" data-offline-view="studio" hidden><div id="studio-loading" class="loading-studio" role="status">Opening your atelier…</div>'+body('studio.html')+'</div>';
const research='<div id="offline-research" data-offline-view="research" hidden>'+body('research.html')+'</div>';
html=html.replace('</body>',()=>studio+research+'<script type="module">'+script.replace(/<\/script/gi,'<\\/script')+'</script></body>');
html=html.replaceAll('./index.html#paintings','#paintings').replaceAll('./studio.html','#studio').replaceAll('./research.html','#research').replaceAll('./index.html','#landing');
// Custom data-full attributes are not Vite HTML asset attributes. Embed their
// source PNG exactly once per gallery entry, with no external file dependency.
html=html.replace(/data-full="\.\/artwork\/((?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.png)"/gi,(_,file)=>'data-full="data:image/png;base64,'+readFileSync('public/artwork/'+file).toString('base64')+'"');
mkdirSync('release',{recursive:true});
writeFileSync('release/The-Painters-Hand.html',html);
console.log('Created release/The-Painters-Hand.html: landing, research, studio, policies and classic Blob worker in one offline file.');
