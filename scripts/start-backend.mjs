// Start the backend: Postgres (docker) + Spring Boot.
import { ensureDir, mavenWrapper, run, runToEnd } from './_lib.mjs';

const backend = ensureDir('backend');

console.log('> Starting Postgres (docker compose up -d --wait)...');
try {
  await runToEnd('docker', ['compose', 'up', '-d', '--wait'], { cwd: backend });
} catch (e) {
  console.error('x Failed to start Postgres via docker. Is Docker running?');
  console.error(`  ${e.message}`);
  process.exit(1);
}

console.log('> Starting backend (Spring Boot)...');
const child = run(mavenWrapper(backend), ['spring-boot:run'], { cwd: backend });
child.on('exit', (code) => process.exit(code ?? 0));
