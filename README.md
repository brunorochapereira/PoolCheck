# PoolCheck V2

Versão 2 do gestor inteligente de piscina.

## Novidades

- Dashboard redesenhado
- Estado consolidado da água
- Previsão meteorológica com UV e chuva
- Plano inteligente diário
- Estimativa de horas de filtração
- Estado operacional dos equipamentos
- Gestão de stock e consumos
- Custos por categoria e total anual
- Gráfico de tendência de pH e cloro
- Alertas cruzados entre água, calor, utilização, stock e hardware
- Migração automática dos dados da versão 1
- Sincronização GitHub mantida

## Estrutura

```text
PoolCheck-v2/
├── index.html
├── manifest.json
├── sw.js
├── README.md
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── chemistry.js
    ├── github.js
    ├── storage.js
    └── weather.js
```

## GitHub

Publicar este repositório no GitHub Pages.

Para dados privados, usar outro repositório, por exemplo `PoolCheckData`, com token fine-grained limitado a esse repositório e permissão `Contents: Read and write`.

## Nota

A leitura automática da tira continua dependente da fotografia da tabela de cores do fabricante. O módulo está preparado para receber esse benchmark.
