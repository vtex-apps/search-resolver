# search-resolver

VTEX IO app (`vtex.search-resolver`) implementing the **GraphQL resolvers** for the catalog, search, and orders schema published by `vtex.search-graphql`. It powers PDP, PLP, autocomplete, and Intelligent Search storefront contracts.

This is the **resolver layer** of the search stack:

- Schema (the contract): `vtex.search-graphql`
- Resolvers (this app): `vtex.search-resolver`
- Backend HTTP wrapper: `vtex.intelligent-search-api`
- Storefront consumer: `vtex.search-result` (PLP), `vtex.delivery-promise-components` (postal/pickup)

> See [`AGENTS.md`](AGENTS.md) for the full architectural walkthrough.

---

## Prerequisites

- [Node.js 20](https://nodejs.org/) (managed via `.nvmrc` — use `nvm use`)
- [Yarn](https://yarnpkg.com/) (v1)
- [VTEX Toolbelt](https://github.com/vtex/toolbelt): `npm i -g vtex`
- An active VTEX account and development workspace: `vtex login <account>`

## How to run

Install dependencies and refresh VTEX IO typings:

```sh
make dev
```

Link the app to your development workspace:

```sh
make link
# or equivalently: make run
```

## How to test

Unit tests (Jest 29 + ts-jest, in `node/`):

```sh
make test
```

E2E tests run via the [`vtex/search-tests`](https://github.com/vtex/search-tests) Cypress suite on PR, against the `biggy` account (`vtex/action-io-app-cypress`).

Pre-PR gate (matches the repo's `yarn verify` script — lint + test):

```sh
make check
```

Coverage report:

```sh
make coverage
```

## How to publish

> ⚠️ These commands affect production. Always confirm the target account/workspace first.

```sh
vtex publish        # publishes a new app package to the registry
vtex deploy         # promotes a release candidate to stable
```

Version bumps use `vtex release <patch|minor|major> stable`.

## Documentation

- **Architecture and platform integration:** [`AGENTS.md`](AGENTS.md)
- **Domain glossary:** [`docs/glossary.md`](docs/glossary.md)
- **Data model:** [`docs/data-model.md`](docs/data-model.md)
- **SDD model guide:** [`docs/sdd/model-guide.md`](docs/sdd/model-guide.md)
- **Specs (multi-repo aggregator):** `is-io-specs/.specify/` — constitution, plans, tasks live in the parent
- **Schema-of-record:** [vtex/search-graphql](https://github.com/vtex-apps/search-graphql)
- **Changelog:** [`CHANGELOG.md`](CHANGELOG.md)
