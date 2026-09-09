# Changelog

This file records how this repository stays in sync with `packages/ui` of the upstream
[MetaCubeX/metacubexd](https://github.com/MetaCubeX/metacubexd). See [update.md](./update.md)
for the sync workflow.

Format: `## YYYY-MM-DD — <short-hash>`, recording the upstream range, a summary, the changes
made in this repo, and any items not synced.

> Entries are ordered **newest first**. The sync workflow reads the first hash in this file to
> determine the baseline, so always insert new entries directly below the `---` separator.

---

## 2026-09-09 — 9978e328

- Upstream range: `16be6b9e` → `9978e328` (`packages/ui`, 103 files, +6661/-797)
- Summary: upstream shipped profile auto-update + refresh-and-apply (#2108),
  kernel rollback/recover escape hatches (#2109), delete-profile 204 fix (#2110),
  structured control error messages (#2121/#2138), canonical proxy-mode ordering
  (#2148), persistent active-profile marker (#2148), provider latency history
  reuse (#2138), literal quick-filter terms, removed `chipsMode` display mode,
  `DEFAULT_SCRIPT_CONTENT` seed, and regex→explicit-parsing refactors.
- Changes in this repo:
  - `src/types/control.ts`: added `ProfileMeta.updateInterval`/`baseProfileId`/
    `managedBy`/`editorStatus`/`active`; added `visual-config-editor` feature.
  - `src/lib/controlApi.ts`: added `rollbackKernel`/`recoverKernel`,
    `refreshAndActivateProfile`, `updateInterval` in `updateProfile`; fixed
    `deleteProfile` to not parse an empty 204 body; added profile timeouts;
    explicit `stripTrailingSlash`.
  - `src/lib/api.ts`: replaced backend-version regexes with explicit parsing
    (`backendVersionParts` + `-smart-` check).
  - `src/stores/kernel.ts`: added `rollback`/`recover` actions.
  - `src/stores/config.ts`: removed `stickyGroupHeader`; renamed
    `quickFilterRegex` → `quickFilterText`; added persist migration v1 for the
    removed `chipsMode` and the rename.
  - `src/stores/endpoint.ts`: explicit protocol rewrite for `wsEndpointURL`.
  - `src/stores/proxies.ts`: `pickLatencyHistory` now prefers series with a
    successful (delay > 0) probe.
  - `src/utils/format.ts`: explicit version parsing, `orderProxyModes`,
    non-regex `transformEndpointURL`/`formatIPv6`.
  - `src/utils/region.ts`: explicit `parseNodeRegion`, `trimEnd`, `replaceAll`
    in `encodeSvgForDataUri`.
  - `src/utils/quickFilter.ts` (new): literal quick-filter term parsing.
  - `src/utils/controlError.ts` (new): unwrap H3/ky nested error diagnostics.
  - `src/utils/routingResources.ts` (new): shared proxy/group field metadata.
  - `src/constants/index.ts`: removed `PROXIES_DISPLAY_MODE.CHIPS`,
    added `DEFAULT_SCRIPT_CONTENT`, `MOBILE_NAV_RESELECT_EVENT`.
  - `src/pages/ConnectionsPage.tsx`: quick filter uses literal terms.
  - `src/pages/ConfigPage.tsx`: modes normalized via `orderProxyModes`.
  - `src/pages/ProfilesPage.tsx`: active-profile badge from `active` flag,
    refresh-and-apply, script seed content, auto-update label, error surfacing.
  - `src/i18n/locales/{en,cn}.json`: removed `chipsMode`/`stickyGroupHeader`,
    renamed `quickFilterRegex` → `quickFilterText`, added profile/script keys.
- Not synced: `config-editor`/visual profile editor, `ProxyConfigEditor`,
  desktop tray/IPC (`useControlSync`, `desktop-*`), `NetworkTopology`,
  `OnboardingWizard`, `DesktopSettingsPanel`, `WebdavBackup`, `KernelLogView`,
  Monaco slim-import, last-week traffic range, mobile scroll-to-top and the
  mobile connection-details layout — either framework/desktop-specific or
  features this lightweight dashboard does not implement. `lastWeek` and
  `backToTop` i18n keys omitted for the same reason.

## 2026-07-01 — 16be6b9e

- Upstream range: baseline start `16be6b9e` (`chore(main): release 1.265.0 (#2100)`); no prior logged sync
- Summary: establish the sync baseline; future comparisons of `packages/ui` start from this hash
- Changes in this repo: none (baseline only)
- Not synced: N/A
