// Builds src/theme/tokens.css from src/theme/palette.json.
//   node scripts/generate-tokens.mjs           write the file
//   node scripts/generate-tokens.mjs --check   fail if the file is out of date (used by the build)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const palette = JSON.parse(readFileSync(join(root, 'src/theme/palette.json'), 'utf8'));
const out = join(root, 'src/theme/tokens.css');

const lines = [
  '/* GENERATED from palette.json by scripts/generate-tokens.mjs — edit the palette, not this file. */',
  ':root{',
  ...Object.entries(palette.colors).map(([name, value]) => `  --c-${name}:${value};`),
  '  /* short names the older stylesheets already use */',
  ...Object.entries(palette.aliases).map(([alias, target]) => `  --${alias}:var(--c-${target});`),
  ...Object.entries(palette.shadows).map(([name, value]) => `  --shadow-${name}:${value};`),
  '}',
  '',
];
const css = lines.join('\n');
if (process.argv.includes('--check')) {
  if (!existsSync(out) || readFileSync(out, 'utf8') !== css) {
    console.error('src/theme/tokens.css is out of date — run `npm run tokens`.');
    process.exit(1);
  }
  console.log('tokens.css is up to date');
} else {
  writeFileSync(out, css);
  console.log(`wrote ${out}`);
}
