const PoolStore=(()=>{
 const KEY='poolcheck-v3';
 const products={
  multitabs:{id:'multitabs',name:'Pastilhas multifunções',category:'Desinfeção',enabled:true,unit:'pastilhas',quantity:8,step:1},
  slowChlorine:{id:'slowChlorine',name:'Cloro lento',category:'Desinfeção',enabled:true,unit:'kg',quantity:2.5,step:0.1},
  fastChlorine:{id:'fastChlorine',name:'Cloro rápido',category:'Desinfeção',enabled:false,unit:'kg',quantity:0,step:0.1},
  liquidChlorine:{id:'liquidChlorine',name:'Cloro líquido',category:'Desinfeção',enabled:false,unit:'l',quantity:0,step:0.1},
  phPlus:{id:'phPlus',name:'pH+',category:'Equilíbrio',enabled:true,unit:'kg',quantity:5,step:0.1},
  phMinus:{id:'phMinus',name:'pH-',category:'Equilíbrio',enabled:true,unit:'kg',quantity:2,step:0.1},
  alkalinityPlus:{id:'alkalinityPlus',name:'Incrementador de alcalinidade',category:'Equilíbrio',enabled:false,unit:'kg',quantity:0,step:0.1},
  alkalinityMinus:{id:'alkalinityMinus',name:'Redutor de alcalinidade',category:'Equilíbrio',enabled:false,unit:'kg',quantity:0,step:0.1},
  stabilizer:{id:'stabilizer',name:'Estabilizador',category:'Equilíbrio',enabled:false,unit:'kg',quantity:0,step:0.1},
  algaecide:{id:'algaecide',name:'Anti algas',category:'Tratamentos',enabled:false,unit:'l',quantity:0,step:0.1},
  flocculant:{id:'flocculant',name:'Floculante',category:'Tratamentos',enabled:false,unit:'l',quantity:0,step:0.1},
  clarifier:{id:'clarifier',name:'Clarificante',category:'Tratamentos',enabled:false,unit:'l',quantity:0,step:0.1}
 };
 const defaults={version:3.6,onboardingComplete:false,pool:{name:'Piscina principal',type:'enterrada',volume:36,surfaceArea:null,treatment:'cloro',hasCover:true,coverType:'bubble',coverUsage:'usually',highTempThreshold:28},products,productHistory:[],waterTopUps:[],weather:{enabled:true,autoTasks:true,latitude:null,longitude:null,temperature:null,updatedAt:null,timezone:null,daily:[],impact:null},maintenance:[{id:'pump-prefilter',title:'Limpar pré-filtro da bomba',lastDone:null,enabled:true,intervalValue:3,intervalUnit:'days',intervalDays:3},{id:'filter',title:'Verificar e limpar o filtro',lastDone:null,enabled:true,intervalValue:1,intervalUnit:'weeks',intervalDays:7},{id:'backwash',title:'Fazer backwash',lastDone:null,enabled:true,intervalValue:2,intervalUnit:'weeks',intervalDays:14},{id:'robot',title:'Aspirar com o robô',lastDone:null,enabled:true,intervalValue:2,intervalUnit:'days',intervalDays:2}],notificationsEnabled:false,lastMaintenanceNotification:null,analyses:[],activePlan:null,lastCompletedPlan:null};
 const clone=o=>JSON.parse(JSON.stringify(o));
 function merge(base,extra){for(const [k,v] of Object.entries(extra||{})){if(v&&typeof v==='object'&&!Array.isArray(v)&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))base[k]=merge(base[k],v);else base[k]=v}return base}
 function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return clone(defaults);return merge(clone(defaults),JSON.parse(raw));}catch(e){return clone(defaults)}}
 let state=load();
 function save(){localStorage.setItem(KEY,JSON.stringify(state))}
 return{get:()=>state,update(fn){fn(state);save();return state},replace(next){state=merge(clone(defaults),next);save();return state},reset(){state=clone(defaults);save();return state},export(){return JSON.stringify(state,null,2)}};
})();
