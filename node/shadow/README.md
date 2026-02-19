# Shadow migration

Pasta com a lógica de **shadow compare**: rodar em paralelo duas fontes de dados (ex.: API legada vs nova) e comparar o resultado de forma estrutural para validar migrações sem mudar o comportamento em produção.

## Fluxo

1. **Execute**: o consumidor chama `ShadowMigration.execute(legacy, next, ctx)`.
2. **Feature flags** (FeatureHub) definem:
   - `migrationComplete`: se `true`, só a fonte nova é usada e seu resultado é retornado.
   - `shadow`: se `true`, as duas fontes são chamadas; o resultado retornado depende de `returnNew`.
   - `returnNew`: em modo shadow, define se a resposta ao cliente vem da fonte nova (`true`) ou legada (`false`).
3. **Comparação**: em background, os dois payloads são normalizados e passam por um diff estrutural. Diferenças são logadas como warning.

## Arquivos principais

| Arquivo | Responsabilidade |
|--------|-------------------|
| **ShadowMigration.ts** | Orquestra a execução (legacy/next), avalia flags e agenda a comparação. |
| **structuralCompare.ts** | Diff estrutural entre dois valores: chaves, tipos, tamanhos de array, presença (não compara valores literais). |
| **normalizers/** | Funções que projetam o payload de cada fonte para um shape comparável (ex.: alinhado à tipagem `SearchProduct[]`). |

## Normalizer de product

O normalizer de product **não** executa resolvers. Uma única função garante que ambos os payloads (legacy e new) são projetados para o **mesmo shape**, alinhado à tipagem `SearchProduct[]`: mesmo conjunto de chaves (com defaults para ausentes), para que o diff estrutural reflita apenas as diferenças relevantes. O `structuralCompare` continua a reportar os tipos de diferença documentados abaixo (missing_key, extra_key, array_length_mismatch, type_mismatch, presence_mismatch).

## Como adicionar outra migração shadow

1. Criar um normalizer em `normalizers/` que receba o payload e retorne um shape comparável (sync ou async), por exemplo projetando para uma tipagem comum (como no product: `SearchProduct[]`).
2. Instanciar `ShadowMigration` com:
   - `normalize`: sua função de normalização
   - `name`: identificador da migração (entra nos logs)
   - `flags`: nomes das flags no FeatureHub (`migrationComplete`, `shadow`, `returnNew`)
3. No serviço, chamar `migration.execute(legacyFn, newFn, ctx)` e usar `result.result` e `result.source`.

## Tipos de diferença (structuralCompare)

- `missing_key` / `extra_key`: chave presente só em um dos lados
- `array_length_mismatch`: arrays com tamanhos diferentes
- `type_mismatch`: tipos diferentes no mesmo caminho
- `presence_mismatch`: um valor “vazio” e outro não (ex.: `''` vs `'x'`)

A comparação limita profundidade e quantidade de elementos em arrays para evitar custo excessivo.
