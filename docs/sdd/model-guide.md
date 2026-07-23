<!-- managed-by: golden-path v1 — generated from .agents/skills/golden-path/sdd-mode.md.
     Model references can drift as new Claude versions ship.
     Re-run `/golden-path apply` to refresh. -->
# SDD Model Guide

Reference model tiers for Spec-Driven Development (SDD) commands.

## Models per command

| Command | Tier | Reference model |
|---|---|---|
| `/speckit.constitution` | Tier 1 reasoning | Claude 4.7 Opus or higher |
| `/speckit.specify` | Tier 1 reasoning | Claude 4.7 Opus or higher |
| `/speckit.plan` | Tier 1 reasoning | Claude 4.7 Opus or higher |
| `/specification` | Tier 1 reasoning | Claude 4.7 Opus or higher |
| `/implementing` | Tier 1 reasoning | Claude 4.7 Opus or higher |
| `/speckit.clarify` | Standard execution | Claude 4.6 Sonnet or higher |
| `/speckit.tasks` | Standard execution | Claude 4.6 Sonnet or higher |
| `/speckit.analyze` | Standard execution | Claude 4.6 Sonnet or higher |
| `/speckit.implement` | Standard execution | Claude 4.6 Sonnet or higher |

## SDD approach for this repo

**Both modes apply per-task.**

- **SDD Lite** for everyday work: resolver tweaks, new fields wired to an existing schema entry, cache adjustments, bug fixes. Use `/specification` + `/implementing` from `vtex-agent-skills`.
- **SDD Full** when scope meets any of: effort > 5 days, high ambiguity, cross-team dependencies (especially with `vtex.search-graphql` schema changes, `vtex.intelligent-search-api`, or storefront blocks like `vtex.search-result`), significant architectural impact (new client, endpoint switch, breaking field shape), or involvement in critical PDP/PLP/autocomplete flows. Use the spec-kit pipeline.

## Multi-repo storage

This is one repo in the `is-io-specs` multi-repo workspace. SpecKit artifacts live at `is-io-specs/.specify/` and `is-io-specs/specs/`. See the [Multi-repo spec-kit extension](https://github.com/vtex/speckit-multi-repo).
