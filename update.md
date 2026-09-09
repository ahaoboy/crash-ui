# Upstream Sync Guide (update.md)

This repository (`crash-ui`) is a **lightweight React re-implementation** of the `packages/ui`
part of the upstream repository [MetaCubeX/metacubexd](https://github.com/MetaCubeX/metacubexd).

- Upstream stack: Nuxt 4 + Vue 3 + Pinia + Tailwind + Highcharts
- This repo's stack: React 19 + TypeScript + MUI + Zustand + Recharts + Vite

The two codebases are **not** the same, so you **cannot cherry-pick or copy files directly**.
Every sync requires: read the upstream diff → understand the semantic change → implement the
equivalent here → record it in `CHANGELOG.md`.

> No absolute paths or commit hashes are hardcoded in this document. Paths come from the
> variables defined in Step 0, and the baseline hash is read from `CHANGELOG.md` (the single
> source of truth).

---

## 0. Metadata

| Item | Value |
| --- | --- |
| Upstream repo | `https://github.com/MetaCubeX/metacubexd` |
| Upstream local path | `$UPSTREAM_DIR` (set in Step 0, never hardcoded) |
| Watched directory | `packages/ui` (ignore everything else) |
| This repo's path | `$REPO_DIR` (auto-detected via git) |
| Change log | `CHANGELOG.md` (single source of truth for the baseline hash) |

### Baseline hash

The last synced upstream commit is **not** stored here. It is read from the newest entry in
`CHANGELOG.md` (see Step 0), so there is only one place to maintain.

---

## 1. Sync Workflow

### Step 0: Define variables (no hardcoded paths)

Run this once per shell session, from inside this repository. Every command below uses these
variables. Override any of them via environment variables if your checkouts live elsewhere.

```bash
# This repo (crash-ui), auto-detected from the current git worktree.
REPO_DIR="$(git rev-parse --show-toplevel)"

# Upstream checkout (metacubexd). Defaults to a sibling directory next to this repo.
UPSTREAM_DIR="${UPSTREAM_DIR:-$(dirname "$REPO_DIR")/metacubexd}"
UPSTREAM_DIR="$(cd "$UPSTREAM_DIR" && pwd)"

# Baseline: the newest heading hash in CHANGELOG.md — the single source of truth.
# Anchored to "## <date> — <hash>" headings so other text cannot match by accident.
LAST_SYNC_HASH="$(grep -m1 -oE '^## [0-9]{4}-[0-9]{2}-[0-9]{2} — [0-9a-f]{7,40}' \
  "$REPO_DIR/CHANGELOG.md" | grep -oE '[0-9a-f]{7,40}$')"

printf 'UPSTREAM_DIR=%s\nREPO_DIR=%s\nLAST_SYNC_HASH=%s\n' \
  "$UPSTREAM_DIR" "$REPO_DIR" "$LAST_SYNC_HASH"
```

If `LAST_SYNC_HASH` is empty, the `CHANGELOG.md` heading format is wrong — fix it before continuing.

### Step 1: Pull the latest upstream code

```bash
cd "$UPSTREAM_DIR"
git fetch --all --tags
git checkout main
git pull
```

### Step 2: Generate the `packages/ui` diff

Only look at `packages/ui` to avoid noise from CI / Docker / release commits.

**First check the scope of changes (recommended first step):**

```bash
cd "$UPSTREAM_DIR"
git diff --stat "$LAST_SYNC_HASH"..HEAD -- packages/ui
```

**Then view the full diff:**

```bash
cd "$UPSTREAM_DIR"
git diff "$LAST_SYNC_HASH"..HEAD -- packages/ui > "$REPO_DIR/.upstream-ui.diff"
```

**Group by directory (more practical when there are many files):**

```bash
# Logic layer only: stores / types / utils / composables / constants
git diff "$LAST_SYNC_HASH"..HEAD -- packages/ui/stores packages/ui/types \
  packages/ui/utils packages/ui/composables packages/ui/constants

# Pages and components only
git diff "$LAST_SYNC_HASH"..HEAD -- packages/ui/pages packages/ui/components packages/ui/layouts

# i18n strings only
git diff "$LAST_SYNC_HASH"..HEAD -- packages/ui/i18n/locales

# List the upstream commits involved (with messages, to help prioritize)
git log --oneline "$LAST_SYNC_HASH"..HEAD -- packages/ui
```

> `.upstream-ui.diff` is ignored by `.gitignore`. It is a local temporary file — do not commit it.

### Step 3: Decide what needs to be synced

Use the mapping table below to locate the corresponding files in this repo, then evaluate each item:

1. **API / type changes** → `src/types/*`, `src/lib/api.ts`, `src/lib/controlApi.ts`
2. **State logic changes** → `src/stores/*`
3. **Utility / computation changes** → `src/utils/*`
4. **Constants / shortcuts changes** → `src/constants/*`
5. **Text changes** → `src/i18n/locales/{en,cn}.json`
6. **Page behavior / UI changes** → `src/pages/*`, `src/components/*`

Decision rules:

- **Must sync**: fields, request params, error codes, routes, constants, scoring/sorting
  algorithms, etc. that interact with the Mihomo / Clash API and affect correctness.
- **Should sync**: user-visible features, interactions, and text.
- **Can ignore**: pure Vue / Nuxt framework code, Tailwind classes, Nuxt-specific plugins,
  Docker, CI, `__tests__`, `e2e`, `public/config.js`, `monaco-setup`, and desktop (`desktop-*`)
  implementations — unless they expose a new API contract.

### Step 4: Implement the changes in this repo

- Use the equivalent React + MUI + Zustand approach; do not copy Vue code verbatim.
- Validate after changes:

```bash
cd "$REPO_DIR"
pnpm lint
pnpm build
```

### Step 5: Write to `CHANGELOG.md`

**A record must be written even if there are no code changes**, so the next run knows where to start.

Add the new entry **at the top of the entries section (newest first)**, directly after the
`---` separator. Step 0 reads the first hash it finds, so ordering matters.

Record format:

```markdown
## YYYY-MM-DD — <NEW_HASH short form>

- Upstream range: `<LAST_SYNC_HASH>` → `<NEW_HASH>` (`packages/ui`)
- Summary: <what upstream did>
- Changes in this repo:
  - `src/xxx/yyy.ts`: <what changed>
- Not synced: <what was explicitly ignored and why>
```

- If **no changes are needed**, write:
  `Changes in this repo: none (upstream changes are framework/test/style only and do not affect behavior)`.
- Use the sync date for the date and the short hash of the upstream commit you synced to.
- The heading hash must be a real, full-or-short hex hash — Step 0 parses it back automatically,
  so do not leave placeholders behind.

### Step 6: Record the new baseline

The new baseline is whatever you synced to. Get it from the upstream checkout — do not type it by
hand:

```bash
cd "$UPSTREAM_DIR"
NEW_HASH="$(git rev-parse HEAD)"
git log -1 --format='%H   # %ad %s' --date=short HEAD
```

Use this `NEW_HASH` as the heading of the entry from Step 5. `CHANGELOG.md` is the single source
of truth, so `LAST_SYNC_HASH` in Step 0 picks it up automatically next time — there is nothing to
update in this document.

### Step 7: Commit

```bash
cd "$REPO_DIR"
git add -A
git commit -m "chore: sync upstream ui to $(cd "$UPSTREAM_DIR" && git rev-parse --short HEAD)"
```

---

## 2. Upstream → This Repo Mapping

| Upstream `packages/ui` | This repo `src` | Notes |
| --- | --- | --- |
| `types/control.ts` | `src/types/control.ts` | Mihomo control API types |
| `types/index.ts` | `src/types/index.ts` | Shared types |
| `types/network.ts` | `src/types/network.ts` | Network types |
| `stores/*.ts` | `src/stores/*.ts` | Pinia → Zustand |
| `composables/useApi.ts` | `src/lib/api.ts` | HTTP client |
| `composables/useControlApi.ts` | `src/lib/controlApi.ts` | Control API wrapper |
| `composables/useControlInfo.ts` | `src/lib/controlInfo.ts` | Kernel info |
| `composables/useConnect.ts` | `src/lib/connect.ts` | Connection logic |
| `composables/useWebSocket.ts` | `src/lib/websocket.ts` | WebSocket |
| `composables/useKeyboardShortcuts.ts` | `src/hooks/useKeyboardShortcuts.ts` | Shortcuts |
| `utils/index.ts` | `src/utils/format.ts` | Formatting |
| `utils/connectionCells.ts` | `src/utils/connectionCells.ts` | Connection table |
| `utils/nodeScoring.ts` | `src/utils/nodeScoring.ts` | Node scoring |
| `utils/latencyTrend.ts` | `src/utils/latencyTrend.ts` | Latency trend |
| `utils/routingResources.ts` | `src/utils/rules.ts` / `src/utils/proxy.ts` | Routing resources |
| `utils/appearanceDb.ts` | `src/utils/appearanceDb.ts` | Appearance storage |
| `utils/db.ts` | `src/utils/db.ts` | Local storage |
| `constants/index.ts` | `src/constants/index.ts` | Constants |
| `constants/shortcuts.ts` | `src/constants/shortcuts.ts` | Shortcut definitions |
| `i18n/locales/*.json` | `src/i18n/locales/*.json` | Text |
| `pages/*.vue` | `src/pages/*.tsx` | Pages |
| `components/*.vue` | `src/components/**` | Components |
| `layouts/*.vue` | `src/components/layout/*` | Layouts |

Present upstream but not implemented here: `config-editor` (Monaco), `NetworkTopology`,
`OnboardingWizard`, `DesktopSettingsPanel`, `WebdavBackup`, `KernelLogView`, and other heavy features.

---

## 3. FAQ

**Q: The diff is huge and I cannot finish it in one pass.**
Sync the "must sync" items first (API / types / constants / algorithms), record the "should sync"
items under "Not synced" in `CHANGELOG.md`, and continue next time. Still advance the baseline
hash to the current HEAD so the diff does not grow without bound.

**Q: Upstream changed a Vue component but the logic is identical.**
Sync only the logic and behavior; do not copy templates or styles.

**Q: How do I confirm upstream API field changes?**
Check the diff of `types/control.ts`, `stores/*`, and `composables/use*Api.ts` first, and compare
against the [Mihomo API docs](https://wiki.metacubex.one/api/).
