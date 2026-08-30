/**
 * npm run test:evidence -- TASK-NNN
 *
 * Runs vitest with the junit reporter and writes docs/implement/evidence/TASK-NNN-junit.xml.
 * Never hand-edit that XML — editing it is faking evidence.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const taskId = process.argv[2];
if (!taskId || !/^TASK-\d{3}$/.test(taskId)) {
  console.error('Usage: npm run test:evidence -- TASK-012');
  process.exit(1);
}

mkdirSync('docs/implement/evidence', { recursive: true });
const out = `docs/implement/evidence/${taskId}-junit.xml`;

const r = spawnSync(
  'npx',
  ['vitest', 'run', '--reporter=junit', `--outputFile=${out}`],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

if (r.status !== 0) {
  console.error(`\nTests are red — no evidence written for ${taskId}. Fix the tests first.`);
  process.exit(r.status ?? 1);
}
console.log(`\nWrote ${out}`);
