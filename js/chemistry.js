const Chemistry = (() => {
  const targets = { ph:[7.2,7.6], freeChlorine:[1.5,3], alkalinity:[80,120], cya:[30,50], hardness:[150,300] };
  function evaluate(a, volume) {
    const recs = [];
    const add = (severity,title,body,action="") => recs.push({severity,title,body,action});
    if (a.ph < 7.2) add("high","pH baixo",`O pH está em ${a.ph}. Corrige gradualmente com pH+ e volta a medir após circulação completa.`,"Adicionar pH+ conforme rótulo, em pequenas doses.");
    else if (a.ph > 7.6) add("high","pH elevado",`O pH está em ${a.ph}. Reduz a eficácia do cloro e favorece depósitos.`,"Adicionar pH- por etapas e voltar a medir.");
    else add("low","pH adequado",`O pH está dentro do intervalo recomendado de ${targets.ph[0]} a ${targets.ph[1]}.`);
    if (a.freeChlorine < 1.5) add("high","Cloro livre baixo",`O cloro livre está em ${a.freeChlorine} ppm. Confirma o doseador e corrige antes de utilização intensa.`,"Aplicar cloro rápido conforme rótulo; manter filtração.");
    else if (a.freeChlorine > 4) add("medium","Cloro livre elevado",`O cloro livre está em ${a.freeChlorine} ppm. Evita adicionar mais cloro e deixa o nível descer.`);
    else add("low","Cloro livre adequado",`O cloro livre está em intervalo operacional.`);
    if (a.totalChlorine != null && a.totalChlorine - a.freeChlorine > 0.5) add("high","Cloro combinado elevado",`A diferença entre cloro total e livre é superior a 0,5 ppm.`,"Considerar cloração de choque, seguindo o rótulo e sem utilizar a piscina durante o tratamento.");
    if (a.alkalinity < 80) add("medium","Alcalinidade baixa",`A alcalinidade está em ${a.alkalinity} ppm e pode tornar o pH instável.`,"Adicionar incrementador de alcalinidade gradualmente.");
    else if (a.alkalinity > 120) add("medium","Alcalinidade elevada",`A alcalinidade está em ${a.alkalinity} ppm. Corrigir lentamente, acompanhando o pH.`);
    if (a.cya != null && a.cya > 70) add("high","Estabilizante elevado",`O ácido cianúrico está em ${a.cya} ppm. O cloro pode ficar menos eficaz.`,"Avaliar renovação parcial de água.");
    if (a.cya != null && a.cya < 20) add("medium","Estabilizante baixo",`O ácido cianúrico está em ${a.cya} ppm. O sol poderá consumir cloro mais depressa.`);
    if (a.hardness != null && a.hardness < 150) add("medium","Dureza baixa",`A dureza está em ${a.hardness} ppm.`);
    if (a.hardness != null && a.hardness > 350) add("medium","Dureza elevada",`A dureza está em ${a.hardness} ppm. Vigia depósitos e mantém o pH controlado.`);
    const unsafe = recs.some(r=>r.severity==="high");
    return { status: unsafe ? "Intervenção necessária" : recs.some(r=>r.severity==="medium") ? "Atenção" : "Equilibrada", recs, volume };
  }
  function filtrationHours(state){
    const latest=state.analyses[0];
    const water=latest?.waterTemp;
    const air=state.weather?.daily?.temperature_2m_max?.[0];
    const temp=water ?? air ?? 24;
    let hours=Math.max(4,Math.round(temp/3));
    if(state.usage.weekend==="high") hours+=2;
    if(latest?.freeChlorine!=null && latest.freeChlorine<1.5) hours+=1;
    return Math.min(12,hours);
  }
  function preventive(state) {
    const out = [];
    const latest = state.analyses[0];
    const w = state.weather;
    const add = (severity,title,body)=>out.push({severity,title,body});
    if (!latest) add("high","Faz uma análise completa","Sem valores recentes, o sistema não consegue validar a água antes da utilização.");
    if (latest) {
      const days=(Date.now()-new Date(latest.date).getTime())/86400000;
      if(days>5)add("medium","Análise desatualizada",`A última análise tem ${Math.floor(days)} dias.`);
      if(latest.freeChlorine<1.8)add("high","Antecipar correção do cloro","O cloro está perto ou abaixo do limite operacional.");
      if(latest.ph<7.2||latest.ph>7.6)add("high","Corrigir o pH antes do fim de semana",`O pH atual é ${latest.ph}.`);
    }
    if(w?.daily?.temperature_2m_max){
      const max=Math.max(...w.daily.temperature_2m_max.slice(0,5));
      const rain=Math.max(...(w.daily.precipitation_sum||[]).slice(0,5));
      const uv=Math.max(...(w.daily.uv_index_max||[]).slice(0,5));
      if(max>=30)add("high","Período muito quente previsto",`Máxima até ${Math.round(max)} °C e UV até ${uv.toFixed(1)}. Confirma o cloro, aumenta a filtração e limpa os cestos antes do fim de semana.`);
      else if(max>=26)add("medium","Bom tempo para utilização",`Máximas próximas de ${Math.round(max)} °C. Limpa o fundo e a linha de água antes do fim de semana.`);
      if(rain>=10)add("medium","Chuva relevante prevista",`Precipitação diária até ${Math.round(rain)} mm. Programa nova análise após a chuva.`);
    }
    if(state.usage.weekend==="high")add("medium","Utilização intensa prevista",`Previstas cerca de ${state.usage.people} pessoas. Confirma cloro e pH no próprio dia.`);
    const due=state.equipment.filter(e=>e.nextMaintenance&&new Date(e.nextMaintenance)<=new Date(Date.now()+14*86400000));
    due.forEach(e=>add("medium",`Manutenção próxima: ${e.name}`,`Data prevista: ${e.nextMaintenance}.`));
    state.equipment.filter(e=>e.status==="fault").forEach(e=>add("high",`Avaria: ${e.name}`,"Resolve a avaria antes de operar a piscina."));
    state.equipment.filter(e=>e.status==="attention").forEach(e=>add("medium",`Verificar: ${e.name}`,"O equipamento está marcado como necessitando de atenção."));
    const critical=state.stock.filter(x=>Number(x.qty)<=Number(x.min));
    critical.forEach(x=>add("medium",`Stock baixo: ${x.name}`,`Restam ${x.qty} ${x.unit}.`));
    add("low","Filtração diária recomendada",`${filtrationHours(state)} horas por dia com base na temperatura e utilização prevista.`);
    const filter=state.equipment.find(e=>e.type.includes("Filtro"));
    if(filter)add("low","Verifica a pressão do filtro","Se estiver cerca de 20 a 25% acima da pressão após limpeza, faz lavagem inversa.");
    const pump=state.equipment.find(e=>e.type.includes("Bomba"));
    if(pump)add("low","Inspeção rápida da bomba","Verifica ruído, fugas, entradas de ar e cesto do pré-filtro.");
    return out;
  }
  return { evaluate, preventive, filtrationHours, targets };
})();