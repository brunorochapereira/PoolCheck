const PoolStripReader=(()=>{
 const refs={
  ph:[{v:6.2,c:[226,182,82]},{v:6.8,c:[233,142,70]},{v:7.2,c:[220,104,83]},{v:7.6,c:[195,77,106]},{v:8.4,c:[143,65,126]}],
  freeChlorine:[{v:0,c:[244,239,219]},{v:.5,c:[230,211,220]},{v:1,c:[210,182,210]},{v:3,c:[178,128,186]},{v:5,c:[139,84,160]}],
  alkalinity:[{v:0,c:[228,206,91]},{v:40,c:[180,190,88]},{v:80,c:[115,177,111]},{v:120,c:[73,158,138]},{v:180,c:[48,128,151]}]
 };
 const dist=(a,b)=>Math.sqrt(a.reduce((s,v,i)=>s+(v-b[i])**2,0));
 const nearest=(rgb,list)=>list.map(x=>({...x,d:dist(rgb,x.c)})).sort((a,b)=>a.d-b.d)[0];
 async function read(file){const img=await createImageBitmap(file);const canvas=document.createElement('canvas');const w=360,h=Math.round(img.height*(360/img.width));canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);const ys=[.28,.5,.72];const names=['ph','freeChlorine','alkalinity'];const readings={};let totalConfidence=0;names.forEach((name,i)=>{const x=Math.round(w*.5),y=Math.round(h*ys[i]),size=Math.max(4,Math.round(Math.min(w,h)*.025));const d=ctx.getImageData(x-size,y-size,size*2,size*2).data;const rgb=[0,0,0];let n=0;for(let j=0;j<d.length;j+=4){if(d[j+3]>0){rgb[0]+=d[j];rgb[1]+=d[j+1];rgb[2]+=d[j+2];n++;}}rgb.forEach((_,k)=>rgb[k]=Math.round(rgb[k]/n));const hit=nearest(rgb,refs[name]);const confidence=Math.max(20,Math.round(100-hit.d/2.5));totalConfidence+=confidence;readings[name]={value:hit.v,confidence,rgb};});return{readings,confidence:Math.round(totalConfidence/3),preview:canvas.toDataURL('image/jpeg',.82),warning:'Leitura experimental. Confirme visualmente todos os valores antes de guardar.'};}
 return{read};
})();
