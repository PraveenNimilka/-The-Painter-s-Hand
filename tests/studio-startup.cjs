const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {launch}=require('./browser-launch.cjs');
(async()=>{
 const server=process.env.FRONTEND_URL?null:await require('./server.cjs').startServer(path.join(__dirname,'../dist'));
 const base=process.env.FRONTEND_URL??server.base,output=process.env.FRONTEND_RESULTS??path.join(__dirname,'results/startup');fs.mkdirSync(output,{recursive:true});
 const browser=await launch(),page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[],modelRequests=[];
 page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 // A slow initial connection must not prevent choosing a photo. The optional
 // 52MB model is deliberately unavailable throughout the normal upload test.
 await page.route('**/assets/app-*.js',async route=>{await new Promise(resolve=>setTimeout(resolve,5000));await route.continue();});
 await page.route('**/assets/model-*.js',route=>{modelRequests.push(route.request().url());return route.abort();});
 const upload=async(file,keyboard=false)=>{const chooser=page.waitForEvent('filechooser');if(keyboard){await page.locator('#drop').focus();await page.keyboard.press('Enter');}else await page.getByRole('button',{name:'Upload photograph',exact:true}).click();await (await chooser).setFiles(path.join(__dirname,'fixtures',file));};
 try{
  await page.goto(base+'/studio.html',{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>typeof window.atelier),'undefined','This test must exercise the period before the core is ready');
  await upload('portrait.jpg');
  console.log('Photo selected before core startup');
  await page.waitForFunction(()=>window.atelier&&!atelier.compiling&&atelier.metadata.compileMs!==undefined&&atelier.strokes.length>100);
  assert.equal(await page.evaluate(()=>atelier.referenceVersion),1,'The photo selected before startup must compile automatically');
  assert(await page.locator('#thumb').isVisible());
  console.log('Queued photo compiled');
  await page.click('[data-medium="graphite"]');await page.waitForFunction(()=>!atelier.compiling&&atelier.metadata.options?.medium==='graphite'&&atelier.metadata.compileMs!==undefined);
  await upload('clutter.jpg',true);await page.waitForFunction(()=>!atelier.compiling&&atelier.metadata.referenceVersion===2&&atelier.metadata.compileMs!==undefined);
  console.log('Keyboard replacement compiled');
  await page.click('#optionsToggle');assert(await page.locator('#refinements').isVisible());await page.click('#optionsToggle');assert(!(await page.locator('#refinements').isVisible()));
  await page.selectOption('#speed','20');await page.click('#restart');await page.waitForFunction(()=>atelier.player.running);await page.click('#play');const paused=await page.evaluate(()=>atelier.player.cursor);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>atelier.player.cursor),paused);
  await page.click('#end');await page.waitForFunction(()=>!atelier.player.running&&atelier.player.cursor===atelier.strokes.length);
  console.log('Playback controls passed');
  for(const ext of ['png','svg','json']){console.log('Checking '+ext+' download');const [download]=await Promise.all([page.waitForEvent('download'),page.click('#'+ext)]);const file=path.join(output,download.suggestedFilename());await download.saveAs(file);assert(fs.statSync(file).size>100);if(ext==='svg')assert(!fs.readFileSync(file,'utf8').includes('<image'));}
  await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#paper').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'upload-fixed-mobile.png')});
  assert.deepEqual(modelRequests,[],'Normal uploads must never request the experimental weights');assert.deepEqual(errors,[]);
  const report={url:base,checks:['Native chooser before the core loads','Queued photo compiles after startup','Keyboard chooser and replacement photo','Refinements remain collapsed until opened','Pause/replay/speed/end','PNG/SVG/JSON exports','Mobile layout','Recommended modes work with optional model unavailable'],modelRequests,errors};fs.writeFileSync(path.join(output,'startup.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }catch(error){console.error(await page.evaluate(()=>({busy:document.querySelector('#busy')?.textContent,ready:Boolean(window.atelier),compiling:window.atelier?.compiling,version:window.atelier?.referenceVersion,metadata:window.atelier?.metadata})).catch(()=>null));throw error;}finally{await browser.close();server?.close();}
})().catch(error=>{console.error(error);process.exit(1)});
