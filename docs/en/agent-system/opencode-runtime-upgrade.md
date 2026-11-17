# Embedded OpenCode Runtime Upgrade Assessment (v1.17.7 → v1.19.6)

> Assessment date: 2026-11-18. For the manual upgrade procedure, see the "Built-in opencode version and manual update" section in the root `AGENTS.md`.

## Background

- The embedded Agent engine is a vendored opencode copy (`third_party/opencode/`), currently at **v1.17.7** (tag `v1.17.7`, commit `4ed4f74`).
- The upstream `https://github.com/anomalyco/opencode` latest release is **v1.19.6** (published 2026-11-17), 1787 commits ahead.
- This assessment cross-checks every product integration surface against the full diff between the two tags (about 2600 changed files).

## Conclusion

**The upgrade is feasible. Integration surfaces remain compatible; the main workload is re-applying bun patches.**

## Integration surface check (low risk)

| Surface | Finding |
|---|---|
| Skill system | Local `skills.paths` mounting, `SKILL.md` format, and the skill-as-command mechanism are unchanged; upstream only refactored internals (`escapeHtml`, LayerNode declaration) and improved remote skill cache refresh (versioned). Skills such as `plot-route` are unaffected |
| Config injection | Config parsing became more permissive: unknown top-level keys are now ignored instead of raising errors (`onExcessProperty: "ignore"`), making `OPENCODE_CONFIG_CONTENT` injection safer |
| SDK method surface | Client methods in `packages/sdk/js/src/v2/gen/sdk.gen.ts` are virtually unchanged; both `createOpencodeClient` entries (v1 and v2) keep their signatures |
| Event protocol | The backend handles runtime events by string duck-typing; every wire event name it relies on — `session.idle`, `session.status`, `session.error`, `message.part.updated`, `todo.updated`, `permission.asked`, `permission.replied` — is still in use upstream, none removed |
| Command system | Internal adjustments only; skills are still automatically exposed as commands |

## Main workload: bun patches (patches/)

Of the 12 patches, at least 3 no longer apply because their target dependencies were bumped:

| Patch file | Old version → new version | Verdict |
|---|---|---|
| `@ai-sdk%2Fgoogle@3.0.73.patch` | 3.0.73 → 3.0.108 | ❌ Must be redone |
| `@ai-sdk%2Fxai@3.0.82.patch` | 3.0.82 → 3.0.102 / 3.0.139 | ❌ Must be redone |
| `@ff-labs%2Ffff-bun@0.9.3.patch` | 0.9.x → 0.10.5 | ❌ Must be redone |
| `@modelcontextprotocol%2Fsdk@1.29.0.patch` | 1.29.0 → 1.29.0 | ✅ Applies as-is |
| `@npmcli%2Fagent@4.0.2.patch` | 4.0.2 → 4.0.2 | ✅ Applies as-is |
| `pacote@21.5.0.patch` | 21.5.0 → 21.5.0 | ✅ Applies as-is |
| `solid-js@1.9.10.patch` | 1.9.10 → 1.9.10 | ✅ Applies as-is |
| `virtua@0.49.1.patch` | 0.49.1 → unchanged | ✅ Applies as-is |
| `gcp-metadata@8.1.2.patch` and others | Not present in bun.lock diff | ✅ Expected to apply; confirm during install |

## Upgrade steps (execution log)

> **Execution result (2026-11-18)**: the upgrade is complete and verified. One important correction: the upstream fork maintains its own `patches/` set, and v1.19.6 ships updated patches (xai re-applied at 3.0.139, google still pinned at 3.0.73, fff-bun/virtua patches dropped along with their dependencies), so **the product side does not need to re-apply any patch manually** — the "broken patches" listed above are covered by the upstream patch set.

Actual execution and verification record:

1. Replaced `third_party/opencode/` with the v1.19.6 source (kept `RPG_AGENT_VENDOR.json`; upstream removed `infra/` and `sst.config.ts`).
2. `bun install --frozen-lockfile` passed (the first run's `tree-sitter-powershell` gyp error was transient — the `tree_sitter_powershell_binding.node` artifact was produced, and a re-run reported no changes).
3. `RPG_AGENT_VENDOR.json` and `THIRD_PARTY_NOTICES.txt` updated to 1.19.6 (commit `f4e363c`).
4. Root `package.json` dependencies bumped to `1.19.6`, lockfile refreshed.
5. `build-opencode-runtime.ts` hardcoded `OPENCODE_VERSION: "1.17.7"` (which produced a wrong binary version); it now reads the version from `sourceTag` in `RPG_AGENT_VENDOR.json`, eliminating version drift.
6. Local Bun upgraded from 1.4.0 to **1.4.4** (the upstream build script requires `^1.4.4`).
7. `npm run build:opencode-runtime` succeeded; `opencode.exe --version` reports **1.19.6** and the smoke test passed.
8. Full validation (the backend portion of `npm run check:local`, the full desktop suite, and key assertion files re-run individually):
   - backend 1191 cases / 54 failures, desktop 726 cases / 10 failures — compared file-by-file against a git-worktree baseline (pre-upgrade HEAD), the failure sets are **identical to before the upgrade** (environment-dependent asset copy, playtest runtime, migration cases), all pre-existing machine issues unrelated to the upgrade;
   - backend typecheck error count unchanged (16 pre-existing errors);
   - 38 opencode core cases (runtime/config/catalog) and 20 release-boundary cases all pass;
   - assertions on wire event names and the `--experimental-strip-types` launch flag are intact.

## Rollback plan

Tag git or record the current commit before upgrading; if an unresolvable patch conflict or runtime regression appears, restore `third_party/opencode/`, the root `package.json`, and the lockfile via `git checkout`.
