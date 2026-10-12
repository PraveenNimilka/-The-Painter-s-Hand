import deployment from './deployment.json' with {type:'json'};
export {deployment};
export function recommendedEngine(artist,medium){return deployment.routes[artist+'-'+medium]??'studio';}
