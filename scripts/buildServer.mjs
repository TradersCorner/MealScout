import { existsSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const serverIndex = path.resolve(repoRoot, "server", "index.ts");
const serverVite = path.resolve(repoRoot, "server", "vite.ts");
const distRoot = path.resolve(repoRoot, "dist");
const outDir = path.resolve(repoRoot, "dist", "server");

if (!existsSync(serverIndex) || !existsSync(serverVite)) {
  console.log(
    "[build:server] Skipping server build because server entry files are missing in this environment.",
  );
  process.exit(0);
}

const command = [
  "npm exec -- esbuild",
  `"${serverIndex}"`,
  `"${serverVite}"`,
  "--platform=node",
  "--packages=external",
  "--bundle",
  "--format=esm",
  `--outdir=\"${outDir}\"`,
].join(" ");

try {
  execSync(command, {
    cwd: repoRoot,
    stdio: "inherit",
  });
  // Backward-compatible entrypoint for environments still starting `node dist/index.js`.
  const compatEntry = path.resolve(distRoot, "index.js");
  writeFileSync(compatEntry, 'import "./server/index.js";\n', "utf8");
} catch (error) {
  process.exit(1);
}
