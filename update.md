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

### Shell compatibility

The snippets below are POSIX/bash. This machine's integrated terminal runs **fish**, where two
things differ:

| bash         | fish            |
| ------------ | --------------- |
| `$?`         | `$status`       |
| `export X=1` | `set -x X 1`    |
| `VAR=x cmd`  | `env VAR=x cmd` |

Everything else used here (`$(...)`, `\` line continuation, `${VAR:-default}`, redirection)
works unchanged. If a command errors with a `fish:` prefix, translate it before retrying.

> Terminal output capture can be unreliable for long-running commands. When a command produces a
> lot of output, redirect it to a file (e.g. `> .upstream/lint.txt 2>&1`) and read the file.
> Never pipe an interactive command through `head`/`tail`/`grep`.

### Prerequisites

```bash
pnpm install        # required before lint/build; the repo may have no node_modules yet
```

---

## 0. Metadata

| Item                | Value                                                         |
| ------------------- | ------------------------------------------------------------- |
| Upstream repo       | `https://github.com/MetaCubeX/metacubexd`                     |
| Upstream local path | `$UPSTREAM_DIR` (set in Step 0, never hardcoded)              |
| Watched directory   | `packages/ui` (ignore everything else)                        |
| This repo's path    | `$REPO_DIR` (auto-detected via git)                           |
| Change log          | `CHANGELOG.md` (single source of truth for the baseline hash) |

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

# Scratch directory for diff artifacts and command logs (git-ignored).
SCRATCH="$REPO_DIR/.upstream"
mkdir -p "$SCRATCH"

printf 'UPSTREAM_DIR=%s\nREPO_DIR=%s\nLAST_SYNC_HASH=%s\nSCRATCH=%s\n' \
  "$UPSTREAM_DIR" "$REPO_DIR" "$LAST_SYNC_HASH" "$SCRATCH"
```

If `LAST_SYNC_HASH` is empty, the `CHANGELOG.md` heading format is wrong — fix it before continuing.

Fish equivalent for the baseline line:

```fish
set LAST_SYNC_HASH (grep -m1 -oE '^## [0-9]{4}-[0-9]{2}-[0-9]{2} — [0-9a-f]{7,40}' $REPO_DIR/CHANGELOG.md | grep -oE '[0-9a-f]{7,40}$')
```

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
git diff --stat "$LAST_SYNC_HASH"..HEAD -- packages/ui > "$SCRATCH/stat.txt"
git log --oneline "$LAST_SYNC_HASH"..HEAD -- packages/ui > "$SCRATCH/commits.txt"
tail -1 "$SCRATCH/stat.txt"; wc -l "$SCRATCH/commits.txt"
```

**Then write focused diff files.** A full `packages/ui` diff is easily 10k+ lines, so split it by
layer and read the files instead of dumping them to the terminal:

```bash
cd "$UPSTREAM_DIR"

# Everything (fallback reference)
git diff "$LAST_SYNC_HASH"..HEAD -- packages/ui > "$SCRATCH/ui.diff"

# Logic layer: stores / types / utils / composables / constants — read this first
git diff "$LAST_SYNC_HASH"..HEAD -- \
  packages/ui/stores packages/ui/types packages/ui/utils \
  packages/ui/composables packages/ui/constants > "$SCRATCH/logic.diff"

# Pages, components and layouts
git diff "$LAST_SYNC_HASH"..HEAD -- \
  packages/ui/pages packages/ui/components packages/ui/layouts > "$SCRATCH/pages.diff"

# i18n strings
git diff "$LAST_SYNC_HASH"..HEAD -- packages/ui/i18n/locales > "$SCRATCH/i18n.diff"
```

Then work through them in this order: `stat.txt` → `commits.txt` → `logic.diff` → `pages.diff` →
`i18n.diff` → `ui.diff` (only for anything still unexplained).

> Everything under `.upstream/` is git-ignored scratch space. Never commit it; delete it before
> committing (Step 7).

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

#### Special cases to watch for

These came up in past syncs and are easy to miss:

- **HTTP status handling**: a `DELETE` returning `204 No Content` must not chain `.json()` —
  parse only responses that have a body.
- **Removed / renamed persisted state**: this repo persists Zustand stores to `localStorage`. When
  upstream removes or renames a persisted field, add a `version` + `migrate` to the persist config
  so existing users' settings carry over instead of silently resetting. Also delete retired fields.
- **Removed enum members**: dropping a value from an enum also requires removing it from the
  `*_ORDER` array, its i18n keys, and any persisted-state migration.
- **Both locales**: every i18n change must be applied to `en.json` **and** `cn.json`, and keys
  removed upstream must be removed here too (grep for them afterwards).
- **Timeouts**: upstream may raise per-request timeouts for slow operations (profile validate /
  activate). Mirror the explicit `timeout` options rather than relying on the 15s default.
- **Error surfacing**: upstream has a helper to unwrap nested H3/ky error payloads. Reuse the
  equivalent (`src/utils/controlError.ts`) instead of `e.message`.
- **New `ControlFeature` values**: add them to the union in `src/types/control.ts` even if the
  feature itself is not implemented here, so feature gating stays type-safe.

### Step 4: Implement the changes in this repo

- Use the equivalent React + MUI + Zustand approach; do not copy Vue code verbatim.
- Prefer precise, surgical edits (search for the symbol, replace the minimal block). Do not
  rewrite whole files just to match upstream structure.
- Validate after changes:

```bash
cd "$REPO_DIR"
pnpm lint  > "$SCRATCH/lint.txt"  2>&1; echo "EXIT=$?" >> "$SCRATCH/lint.txt"
pnpm build > "$SCRATCH/build.txt" 2>&1; echo "EXIT=$?" >> "$SCRATCH/build.txt"
tail -3 "$SCRATCH/lint.txt" "$SCRATCH/build.txt"
```

Fish users: replace `$?` with `$status`.

`pnpm build` runs `tsc -b && vite build && npm run icon`, so it catches type errors as well as
bundle failures. Both must exit 0 before continuing.

Then run the [verification checklist](#3-verification-checklist).

### Step 5: Write to `CHANGELOG.md`

**A record must be written even if there are no code changes**, so the next run knows where to start.

Add the new entry **at the top of the entries section (newest first)**, directly after the
`---` separator. Step 0 reads the first hash it finds, so ordering matters.

Record format:

```markdown
## YYYY-MM-DD — <NEW_HASH short form>

- Upstream range: `<LAST_SYNC_HASH>` → `<NEW_HASH>` (`packages/ui`, <files> files, +<adds>/-<dels>)
- Summary: <what upstream did, with PR numbers when known>
- Changes in this repo:
  - `src/xxx/yyy.ts`: <what changed>
- Not synced: <what was explicitly ignored and why>
```

The file/line counts come from `tail -1 "$SCRATCH/stat.txt"` (Step 2).

- If **no changes are needed**, write:
  `Changes in this repo: none (upstream changes are framework/test/style only and do not affect behavior)`.
- Use the sync date for the date and the short hash of the upstream commit you synced to.
- The heading hash must be a real, full-or-short hex hash — Step 0 parses it back automatically,
  so do not leave placeholders behind.
- List every touched file, one bullet each, so the next run can see what was already handled.
- Under **Not synced**, be specific about what was skipped and why (framework/desktop-only, or a
  feature this dashboard does not implement). This prevents re-litigating the same diff next time.

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

### Step 7: Clean up and commit

Remove the scratch directory, then review what you are about to commit:

```bash
cd "$REPO_DIR"
rm -rf "$SCRATCH"
git status --short
```

Commit in **two commits** so docs and code are separable:

```bash
# 1. Documentation only (only when update.md / README / CHANGELOG were edited)
git add update.md README.md CHANGELOG.md .gitignore
git commit -m "docs: update upstream sync guide"

# 2. The actual sync
NEW_SHORT="$(cd "$UPSTREAM_DIR" && git rev-parse --short HEAD)"
git add -A
git commit -m "chore: sync upstream ui to $NEW_SHORT"
```

If Step 5 concluded no code changes were needed, commit just the `CHANGELOG.md` entry (fold it
into the docs commit) so the baseline still advances.

---

## 2. Upstream → This Repo Mapping

| Upstream `packages/ui`                  | This repo `src`                     | Notes                      |
| --------------------------------------- | ----------------------------------- | -------------------------- |
| `types/control.ts`                      | `src/types/control.ts`              | Mihomo control API types   |
| `types/index.ts`                        | `src/types/index.ts`                | Shared types               |
| `types/network.ts`                      | `src/types/network.ts`              | Network types              |
| `stores/*.ts`                           | `src/stores/*.ts`                   | Pinia → Zustand            |
| `composables/useApi.ts`                 | `src/lib/api.ts`                    | HTTP client                |
| `composables/useControlApi.ts`          | `src/lib/controlApi.ts`             | Control API wrapper        |
| `composables/useControlInfo.ts`         | `src/lib/controlInfo.ts`            | Kernel info                |
| `composables/useConnect.ts`             | `src/lib/connect.ts`                | Connection logic           |
| `composables/useWebSocket.ts`           | `src/lib/websocket.ts`              | WebSocket                  |
| `composables/useKeyboardShortcuts.ts`   | `src/hooks/useKeyboardShortcuts.ts` | Shortcuts                  |
| `utils/index.ts`                        | `src/utils/format.ts`               | Formatting                 |
| `utils/connectionCells.ts`              | `src/utils/connectionCells.ts`      | Connection table           |
| `utils/nodeScoring.ts`                  | `src/utils/nodeScoring.ts`          | Node scoring               |
| `utils/latencyTrend.ts`                 | `src/utils/latencyTrend.ts`         | Latency trend              |
| `utils/routingResources.ts`             | `src/utils/routingResources.ts`     | Routing resources          |
| `utils/controlError.ts`                 | `src/utils/controlError.ts`         | Control error unwrapping   |
| `components/connections/quickFilter.ts` | `src/utils/quickFilter.ts`          | Literal quick-filter terms |
| `utils/appearanceDb.ts`                 | `src/utils/appearanceDb.ts`         | Appearance storage         |
| `utils/db.ts`                           | `src/utils/db.ts`                   | Local storage              |
| `constants/index.ts`                    | `src/constants/index.ts`            | Constants                  |
| `constants/shortcuts.ts`                | `src/constants/shortcuts.ts`        | Shortcut definitions       |
| `i18n/locales/*.json`                   | `src/i18n/locales/*.json`           | Text                       |
| `pages/*.vue`                           | `src/pages/*.tsx`                   | Pages                      |
| `components/*.vue`                      | `src/components/**`                 | Components                 |
| `layouts/*.vue`                         | `src/components/layout/*`           | Layouts                    |

Present upstream but not implemented here: `config-editor` (Monaco), `NetworkTopology`,
`OnboardingWizard`, `DesktopSettingsPanel`, `WebdavBackup`, `KernelLogView`, and other heavy features.

---

## 3. Verification Checklist

Run after implementing, before writing the CHANGELOG entry:

- [ ] `pnpm lint` exits 0 (`tail -3 "$SCRATCH/lint.txt"`)
- [ ] `pnpm build` exits 0 (`tail -3 "$SCRATCH/build.txt"`)
- [ ] No leftover references to removed identifiers — grep the repo for each removed symbol
      (enum members, store fields, i18n keys):

      ```bash
          cd "$REPO_DIR"
          grep -rn 'REMOVED_SYMBOL' src/ || echo "clean"
          ```

- [ ] Every renamed/removed persisted store field has a `version` + `migrate` in its persist config
- [ ] `en.json` and `cn.json` have the same key set for every key you touched
- [ ] New `ControlFeature` values are in the union type even if unimplemented
- [ ] `get_errors` (or `tsc -b`) reports no errors in every edited file
- [ ] `.upstream/` scratch directory deleted
- [ ] `CHANGELOG.md` entry is the **newest** entry (directly under the first `---`)

---

## 4. FAQ

**Q: The diff is huge and I cannot finish it in one pass.**
Sync the "must sync" items first (API / types / constants / algorithms), record the "should sync"
items under "Not synced" in `CHANGELOG.md`, and continue next time. Still advance the baseline
hash to the current HEAD so the diff does not grow without bound.

**Q: Upstream changed a Vue component but the logic is identical.**
Sync only the logic and behavior; do not copy templates or styles.

**Q: How do I confirm upstream API field changes?**
Check the diff of `types/control.ts`, `stores/*`, and `composables/use*Api.ts` first, and compare
against the [Mihomo API docs](https://wiki.metacubex.one/api/).

**Q: A command produced no output or garbled output in the terminal.**
Redirect it to a file under `$SCRATCH` and read the file. Very long `git diff` output is not
useful on the terminal — always write it to a file and read it in chunks.

**Q: `pnpm lint` fails with "installing dependencies" / file-in-use errors.**
Run `pnpm install` first. On Windows, a stale editor or build process can lock files in
`node_modules`; close it and retry.

**Q: The build passes but the feature does not work.**
Check whether the upstream change depends on a desktop bridge / agent capability that this
lightweight dashboard does not have, and move it to "Not synced" rather than half-implementing it.
