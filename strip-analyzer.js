const PoolStripAnalyzer=(()=>{
  const palettes={
    freeChlorine:[
      {value:0,rgb:[244,241,213]},{value:0.5,rgb:[238,214,190]},{value:1,rgb:[221,184,191]},
      {value:2,rgb:[199,145,184]},{value:3,rgb:[169,111,169]},{value:5,rgb:[126,76,145]},{value:10,rgb:[83,55,111]}
    ],
    ph:[
      {value:6.2,rgb:[238,190,86]},{value:6.8,rgb:[232,143,68]},{value:7.2,rgb:[224,103,69]},
      {value:7.6,rgb:[205,73,83]},{value:7.8,rgb:[174,61,96]},{value:8.4,rgb:[126,57,103]}
    ],
    alkalinity:[
      {value:0,rgb:[219,196,87]},{value:40,rgb:[175,184,81]},{value:80,rgb:[111,169,91]},
      {value:120,rgb:[65,151,108]},{value:180,rgb:[45,126,120]},{value:240,rgb:[37,104,119]}
    ]
  };
  const orders={
    'chlorine-ph-alk':['freeChlorine','ph','alkalinity'],
    'alk-ph-chlorine':['alkalinity','ph','freeChlorine'],
    'ph-chlorine-alk':['ph','freeChlorine','alkalinity']
  };
  function srgbToLinear(v){v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}
  function rgbToLab(rgb){const r=srgbToLinear(rgb[0]),g=srgbToLinear(rgb[1]),b=srgbToLinear(rgb[2]);let x=(r*.4124+g*.3576+b*.1805)/.95047,y=(r*.2126+g*.7152+b*.0722),z=(r*.0193+g*.1192+b*.9505)/1.08883;const f=t=>t>.008856?Math.cbrt(t):(7.787*t)+(16/116);x=f(x);y=f(y);z=f(z);return[(116*y)-16,500*(x-y),200*(y-z)]}
  function distance(a,b){const la=rgbToLab(a),lb=rgbToLab(b);return Math.sqrt(la.reduce((s,v,i)=>s+Math.pow(v-lb[i],2),0))}
  function match(rgb,palette){let best=null;for(const item of palette){const d=distance(rgb,item.rgb);if(!best||d<best.distance)best={...item,distance:d}}return best}
  function averagePatch(ctx,x,y,radius){const data=ctx.getImageData(Math.max(0,x-radius),Math.max(0,y-radius),radius*2,radius*2).data;const vals=[];for(let i=0;i<data.length;i+=4){const max=Math.max(data[i],data[i+1],data[i+2]),min=Math.min(data[i],data[i+1],data[i+2]);if(max-min>8&&max<250&&min>15)vals.push([data[i],data[i+1],data[i+2]])}const src=vals.length?vals:Array.from({length:data.length/4},(_,j)=>[data[j*4],data[j*4+1],data[j*4+2]]);return[0,1,2].map(c=>Math.round(src.reduce((s,v)=>s+v[c],0)/Math.max(1,src.length)))}
  function analyseCanvas(canvas,orderKey='chlorine-ph-alk'){
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),w=canvas.width,h=canvas.height;
    const horizontal=w>=h,positions=horizontal?[.25,.5,.75]:[.25,.5,.75];
    const samples=positions.map(p=>horizontal?averagePatch(ctx,Math.round(w*p),Math.round(h*.5),Math.max(6,Math.round(Math.min(w,h)*.08))):averagePatch(ctx,Math.round(w*.5),Math.round(h*p),Math.max(6,Math.round(Math.min(w,h)*.08))));
    const order=orders[orderKey]||orders['chlorine-ph-alk'];const values={},matches=[];
    order.forEach((key,i)=>{const m=match(samples[i],palettes[key]);values[key]=m.value;matches.push({key,rgb:samples[i],distance:m.distance,value:m.value,confidence:Math.max(0,Math.min(100,Math.round(100-m.distance*1.6)))})});
    return{values,matches,orientation:horizontal?'horizontal':'vertical',confidence:Math.round(matches.reduce((s,m)=>s+m.confidence,0)/matches.length)}
  }
  function drawImageToCanvas(img,canvas,rotation=0){const max=1000,scale=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight));let w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);if(rotation%180!==0)[w,h]=[h,w];canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rotation*Math.PI/180);const dw=rotation%180===0?w:h,dh=rotation%180===0?h:w;ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();drawGuides(canvas)}
  function drawGuides(canvas){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,horizontal=w>=h;ctx.save();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=Math.max(2,Math.min(w,h)*.008);ctx.setLineDash([12,8]);const radius=Math.max(10,Math.min(w,h)*.09);[.25,.5,.75].forEach(p=>{ctx.beginPath();ctx.arc(horizontal?w*p:w*.5,horizontal?h*.5:h*p,radius,0,Math.PI*2);ctx.stroke()});ctx.restore()}
  return{analyseCanvas,drawImageToCanvas};
})();
