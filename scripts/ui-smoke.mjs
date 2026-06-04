/**
 * Root entrypoint — delegates to frontend Playwright smoke test.
 * Usage: node scripts/ui-smoke.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const frontend = path.join(root, "..", "frontend");

const result = spawnSync("npm", ["run", "ui-smoke"], {
  cwd: frontend,
  stdio: "inherit",
  shell: true,
  env: { ...process.env },
});

process.exit(result.status ?? 1);
