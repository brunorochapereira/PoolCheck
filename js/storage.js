const PoolStore=(()=>{
 const KEY='poolcheck-v3';
 const defaults={version:3.3,onboardingComplete:false,pool:{name:'Piscina principal',type:'enterrada',volume:36,treatment:'cloro',hasCover:false,highTempThreshold:28},weather:{enabled:true,autoTasks:true,latitude:null,longitude:null,temperature:null,updatedAt:null,timezone:null,daily:[],impact:null},maintenance:[{id:'pump-prefilter',title:'Limpar pré-filtro da bomba',lastDone:null,enabled:true,intervalValue:3,intervalUnit:'days',intervalDays:3},{id:'filter',title:'Verificar e limpar o filtro',lastDone:null,enabled:true,intervalValue:1,intervalUnit:'weeks',intervalDays:7},{id:'backwash',title:'Fazer backwash',lastDone:null,enabled:true,intervalValue:2,intervalUnit:'weeks',intervalDays:14},{id:'robot',title:'Aspirar com o robô',lastDone:null,enabled:true,intervalValue:2,intervalUnit:'days',intervalDays:2}],notificationsEnabled:false,lastMaintenanceNotification:null,analyses:[],activePlan:null,lastCompletedPlan:null};
 const clone=o=>JSON.parse(JSON.stringify(o));
 function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return clone(defaults);return merge(clone(defaults),JSON.parse(raw));}catch(e){return clone(defaults)}}
 function merge(base,extra){for(const [k,v] of Object.entries(extra||{})){if(v&&typeof v==='object'&&!Array.isArray(v)&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))base[k]=merge(base[k],v);else base[k]=v}return base}
 let state=load();
 function save(){localStorage.setItem(KEY,JSON.stringify(state))}
 return{get:()=>state,update(fn){fn(state);save();return state},replace(next){state=merge(clone(defaults),next);save();return state},reset(){state=clone(defaults);save();return state},export(){return JSON.stringify(state,null,2)}};
})();
