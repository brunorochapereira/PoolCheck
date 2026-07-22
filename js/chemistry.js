const PoolChemistry=(()=>{
 const round=(n,step=10)=>Math.max(0,Math.round(n/step)*step);
 const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
 const available=(products,id)=>Boolean(products?.[id]?.enabled)&&Number(products[id].quantity)>0;
 const qty=(products,id)=>Number(products?.[id]?.quantity)||0;
 const enough=(products,id,amount)=>available(products,id)&&qty(products,id)>=Number(amount||0);
 const productStep=(id,amount,unit,instruction,extra={})=>({productId:id,productAmount:amount,productUnit:unit,instruction,...extra});

 // Conservative reference profiles. Product labels always take precedence.
 const REF={
  phGranulesGramsPer10m3Per01:100,
  alkalinityGramsPer10m3Per10ppm:180,
  maxPhChangePerStep:0.2,
  maxAlkalinityChangePerStep:20,
  fastChlorineAvailableFraction:0.56,
  liquidChlorineAvailableGramsPerLitre:125
 };

 function invalidReading(a){
  const warnings=[];
  if(!Number.isFinite(a.ph)||a.ph<4||a.ph>10)warnings.push('A leitura de pH está fora do intervalo aceite.');
  if(!Number.isFinite(a.freeChlorine)||a.freeChlorine<0||a.freeChlorine>20)warnings.push('A leitura de cloro livre está fora do intervalo aceite.');
  if(!Number.isFinite(a.alkalinity)||a.alkalinity<0||a.alkalinity>400)warnings.push('A leitura de alcalinidade está fora do intervalo aceite.');
  return warnings;
 }

 function phDose(volume,current,target,isIncrease){
  const requestedDelta=Math.abs(target-current);
  const appliedDelta=Math.min(requestedDelta,REF.maxPhChangePerStep);
  const grams=round((appliedDelta/0.1)*(volume/10)*REF.phGranulesGramsPer10m3Per01,10);
  return{grams,requestedDelta,appliedDelta,staged:requestedDelta>appliedDelta,isIncrease};
 }

 function alkalinityDose(volume,current,target){
  const requestedDelta=Math.max(0,target-current);
  const appliedDelta=Math.min(requestedDelta,REF.maxAlkalinityChangePerStep);
  const grams=round((appliedDelta/10)*(volume/10)*REF.alkalinityGramsPer10m3Per10ppm,10);
  return{grams,requestedDelta,appliedDelta,staged:requestedDelta>appliedDelta};
 }

 function chooseChlorine(products,volume,current,target){
  const delta=Math.max(0,target-current);
  const pureGrams=delta*volume; // 1 ppm in 1 m³ = 1 g of available chlorine.
  if(available(products,'fastChlorine')){
   const grams=round(pureGrams/REF.fastChlorineAvailableFraction,10);
   if(qty(products,'fastChlorine')>=grams/1000)return productStep('fastChlorine',grams/1000,'kg',`Adicione aproximadamente ${grams} g de cloro rápido, considerando um produto com 56% de cloro disponível. Confirme a concentração no rótulo e ajuste proporcionalmente. Distribua com a filtração ligada.`,{waitHours:8,retest:true,noSwim:true,estimated:true});
  }
  if(available(products,'liquidChlorine')){
   const litres=Math.max(.1,Math.round((pureGrams/REF.liquidChlorineAvailableGramsPerLitre)*10)/10);
   if(qty(products,'liquidChlorine')>=litres)return productStep('liquidChlorine',litres,'l',`Adicione aproximadamente ${litres.toLocaleString('pt-PT')} L de cloro líquido, considerando 125 g/L de cloro disponível. Confirme a concentração no rótulo e ajuste proporcionalmente. Distribua com a filtração ligada.`,{waitHours:8,retest:true,noSwim:true,estimated:true});
  }
  if(available(products,'multitabs')||available(products,'slowChlorine'))return{instruction:'O cloro livre está baixo, mas pastilhas multifunções e cloro lento não são adequados para uma correção rápida e a dose depende do peso e da composição do produto. Mantenha apenas a dosagem normal indicada no rótulo e repita a análise dentro de 24 horas. Não utilize a piscina enquanto o cloro livre estiver abaixo do mínimo recomendado.',blocked:false,slowOnly:true,retest:true,waitHours:24,noSwim:true};
  return{instruction:'Não existe um produto configurado que permita aumentar o cloro de forma calculável. Este passo fica pendente.',blocked:true,retest:true,noSwim:true};
 }

 function analyse(a,pool,products={}){
  const issues=[];
  const volume=Math.max(1,Number(pool.volume)||36);
  const readingWarnings=invalidReading(a);
  if(readingWarnings.length)return{status:'bad',label:'Leitura inválida',message:'Confirme os valores antes de adicionar qualquer produto.',issues:readingWarnings.map((reason,i)=>({key:`invalid-${i}`,severity:3,title:'Confirmar a análise',reason,instruction:'Repita a medição com uma tira nova ou, preferencialmente, com um teste DPD/fotómetro. Não adicione produtos com base nesta leitura.',blocked:true,noSwim:true,retest:true})),allIssues:readingWarnings.map((reason,i)=>({key:`invalid-${i}`,severity:3,title:'Confirmar a análise',reason,instruction:'Repita a medição antes de efetuar qualquer correção.',blocked:true,noSwim:true,retest:true}))};

  // Extremely low/high pH readings should be confirmed before dosing.
  if(a.ph<6.5||a.ph>8.5){
   issues.push({key:'ph-confirm',severity:3,title:'Confirmar o pH',reason:`O pH registado (${a.ph}) está muito afastado do intervalo normal e pode resultar de uma leitura imprecisa.`,instruction:'Repita a medição antes de adicionar produto. Se o valor se confirmar, faça apenas correções faseadas, com nova medição entre aplicações.',retest:true,noSwim:true});
  }

  if(a.alkalinity<80){
   const d=alkalinityDose(volume,a.alkalinity,80);
   const amountKg=d.grams/1000;
   let action;
   if(enough(products,'alkalinityPlus',amountKg))action=productStep('alkalinityPlus',amountKg,'kg',`Adicione aproximadamente ${d.grams} g de incrementador de alcalinidade para aumentar cerca de ${d.appliedDelta} ppm. Mantenha a filtração ligada e repita a análise após 6 horas.${d.staged?' A correção total foi dividida em etapas.':''}`,{waitHours:6,retest:true,staged:d.staged});
   else if(available(products,'alkalinityPlus'))action={instruction:`A quantidade disponível de incrementador de alcalinidade (${qty(products,'alkalinityPlus').toLocaleString('pt-PT')} kg) é inferior aos ${amountKg.toLocaleString('pt-PT')} kg calculados para esta etapa. Não aplique uma dose parcial sem recalcular.`,blocked:true,retest:true};
   else action={instruction:'Não existe incrementador de alcalinidade disponível. Esta correção fica pendente.',blocked:true,retest:true};
   issues.push({key:'alk-low',severity:2,title:'Aumentar a alcalinidade',reason:'A alcalinidade está abaixo de 80 ppm e pode tornar o pH instável.',...action});
  }

  // Correct pH only after alkalinity when TA is low.
  const lowAlk=a.alkalinity<80;
  if(a.ph<7.2){
   const d=phDose(volume,a.ph,7.2,true);
   const amountKg=d.grams/1000;
   let action;
   if(lowAlk)action={instruction:'A alcalinidade está baixa. Corrija primeiro a alcalinidade e volte a medir o pH antes de adicionar pH+.',blocked:true,retest:true,noSwim:a.ph<7};
   else if(enough(products,'phPlus',amountKg))action=productStep('phPlus',amountKg,'kg',`Adicione aproximadamente ${d.grams} g de pH+ para aumentar no máximo ${d.appliedDelta.toLocaleString('pt-PT')} unidades nesta etapa. Distribua diretamente por vários pontos da piscina com a filtração ligada, sem misturar com outros produtos, e repita a análise após 2 a 3 horas.${d.staged?' Não tente atingir o valor final numa única aplicação.':''}`,{waitHours:3,retest:true,staged:d.staged,noSwim:a.ph<7});
   else if(available(products,'phPlus'))action={instruction:`A quantidade disponível de pH+ (${qty(products,'phPlus').toLocaleString('pt-PT')} kg) é inferior aos ${amountKg.toLocaleString('pt-PT')} kg calculados para esta etapa. Não aplique uma dose parcial sem recalcular.`,blocked:true,retest:true,noSwim:a.ph<7};
   else action={instruction:'Não existe pH+ disponível. Esta correção não pode ser executada com os produtos configurados.',blocked:true,retest:true,noSwim:a.ph<7};
   issues.push({key:'ph-low',severity:a.ph<6.8?3:2,title:'Aumentar o pH',reason:'O pH está abaixo do intervalo operacional de 7,2 a 7,6.',...action});
  }
  if(a.ph>7.6){
   const d=phDose(volume,a.ph,7.6,false);
   const amountKg=d.grams/1000;
   let action;
   if(enough(products,'phMinus',amountKg))action=productStep('phMinus',amountKg,'kg',`Adicione aproximadamente ${d.grams} g de pH- para reduzir no máximo ${d.appliedDelta.toLocaleString('pt-PT')} unidades nesta etapa. Distribua diretamente por vários pontos da piscina com a filtração ligada, sem misturar com outros produtos, e repita a análise após 2 a 3 horas.${d.staged?' Não tente atingir o valor final numa única aplicação.':''}`,{waitHours:3,retest:true,staged:d.staged,noSwim:a.ph>8});
   else if(available(products,'phMinus'))action={instruction:`A quantidade disponível de pH- (${qty(products,'phMinus').toLocaleString('pt-PT')} kg) é inferior aos ${amountKg.toLocaleString('pt-PT')} kg calculados para esta etapa. Não aplique uma dose parcial sem recalcular.`,blocked:true,retest:true,noSwim:a.ph>8};
   else action={instruction:'Não existe pH- disponível. Esta correção não pode ser executada com os produtos configurados.',blocked:true,retest:true,noSwim:a.ph>8};
   issues.push({key:'ph-high',severity:a.ph>8?3:2,title:'Reduzir o pH',reason:'O pH está acima do intervalo operacional de 7,2 a 7,6.',...action});
  }

  if(a.alkalinity>140)issues.push({key:'alk-high',severity:1,title:'Alcalinidade elevada',reason:'A alcalinidade está acima de 140 ppm. A redução não tem uma dose universal segura porque depende do ácido utilizado, da concentração e da aeração.',instruction:'Não calcule automaticamente uma dose. Ajuste o pH de forma gradual com o produto adequado, seguindo o rótulo, e repita a análise. Evite baixar o pH abaixo de 7,2.',retest:true});

  const cya=Number.isFinite(a.cya)?Number(a.cya):null;
  const minFreeChlorine=cya!==null&&cya>0?2:1;
  const targetFreeChlorine=cya!==null&&cya>0?2.5:1.5;
  if(a.freeChlorine<minFreeChlorine)issues.push({key:'chlorine-low',severity:3,title:'Aumentar o cloro',reason:`O cloro livre está abaixo do mínimo de ${minFreeChlorine} ppm${cya!==null&&cya>0?' para água com estabilizador':''}.`,...chooseChlorine(products,volume,a.freeChlorine,targetFreeChlorine)});
  if(a.freeChlorine>4)issues.push({key:'chlorine-high',severity:3,title:'Aguardar a redução do cloro',reason:'O cloro livre está acima do intervalo habitual.',instruction:'Não adicione mais cloro. Mantenha a piscina descoberta e a filtração ligada. Repita a análise antes de utilizar a piscina e respeite sempre o limite indicado no rótulo do produto.',waitHours:6,retest:true,noSwim:true});

  if(Number.isFinite(a.totalChlorine)){
   const combined=Math.max(0,Number(a.totalChlorine)-Number(a.freeChlorine));
   if(combined>0.4)issues.push({key:'combined-chlorine',severity:2,title:'Cloro combinado elevado',reason:`O cloro combinado estimado é ${combined.toFixed(1).replace('.',',')} ppm.`,instruction:'Ventile a zona, mantenha a filtração ligada e confirme a leitura. Um tratamento de breakpoint exige cloro rápido e cálculo específico; não deve ser substituído por pastilhas lentas.',retest:true,noSwim:true});
  }

  if(cya!==null&&cya>100)issues.push({key:'cya-high',severity:2,title:'Estabilizador elevado',reason:'O estabilizador elevado reduz a eficácia do cloro.',instruction:'Não adicione mais estabilizador nem cloro estabilizado. A correção normalmente requer substituição parcial de água; confirme a leitura antes de atuar.',retest:true});

  const temp=Number(a.waterTemp)||0;
  if(temp>=Number(pool.highTempThreshold||28))issues.push({key:'filtration',severity:1,title:'Reforçar circulação e controlo',reason:'Água quente acelera o consumo de desinfetante e o crescimento microbiológico.',instruction:`Aumente a filtração relativamente à rotina normal e confirme o cloro mais frequentemente. O número exato de horas depende do caudal da bomba e do volume da piscina.${pool.coverType==='bubble'?' Retire a manta durante parte do período mais quente se a água estiver a sobreaquecer.':''}`,waitHours:0,retest:false});

  issues.sort((x,y)=>y.severity-x.severity);
  const urgent=issues.some(i=>i.severity===3);
  const status=urgent?'bad':issues.length?'warn':'good';
  return{status,label:status==='good'?'Boa':status==='warn'?'Requer atenção':'Crítica',message:status==='good'?'A água está dentro dos intervalos definidos.':urgent?'Conclua primeiro os passos seguros e repita a análise antes de utilizar a piscina.':'Existem correções graduais a realizar.',issues:issues.slice(0,3),allIssues:issues};
 }

 function planFrom(result){
  if(!result.allIssues.length)return{createdAt:new Date().toISOString(),current:0,completed:false,steps:[{title:'Manter a rotina',reason:'A água está equilibrada.',instruction:'Não é necessário adicionar produtos. Faça uma nova análise dentro de 7 dias ou após chuva intensa/utilização elevada.',waitHours:0,retest:false}]};
  return{createdAt:new Date().toISOString(),current:0,completed:false,steps:result.allIssues.map((i,idx)=>({...i,order:idx+1,done:false}))};
 }
 return{analyse,planFrom,reference:REF,_test:{phDose,alkalinityDose,chooseChlorine}};
})();
