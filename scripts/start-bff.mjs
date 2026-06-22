// Start the BFF. Guards on bff/.env because the app throws on missing secrets.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ensureDir, npmBin, run } from './_lib.mjs';

const bff = ensureDir('bff');

if (!existsSync(join(bff, '.env'))) {
  console.error('x bff/.env is missing — the BFF will fail to start without it.');
  console.error('  Set it up first:');
  console.error(`    cd ${bff}`);
  console.error('    cp .env.example .env');
  console.error('  then fill in SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

console.log('> Starting bff...');
const child = run(npmBin, ['run', 'dev'], { cwd: bff });
child.on('exit', (code) => process.exit(code ?? 0));
