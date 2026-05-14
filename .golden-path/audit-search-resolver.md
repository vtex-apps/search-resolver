<!-- managed-by: golden-path v1 -->
# Golden Path Audit — search-resolver

**Date:** 2026-05-14  
**Mode:** audit (check)  
**SDD Mode (per-task):** Both — SDD Lite default; SDD Full for cross-team work (changes that flow through `search-graphql` schema and storefront blocks). Multi-repo: SpecKit at parent `is-io-specs/.specify/`.  
**Stack:** VTEX IO app — `vtex.search-resolver@1.102.2` — builders: `node` (7.x), `docs` (0.x)  
**App purpose:** GraphQL **resolver implementation** for the catalog/orders schema published by `vtex.search-graphql`. Powers PDP, PLP, and Intelligent Search storefront contracts. Settings flags: `slugifyLinks`, `shouldUseNewPDPEndpoint`, `shouldUseNewPLPEndpoint`.  
**Resolvers:** `node/resolvers/{benefits,search,stats}` (composed in `node/resolvers/index.ts`).  
**Clients:** `node/clients/{checkout,intelligent-search-api,intsch/,rewriter,search}.ts`.  
**Backend:** Node service (`@vtex/api`), TypeScript 5.1, Jest (cd `node`).  
**Runtime hint:** node 20 (CI hard-coded — no `.nvmrc`).  
**CI:** GitHub Actions (`pull-request.yml`) — `vtex/action-io-app-test@master`, `vtex/action-lint@master`, `vtex/action-io-app-cypress@v1` (Cypress against `vtex/search-tests` repo, `biggy` account).  
**Repo visibility:** PUBLIC (assumed `vtex-apps/search-resolver`).

## Compliance Audit

| Row | Status | Notes |
|---|---|---|
| `.editorconfig` | ⚠️ | exists, no `[Makefile]` section |
| `.env.example` | N/A | VTEX IO |
| `.devcontainer/devcontainer.json` | N/A | VTEX IO |
| `Makefile` | ❌ | absent — root `yarn verify` exists (`yarn lint && yarn test`); Makefile should wrap it as `make check` |
| `README.md` | ❌ | absent |
| AI guidance (`AGENTS.md` + symlinks) | ❌ | absent |
| `.agents/` layout | ❌ | absent |
| `docs/glossary.md` | ❌ | absent |
| `docs/data-model.md` | ❌ | absent |
| `docs/scope_of_work/` | N/A | multi-repo at parent |
| `.specify/memory/constitution.md` | N/A | PUBLIC repo — at parent |
| Coverage threshold | ❌ | `node/jest.config.js` likely has no `coverageThreshold`; `node/coverage/` dir already exists (baseline source) |
| CI lint job | ⚠️ | uses `vtex/action-io-app-test@master`, `vtex/action-lint@master` (unpinned); hard-coded `node-version: 20`; `actions/checkout@v4` and `actions/setup-node@v4` ✅, `actions/cache@v4` ✅; separate lint+test jobs ✅; Cypress correctly pinned to `@v1` ✅ |
| `.gitignore` spec-kit pattern | ⚠️ | lacks managed spec-kit block |
| SDD Lite skills | ❌ | per-machine |
| MCP configuration | ❌ | no `.mcp.json` |
| `CODEOWNERS` | ✅ | `.github/CODEOWNERS`: `* @vtex-apps/intelligent-search-apps` (matches requested handle) |
| `SECURITY.md` | ❌ | absent |
| Pre-commit hooks | ⚠️ | husky configured in `package.json` (`pre-commit`, `pre-push: yarn verify`); no checked-in `.husky/` dir |
| Renovate / Dependabot | ❌ | absent |

**AI Standards level:** L0 — No AI files  
**SDLC artifacts score:** ~2/16

### Extras (non-gating)
| Row | Status | Notes |
|---|---|---|
| Repo-scoped `SKILL.md` | ❌ | none |
| `product_vision.md` / `one-pager.md` | ❌ | absent |

## Drift signals
- VTEX action versions (`vtex/action-io-app-test@master`, `vtex/action-lint@master`) are unpinned — security/reproducibility drift.
- `node-version: 20` hard-coded in CI; `.nvmrc` missing.
- `node/yarn-error.log` is checked in (should be gitignored).

## Apply plan (when confirmed)
1. Patch `.editorconfig` to add `[Makefile] indent_style = tab`.
2. Write `.nvmrc` = `20`.
3. Write VTEX IO `Makefile` (`dev`, `lint`, `test` → cd node, `check` → `yarn verify`, `link`, `run`, `clean`).
4. Write `README.md` (Prerequisites / How to run / How to test — `cd node && yarn test` and Cypress reference / How to publish / Documentation).
5. Write `AGENTS.md`: resolver architecture, `intelligent-search-api` client, feature flags, Cypress E2E, schema-of-record at `vtex.search-graphql`.
6. Write `CLAUDE.md` symlink → `AGENTS.md`.
7. Write `SECURITY.md`.
8. Patch `pull-request.yml`: pin VTEX actions to a tag; replace hard-coded `node-version: 20` with `node-version-file: '.nvmrc'`.
9. Add `node/jest.config.js` `coverageThreshold.global.lines >= 60` (or baseline rounded down).
10. Add `.mcp.json` with GitHub MCP.
11. Append spec-kit `.gitignore` block; ensure `node/yarn-error.log` is ignored.
12. Add `.github/dependabot.yml` (npm at `/node` + github-actions at `/`).
13. Write `docs/glossary.md`, `docs/data-model.md`, `docs/sdd/model-guide.md`.
