// Lets Node scripts import the site's TypeScript modules (src/**/*.ts) with "@/..." aliases and
// extensionless relative imports, using Node's built-in type stripping. Only plain .ts files
// work; modules that import JSX or Next.js internals cannot be loaded this way.
// Usage: node --import ./scripts/lib/register-ts.mjs <script>

import { existsSync, statSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = path.join(root, "src");

function findFile(base) {
  const candidates = [base, `${base}.ts`, path.join(base, "index.ts")];
  return candidates.find((file) => existsSync(file) && statSync(file).isFile()) ?? null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let base = null;
    if (specifier.startsWith("@/")) {
      base = path.join(src, specifier.slice(2));
    } else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith("file:")) {
      const parent = fileURLToPath(context.parentURL);
      if (parent.startsWith(src)) base = path.resolve(path.dirname(parent), specifier);
    }
    if (base) {
      const file = findFile(base);
      if (file?.endsWith(".ts")) {
        return { url: pathToFileURL(file).href, format: "module-typescript", shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});
