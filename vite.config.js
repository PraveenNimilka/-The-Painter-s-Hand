import {defineConfig} from 'vite';

// Normal hosting keeps the studio and its weights outside the landing entry.
// The offline build has one entry so its lazy studio can be embedded in one file.
export default defineConfig(({mode})=>({
  base:'./',
  build:{
    outDir:mode==='standalone'?'dist-offline':'dist',
    assetsInlineLimit:mode==='standalone'?100_000_000:4096,
    rollupOptions:{
      input:mode==='standalone'?'index.html':{index:'index.html',studio:'studio.html',research:'research.html'},
      output:mode==='standalone'?{inlineDynamicImports:true}:undefined,
    },
  },
}));
