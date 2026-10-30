// Reports Tailwind classes that are not in canonical form (VS Code lint
// "tailwindCSS.lint.suggestCanonicalClasses"). Usage: node scripts/canonical-classes.mjs [--fix]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tw = require("@tailwindcss/node");

const root = process.cwd();
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const designSystem = await tw.__unstable__loadDesignSystem(css, { base: root });

const dirs = ["app", "components", "data"];
const files = [];
for (const dir of dirs) {
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) files.push(full);
    }
  };
  if (fs.existsSync(dir)) walk(dir);
}

const classAttr = /(?:className|class)\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{'([^']*)'\})/g;

const findings = [];
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = classAttr.exec(content))) {
    const raw = match[1] ?? match[2] ?? match[3] ?? "";
    for (const cls of raw.split(/\s+/).filter(Boolean)) {
      if (cls.includes("${") || cls.includes("+")) continue;
      let canonical;
      try {
        canonical = designSystem.canonicalizeCandidates([cls], { rem: 16 })[0];
      } catch {
        continue;
      }
      if (canonical && canonical !== cls) findings.push({ file, cls, canonical });
    }
  }
}

for (const f of findings) console.log(`${f.file}: ${f.cls} -> ${f.canonical}`);
console.log(`\n${findings.length} non-canonical classes in ${files.length} files`);

if (process.argv.includes("--fix")) {
  let changed = 0;
  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    for (const f of findings.filter((x) => x.file === file)) {
      const re = new RegExp(`(?<![\\w\\[\\]-])${f.cls.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w\\[\\]-])`, "g");
      content = content.replace(re, f.canonical);
      changed++;
    }
    fs.writeFileSync(file, content);
  }
  console.log(`applied ${changed} replacements`);
}
