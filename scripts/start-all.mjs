// Start all three services together. Ctrl-C once stops everything.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  ensureDir,
  mavenWrapper,
  npmBin,
  runPrefixed,
  runToEnd,
  killTree,
  waitForHealth,
} from './_lib.mjs';

const backend = ensureDir('backend');
const bff = ensureDir('bff');
const frontend = ensureDir('frontend');

if (!existsSync(join(bff, '.env'))) {
  console.error('x bff/.env is missing. Run: cp bff/.env.example bff/.env and fill in the required vars.');
  process.exit(1);
}

const children = [];
let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n# Shutting down all services...');
  for (const c of children) killTree(c);
  setTimeout(() => process.exit(0), 500);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// 1) Postgres + backend
console.log('> [backend] Starting Postgres...');
try {
  await runToEnd('docker', ['compose', 'up', '-d', '--wait'], { cwd: backend });
} catch (e) {
  console.error('x Failed to start Postgres via docker. Is Docker running?');
  console.error(`  ${e.message}`);
  process.exit(1);
}
console.log('> [backend] Starting Spring Boot...');
children.push(runPrefixed('backend', mavenWrapper(backend), ['spring-boot:run'], { cwd: backend }));

// 2) Wait for backend health. bff/frontend don't hard-depend on it at startup,
//    but waiting makes the one-command flow reliable.
console.log('... waiting for backend health (http://localhost:8080/actuator/health)');
const healthy = await waitForHealth('http://localhost:8080/actuator/health');
console.log(
  healthy
    ? '> backend is ready'
    : '! backend not ready (timed out); starting bff/frontend anyway',
);

// 3) bff + frontend
children.push(runPrefixed('bff', npmBin, ['run', 'dev'], { cwd: bff }));
children.push(runPrefixed('frontend', npmBin, ['run', 'dev'], { cwd: frontend }));

console.log('\n> All started.  frontend :3001  bff :4000  backend :8080  — press Ctrl-C to stop all.\n');

// If any service dies on its own, tear down the rest.
for (const c of children) {
  c.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`x a service exited (code ${code}); stopping the rest...`);
      shutdown();
    }
  });
}
