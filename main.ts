// The Velvet Vault — the entry program.
// One job: hand the game in. It empties the output directory in place,
// copies game/ and screenshots/ from this repository into it, and writes
// the dossier the kit's library builds from those two directories.
//
// Run it as:  MAKEFUN_OUTPUT_DIR=out node main.ts
// (In the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used.)

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function emptyInPlace(dir: string): void {
  // Never remove the mounted output directory itself: clear its entries.
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function copyTree(name: string): number {
  const from = join(repoRoot, name);
  const to = join(outputDir, name);
  if (!existsSync(from)) {
    throw new Error(`main.ts: ${name}/ is missing from the repository at ${repoRoot}`);
  }
  cpSync(from, to, { recursive: true });
  return readdirSync(to, { recursive: true }).length;
}

emptyInPlace(outputDir);
const gameEntries = copyTree('game');
const shotEntries = copyTree('screenshots');

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`The Velvet Vault handed in to ${outputDir}`);
console.log(`game/: ${gameEntries} entries, screenshots/: ${shotEntries} entries`);
console.log(`dossier.json: ${dossier.length} bytes`);
