import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { viteSingleFile } from "vite-plugin-singlefile";

// `import.meta.dirname` instead of `__dirname`: the latter is unsupported by
// Vite's native config loader, which is becoming the default in a future major.
const rootDir = import.meta.dirname;

const pkg = JSON.parse(readFileSync(path.resolve(rootDir, "package.json"), "utf-8"));

function getCommitHash(): string {
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

const commitHash = getCommitHash();

export default defineConfig({
  base: "/ui/",
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: "inject-version",
      transformIndexHtml(html) {
        const meta = [
          `  <meta name="version" content="${pkg.version}" />`,
          commitHash ? `  <meta name="commit" content="${commitHash}" />` : "",
        ]
          .filter(Boolean)
          .join("\n");
        return html.replace("</head>", `${meta}\n  </head>`);
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
});
