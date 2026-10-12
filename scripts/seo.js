import {readFileSync,writeFileSync} from 'node:fs';

// A real origin must be supplied deliberately. Preview deployments stay private.
const origin=process.env.SITE_URL;
if(!origin){writeFileSync('dist/robots.txt','User-agent: *\nDisallow: /\n');console.log('Preview SEO: noindex; no canonical or sitemap until SITE_URL is configured.');}
else{
  const url=new URL(origin);
  if(url.protocol!=='https:'||url.hostname==='localhost'||url.hostname==='127.0.0.1')throw new Error('SITE_URL must be the real HTTPS deployment URL');
  const base=url.href.replace(/\/$/,'');
  const pages=['index.html','studio.html','research.html'];
  for(const page of pages){
    const canonical=base+(page==='index.html'?'/':'/'+page);
    let html=readFileSync('dist/'+page,'utf8').replace('<meta name="robots" content="noindex,nofollow">','<meta name="robots" content="index,follow">');
    html=html.replace('</head>',`<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head>`);
    html=html.replace(/(<meta property="og:image" content=")[^"]+"/,`$1${base}/artwork/evening-light.png"`);
    writeFileSync('dist/'+page,html);
  }
  writeFileSync('dist/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
  writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+pages.map(page=>`<url><loc>${base}${page==='index.html'?'/':'/'+page}</loc></url>`).join('')+'</urlset>');
}
