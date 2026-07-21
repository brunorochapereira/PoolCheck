const PoolStore=(()=>{
 const KEY='poolcheck-v3';
 const defaults={version:3,onboardingComplete:false,pool:{name:'Piscina principal',type:'enterrada',volume:36,treatment:'cloro',hasCover:false,highTempThreshold:28},analyses:[],activePlan:null,lastCompletedPlan:null};
 const clone=o=>JSON.parse(JSON.stringify(o));
 function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return clone(defaults);return merge(clone(defaults),JSON.parse(raw));}catch(e){return clone(defaults)}}
 function merge(base,extra){for(const [k,v] of Object.entries(extra||{})){if(v&&typeof v==='object'&&!Array.isArray(v)&&base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k]))base[k]=merge(base[k],v);else base[k]=v}return base}
 let state=load();
 function save(){localStorage.setItem(KEY,JSON.stringify(state))}
 return{get:()=>state,update(fn){fn(state);save();return state},replace(next){state=merge(clone(defaults),next);save();return state},reset(){state=clone(defaults);save();return state},export(){return JSON.stringify(state,null,2)}};
})();
