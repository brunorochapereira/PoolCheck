# PoolCheck V5

Aplicação PWA para acompanhamento da química, manutenção e histórico de uma piscina.

## Versões

- Aplicação: 5.0.0-rc.2
- Dados: 5
- Motor químico: 6.0.0

## Alterações principais

- Persistência corrigida: arrays de histórico são preservados em atualizações e migrações.
- Análise e plano gravados de forma atómica.
- Planos anteriores são arquivados quando uma nova análise é criada.
- Módulos de inteligência e visão não podem bloquear os fluxos essenciais.
- Dependência simétrica: alcalinidade inferior a 80 ppm bloqueia pH+ e pH-.
- Validação de CYA, cloro total, dureza e temperatura.
- Tabela conservadora CYA/cloro.
- Versionamento independente do motor químico.
- Fator tampão de pH implementado, mas desativado em produção por omissão.
- Leitura de tira exige confirmação e exclui leituras abaixo de 85% da aprendizagem.
- RC2: planos ativos exigem ligação válida por `analysisId` à análise de origem.
- RC2: importações rejeitam planos órfãos, produtos inválidos e datas de análise inválidas.
- RC2: CYA crítico é priorizado antes de recomendações informativas.
- RC2: ordenação usa `noSwim`, `blocked` e severidade como critérios de segurança secundários.

## Limitações de produção

A tabela CYA/cloro, o fator tampão de pH e o classificador de imagem requerem validação técnica/calibração antes de ativação comercial plena.

## Testes

Execute:

```bash
node test-v5.js
node test-chemistry.js
node test-water.js
node test-storage.js
```
