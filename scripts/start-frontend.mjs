// Start the frontend (Next.js). Its .env is optional.
import { ensureDir, npmBin, run } from './_lib.mjs';

const frontend = ensureDir('frontend');

console.log('> Starting frontend...');
const child = run(npmBin, ['run', 'dev'], { cwd: frontend });
child.on('exit', (code) => process.exit(code ?? 0));
