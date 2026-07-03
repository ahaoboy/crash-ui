import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { readFileSync } from "node:fs";
import { viteSingleFile } from "vite-plugin-singlefile";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  base: "/ui/",
  plugins: [
    react(),
    viteSingleFile(),
    {
      name: "inject-version",
      transformIndexHtml(html) {
        return html.replace(
          "</head>",
          `  <meta name="version" content="${pkg.version}" />\n  </head>`,
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
