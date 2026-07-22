const PoolStore=(()=>{
 const APP_VERSION='5.0.0';
 const DATA_VERSION=5;
 const KEY='poolcheck-v5';
 const LEGACY_KEYS=['poolcheck-v4','poolcheck-v3','poolcheck_state_v3','poolcheck_state_v2'];
 const productDefaults={
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
 const taskDefaults=[
  {id:'pump-prefilter',title:'Limpar pré-filtro da bomba',lastDone:null,enabled:true,intervalValue:3,intervalUnit:'days',intervalDays:3},
  {id:'filter',title:'Verificar e limpar o filtro',lastDone:null,enabled:true,intervalValue:1,intervalUnit:'weeks',intervalDays:7},
  {id:'backwash',title:'Fazer backwash',lastDone:null,enabled:true,intervalValue:2,intervalUnit:'weeks',intervalDays:14},
  {id:'robot',title:'Aspirar com o robô',lastDone:null,enabled:true,intervalValue:2,intervalUnit:'days',intervalDays:2},
  {id:'cover-clean',title:'Limpar e verificar a manta',lastDone:null,enabled:true,intervalValue:2,intervalUnit:'weeks',intervalDays:14}
 ];
 const defaults={dataVersion:DATA_VERSION,appVersion:APP_VERSION,onboardingComplete:false,featureFlags:{phBufferAdjustmentEnabled:false,stripReaderEnabled:true},pool:{name:'Piscina principal',type:'enterrada',volume:36,surfaceArea:null,treatment:'cloro',hasCover:true,coverType:'bubble',coverUsage:'usually',highTempThreshold:28,filterType:'sand',sunExposure:'full',treesNearby:false,windExposure:'normal'},products:productDefaults,productHistory:[],waterTopUps:[],weather:{enabled:true,autoTasks:true,latitude:null,longitude:null,temperature:null,updatedAt:null,timezone:null,daily:[],impact:null},maintenance:taskDefaults,notificationsEnabled:false,lastMaintenanceNotification:null,analyses:[],plans:[],activePlan:null,lastCompletedPlan:null,learning:{enabled:true,models:{},observations:[],minimumSamples:3},predictions:{lastRun:null,items:[]},assistantHistory:[],stripReader:{model:'generic-6',lastConfidence:null}};
 const clone=o=>JSON.parse(JSON.stringify(o));
 function mergeObject(base,extra){
  for(const [k,v] of Object.entries(extra||{})){
   if(Array.isArray(v)){base[k]=clone(v);continue;}
   if(v&&typeof v==='object'&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))base[k]=mergeObject(base[k],v);
   else base[k]=v;
  }
  return base;
 }
 function reconcileById(defaultItems,oldItems){const map=new Map((oldItems||[]).map(x=>[x.id,x]));return defaultItems.map(d=>mergeObject(clone(d),map.get(d.id)||{})).concat((oldItems||[]).filter(x=>!defaultItems.some(d=>d.id===x.id)).map(clone));}
 function migrate(raw){
  const next=mergeObject(clone(defaults),raw||{});
  next.products=mergeObject(clone(productDefaults),raw?.products||{});
  next.maintenance=reconcileById(taskDefaults,raw?.maintenance||[]);
  ['analyses','plans','productHistory','waterTopUps','assistantHistory'].forEach(k=>{if(!Array.isArray(next[k]))next[k]=[];});
  if(!Array.isArray(next.learning?.observations))next.learning.observations=[];
  if(!Array.isArray(next.predictions?.items))next.predictions.items=[];
  next.dataVersion=DATA_VERSION;next.appVersion=APP_VERSION;
  if(next.activePlan?.steps)next.activePlan.steps=next.activePlan.steps.map(s=>({...s,status:s.status||(s.done?'concluido':'pendente'),skipped:Boolean(s.skipped)}));
  return next;
 }
 function parseRaw(key){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):null}catch(e){return null}}
 function findRaw(){for(const key of [KEY,...LEGACY_KEYS]){const raw=parseRaw(key);if(raw)return raw;}return null;}
 let state=migrate(findRaw());
 function save(next=state){localStorage.setItem(KEY,JSON.stringify(next));}
 function validateImported(next){if(!next||typeof next!=='object')throw new Error('Estrutura inválida.');if(next.dataVersion!=null&&!Number.isFinite(Number(next.dataVersion)))throw new Error('Versão de dados inválida.');['analyses','waterTopUps','productHistory','assistantHistory'].forEach(k=>{if(next[k]!=null&&!Array.isArray(next[k]))throw new Error(`O campo ${k} é inválido.`);});return true;}
 function commit(mutator){const draft=clone(state);mutator(draft);const migrated=migrate(draft);save(migrated);state=migrated;return state;}
 save();
 return{APP_VERSION,DATA_VERSION,get:()=>state,update:commit,replace(next){validateImported(next);const migrated=migrate(next);save(migrated);state=migrated;return state},reset(){state=clone(defaults);save();return state},export(){return JSON.stringify(state,null,2)},validateImported,version:DATA_VERSION};
})();
