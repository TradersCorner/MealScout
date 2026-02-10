import fs from "node:fs";
import path from "node:path";

const roots = [path.resolve("client", "src")];
const extensions = new Set([".css", ".ts", ".tsx", ".js", ".jsx"]);

const patterns = [
  /#9ca3af/gi,
  /#6b7280/gi,
  /#64748b/gi,
  /#94a3b8/gi,
  /#cbd5e1/gi,
  /#e5e7eb/gi,
  /rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*0\.(5|6|7)\d?\s*\)/gi,
];

const walk = (dir, files = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(next, files);
    } else if (extensions.has(path.extname(entry.name))) {
      files.push(next);
    }
  }
  return files;
};

const report = [];

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const files = walk(root);
  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("--")) {
        return;
      }
      patterns.forEach((pattern) => {
        if (pattern.test(line)) {
          report.push({
            file,
            line: index + 1,
            match: line.trim(),
          });
        }
        pattern.lastIndex = 0;
      });
    });
  }
}

if (report.length === 0) {
  console.log("No hardcoded gray color matches found.");
  process.exit(0);
}

console.log("Hardcoded gray color matches:");
for (const item of report) {
  console.log(`${item.file}:${item.line} ${item.match}`);
}
