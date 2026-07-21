const PoolStore = (() => {
  const KEY = "poolcheck_state_v2";
  const defaults = {
    profile: { name: "Piscina principal", volume: 36, latitude: null, longitude: null },
    analyses: [],
    equipment: [
      { id: crypto.randomUUID(), type: "Bomba de circulação", name: "Bomba principal", status:"ok", brand: "", model: "", installDate: "", nextMaintenance: "", notes: "" },
      { id: crypto.randomUUID(), type: "Filtro de areia", name: "Filtro principal", status:"ok", brand: "", model: "", installDate: "", nextMaintenance: "", notes: "" },
      { id: crypto.randomUUID(), type: "Robot aspirador", name: "Robot", status:"ok", brand: "", model: "", installDate: "", nextMaintenance: "", notes: "" }
    ],
    maintenance: [],
    usage: { weekend: "normal", people: 4 },
    benchmarkImage: null,
    weather: null,
    stock: [
      {id:crypto.randomUUID(),name:"Pastilhas 5 ações",unit:"un",qty:10,min:3,cost:0},
      {id:crypto.randomUUID(),name:"pH+",unit:"kg",qty:1,min:.25,cost:0},
      {id:crypto.randomUUID(),name:"pH-",unit:"kg",qty:1,min:.25,cost:0},
      {id:crypto.randomUUID(),name:"Cloro rápido",unit:"kg",qty:0,min:.5,cost:0},
      {id:crypto.randomUUID(),name:"Incrementador de alcalinidade",unit:"kg",qty:0,min:.5,cost:0}
    ],
    stockUsage: [],
    costs: [],
    github: { owner: "", repo: "PoolCheckData", branch: "main", token: "" },
    lastSync: null
  };
  function load() {
    try {
      const raw = localStorage.getItem(KEY) || localStorage.getItem("poolcheck_state_v1");
      if (!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw);
      return {...structuredClone(defaults),...parsed,
        stock: parsed.stock || structuredClone(defaults.stock),
        stockUsage: parsed.stockUsage || [],
        costs: parsed.costs || [],
        equipment:(parsed.equipment||defaults.equipment).map(e=>({...e,status:e.status||"ok"}))
      };
    } catch { return structuredClone(defaults); }
  }
  let state=load();
  function save(){localStorage.setItem(KEY,JSON.stringify(state))}
  function get(){return state}
  function replace(next){state={...structuredClone(defaults),...next};save();return state}
  function update(mutator){mutator(state);save();return state}
  function exportData(){const clean=structuredClone(state);if(clean.github)clean.github.token="";return JSON.stringify(clean,null,2)}
  function clear(){localStorage.removeItem(KEY);state=structuredClone(defaults);save()}
  return{get,update,replace,exportData,clear};
})();