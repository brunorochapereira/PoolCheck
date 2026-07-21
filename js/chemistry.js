const PoolChemistry=(()=>{
 const round=(n,step=10)=>Math.max(step,Math.round(n/step)*step);
 function analyse(a,pool){
  const issues=[];const volume=Number(pool.volume)||36;
  if(a.ph<7.2)issues.push({key:'ph-low',severity:2,title:'Corrigir o pH',reason:'O pH está abaixo do intervalo recomendado.',instruction:`Adicione aproximadamente ${round((7.2-a.ph)*volume*80)} g de pH+. Dissolva num balde com água e distribua pela piscina com a filtração ligada.`,waitHours:2,retest:true});
  if(a.ph>7.6)issues.push({key:'ph-high',severity:2,title:'Corrigir o pH',reason:'O pH está acima do intervalo recomendado.',instruction:`Adicione aproximadamente ${round((a.ph-7.6)*volume*90)} g de pH-. Dissolva num balde com água e distribua pela piscina com a filtração ligada.`,waitHours:2,retest:true});
  if(a.alkalinity<80)issues.push({key:'alk-low',severity:2,title:'Aumentar a alcalinidade',reason:'A alcalinidade está baixa e pode tornar o pH instável.',instruction:`Adicione aproximadamente ${round((80-a.alkalinity)*volume*1.5)} g de aumentador de alcalinidade. Distribua lentamente com a filtração ligada.`,waitHours:6,retest:true});
  if(a.alkalinity>140)issues.push({key:'alk-high',severity:1,title:'Reduzir a alcalinidade',reason:'A alcalinidade está elevada.',instruction:'Ajuste gradualmente com redutor de pH, seguindo a dose do fabricante. Evite correções grandes de uma só vez.',waitHours:6,retest:true});
  if(a.freeChlorine<1)issues.push({key:'chlorine-low',severity:3,title:'Aumentar o cloro',reason:'O cloro livre está baixo e a desinfeção pode ser insuficiente.',instruction:`Adicione aproximadamente ${round((1.5-a.freeChlorine)*volume*3)} g de cloro de ação rápida. Distribua com a filtração ligada.`,waitHours:8,retest:true,noSwim:true});
  if(a.freeChlorine>3)issues.push({key:'chlorine-high',severity:3,title:'Aguardar a redução do cloro',reason:'O cloro livre está acima do intervalo recomendado.',instruction:'Não adicione mais cloro. Mantenha a piscina descoberta e a filtração ligada até o valor descer.',waitHours:6,retest:true,noSwim:true});
  const temp=Number(a.waterTemp)||0;if(temp>=Number(pool.highTempThreshold||28))issues.push({key:'filtration',severity:1,title:'Aumentar a filtração',reason:'A temperatura da água aumenta a necessidade de circulação.',instruction:`Filtre durante cerca de ${Math.min(14,Math.max(8,Math.round(temp/2)))} horas hoje.`,waitHours:0,retest:false});
  issues.sort((x,y)=>y.severity-x.severity);
  const urgent=issues.some(i=>i.severity===3);const status=urgent?'bad':issues.length?'warn':'good';
  return{status,label:status==='good'?'Boa':status==='warn'?'Requer atenção':'Crítica',message:status==='good'?'A água está equilibrada e pronta para utilização.':urgent?'Não utilize a piscina antes de concluir o tratamento e repetir a análise.':'Existem correções simples a realizar.',issues:issues.slice(0,3),allIssues:issues};
 }
 function planFrom(result){
  if(!result.allIssues.length)return{createdAt:new Date().toISOString(),current:0,completed:false,steps:[{title:'Manter a rotina',reason:'A água está equilibrada.',instruction:'Não é necessário adicionar produtos. Faça uma nova análise dentro de 7 dias.',waitHours:0,retest:false}]};
  return{createdAt:new Date().toISOString(),current:0,completed:false,steps:result.allIssues.map((i,idx)=>({...i,order:idx+1,done:false}))};
 }
 return{analyse,planFrom};
})();
