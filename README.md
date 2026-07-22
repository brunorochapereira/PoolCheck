# PoolCheck V3

Guia passo a passo para manter a piscina pronta, dirigido a utilizadores sem conhecimentos técnicos.

## Alterações principais

- Navegação reduzida para Hoje, Analisar, Assistente e Piscina.
- Estado geral por texto e cor.
- Máximo de três ações prioritárias.
- Plano de tratamento sequencial, uma ação de cada vez.
- Valores químicos ocultos em detalhes.
- Configuração inicial guiada.
- Gestão de stock, custos e equipamento removida do fluxo principal.
- Temperatura configurável para reforçar a filtração.
- Dados guardados localmente e exportáveis em JSON.

## Publicação

Copie todo o conteúdo desta pasta para a raiz do repositório GitHub Pages. Substitua os ficheiros da versão anterior, mantendo uma cópia de segurança antes da substituição.


## Atualização de manutenção e meteorologia

- Temperatura exterior automática através da localização do dispositivo e Open-Meteo.
- Recomendação de maior filtração quando a temperatura atinge o limite configurado.
- Checklist semanal: pré-filtro da bomba, filtro, backwash e aspiração com robô.
- Notificação das tarefas pendentes quando a aplicação é aberta, mediante autorização do dispositivo.

Nota: notificações web no iPhone requerem normalmente a aplicação instalada no ecrã principal e autorização explícita do utilizador.


## Forecast meteorológico em background

A aplicação consulta diariamente a previsão local através da API Open-Meteo, após autorização da localização. A meteorologia não ocupa o ecrã principal. Apenas são apresentados alertas quando calor, radiação UV, chuva ou vento podem afetar a piscina.

A atualização automática ocorre quando a aplicação é aberta e a informação guardada tem mais de 24 horas.


## Manutenção configurável

Cada tarefa pode ser ativada ou desativada e configurada com recorrência em dias, semanas ou meses. A próxima execução é calculada a partir da última conclusão.

## V3.5 — revisão de fórmulas
- pH+ e pH-: referência de 100 g/10 m³ por 0,1 pH, com correção máxima de 0,2 por etapa.
- Alcalinidade+: 180 g/10 m³ por +10 ppm, máximo de +20 ppm por etapa.
- Alcalinidade baixa é corrigida antes do pH.
- Cloro rápido: cálculo por cloro disponível, assumindo 56% apenas como referência e exigindo confirmação do rótulo.
- Cloro líquido: referência de 125 g/L de cloro disponível, com confirmação do rótulo.
- Pastilhas e cloro lento deixam de ser convertidos numa dose corretiva arbitrária.
- Leituras extremas de pH exigem confirmação antes de dosear.
- Filtração deixa de apresentar horas exatas sem conhecer o caudal da bomba.
- Corrigido erro de integração: o inventário de produtos passa a ser enviado ao motor químico.

## V3.6 — reposição de água e inventário operacional

- Nova ação para registar a reposição de água em centímetros.
- Cálculo do volume adicionado através da área da superfície: `litros = área × centímetros × 10`.
- Cálculo da percentagem substituída relativamente ao volume total da piscina.
- Motivos disponíveis: evaporação, backwash ou aspiração para esgoto, utilização e salpicos, possível fuga e motivo desconhecido.
- Reposição inferior a 3%: medir cloro livre e pH depois da circulação.
- Reposição entre 3% e 10%: fazer uma análise completa antes de corrigir parâmetros.
- Reposição igual ou superior a 10%: tratar como renovação parcial significativa.
- A reposição nunca gera automaticamente uma dose de cloro, pH+ ou pH-.
- Avisos específicos quando a última análise já apresentava cloro ou pH fora do intervalo.
- Deteção de várias reposições num período de sete dias.
- Área da superfície adicionada ao perfil e à configuração inicial.
- Produtos disponíveis e respetivas quantidades passam a ser editáveis na área Piscina.
- Ao concluir um tratamento, a quantidade utilizada pode ser descontada automaticamente.
- O motor bloqueia uma dose quando a quantidade configurada do produto é insuficiente.


## Atualização V3.7

Copie os ficheiros desta pasta diretamente para a raiz do repositório. Não carregue a pasta PoolCheck-V3.7 como subpasta. Substitua os ficheiros antigos, incluindo sw.js, app.js e chemistry.js. A versão 3.7 força a remoção das caches anteriores.
