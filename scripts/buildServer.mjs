import { build } from "esbuild";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const serverIndex = path.resolve(repoRoot, "server", "index.ts");
const serverVite = path.resolve(repoRoot, "server", "vite.ts");
const outDir = path.resolve(repoRoot, "dist", "server");

if (!existsSync(serverIndex) || !existsSync(serverVite)) {
  console.log(
    "[build:server] Skipping server build because server entry files are missing in this environment.",
  );
  process.exit(0);
}

await build({
  entryPoints: [serverIndex, serverVite],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: outDir,
});
