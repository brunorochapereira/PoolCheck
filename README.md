# PoolCheck V5

Aplicação PWA para acompanhamento da química, manutenção e histórico de uma piscina.

## Versões

- Aplicação: 5.0.0
- Dados: 5
- Motor químico: 5.0.0

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

## Limitações de produção

A tabela CYA/cloro, o fator tampão de pH e o classificador de imagem requerem validação técnica/calibração antes de ativação comercial plena.

## Testes

Execute:

```bash
node test-v5.js
node test-chemistry.js
node test-water.js
```
