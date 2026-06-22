// Start the BFF. Seeds bff/.env from the example because the app throws on
// missing secrets; the placeholders boot, but sign-in needs real values.
import { ensureDir, ensureEnv, npmBin, run } from './_lib.mjs';

const bff = ensureDir('bff');

if (ensureEnv(bff)) {
  console.log('  ! Fill in SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  console.log('    with real values before signing in — the seeded placeholders only boot the server.');
}

console.log('> Starting bff...');
const child = run(npmBin, ['run', 'dev'], { cwd: bff });
child.on('exit', (code) => process.exit(code ?? 0));
