#!/usr/bin/env node
/**
 * shadcn/ui components arrive importing lucide-react; Peaches draws every
 * icon from react-icons (its Lucide set, `react-icons/lu`, is the same art).
 * This rewrites `import { XIcon, CheckIcon } from "lucide-react"` into
 * `import { LuX as XIcon, LuCheck as CheckIcon } from "react-icons/lu"`,
 * leaving the component bodies identical to upstream so later
 * `shadcn add --diff` runs stay readable.
 *
 * Run after `npx shadcn add <component>` in apps/web:
 *   npm run ui:icons --workspace apps/web
 * then uninstall the lucide-react the CLI added. Exits non-zero if an icon
 * has no react-icons counterpart.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(path.join(process.cwd(), 'package.json'));
const lu = require('react-icons/lu');

// lucide-react names whose react-icons export differs beyond the Icon suffix.
const RENAMED = { Loader2: 'LoaderCircle', MoreHorizontal: 'Ellipsis', MoreVertical: 'EllipsisVertical' };
const IMPORT = /import\s*\{([^}]*)\}\s*from\s*["']lucide-react["'];?/g;

function filesIn(target) {
  if (statSync(target).isFile()) return [target];
  return readdirSync(target, { recursive: true })
    .map((entry) => path.join(target, String(entry)))
    .filter((file) => /\.(tsx?|jsx?)$/.test(file));
}

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: shadcn-icons.mjs <file or directory>...');
  process.exit(2);
}

let failures = 0;
for (const file of targets.flatMap(filesIn)) {
  const source = readFileSync(file, 'utf8');
  const next = source.replace(IMPORT, (_match, names) => {
    const specifiers = names
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => {
        const base = name.replace(/Icon$/, '');
        const target = `Lu${RENAMED[base] ?? base}`;
        if (!(target in lu)) {
          console.error(`${file}: react-icons has no ${target} for ${name}`);
          failures += 1;
        }
        return `${target} as ${name}`;
      });
    return `import { ${specifiers.join(', ')} } from "react-icons/lu"`;
  });
  if (next !== source) {
    writeFileSync(file, next);
    console.log(`converted ${file}`);
  }
}
process.exit(failures ? 1 : 0);
