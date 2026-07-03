# Crash UI

Web dashboard for [Mihomo](https://github.com/MetaCubeX/mihomo) (Clash.Meta) proxy server.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173` and connect to your Mihomo backend (default `http://127.0.0.1:9090`).

## Build

```bash
pnpm build
```

Output in `dist/`. Deploy by editing `dist/config.js` to set the backend URL.

## Deploy

Replace `defaultBackendURL` in `dist/config.js`, then serve `dist/` with any static server:

```bash
npx serve dist
```

## Tech Stack

- React 19 + TypeScript
- MUI (Material UI)
- Zustand (state management)
- React Router (hash router)
- Recharts (charts)
- i18next (i18n, en + cn)
- Vite (bundler)

## Related

- [crash](https://github.com/ahaoboy/crash)
- [MetaCubeXD](https://github.com/MetaCubeX/metacubexd)
