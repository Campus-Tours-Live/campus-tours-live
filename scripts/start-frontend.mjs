// Start the frontend (Next.js). Seeds .env from the example so the BFF rewrites
// (/auth/*, /api/*, /v1/*) are wired up; it still boots fine without it.
import { ensureDir, ensureEnv, npmBin, run } from './_lib.mjs';

const frontend = ensureDir('frontend');
ensureEnv(frontend);

console.log('> Starting frontend...');
const child = run(npmBin, ['run', 'dev'], { cwd: frontend });
child.on('exit', (code) => process.exit(code ?? 0));
