/** Strategies vary tone response, mark geometry, density and pass order. */
export const ARTISTS={
 leonardo:{name:'Leonardo · tonal construction',color:'#53504a',spacing:2.9,shadeWidth:2.0,shadeAlpha:.15,curve:1.12,layers:2,angles:[0,.40],length:14,tooth:.16,contourWidth:.78,contourAlpha:.50,passes:['construction','contours','form','accents']},
 durer:{name:'Dürer · engraved structure',color:'#353631',spacing:3.0,shadeWidth:.85,shadeAlpha:.48,curve:1.35,layers:3,angles:[.18,1.05,-.65],length:21,tooth:.04,contourWidth:1.0,contourAlpha:.70,passes:['construction','contours','form','accents']},
 rembrandt:{name:'Rembrandt · coherent shadows',color:'#38332d',spacing:2.5,shadeWidth:2.7,shadeAlpha:.25,curve:.8,layers:2,angles:[0,.8],length:23,tooth:.20,contourWidth:1.22,contourAlpha:.64,passes:['form','contours','accents']}
};
