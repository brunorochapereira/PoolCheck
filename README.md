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
