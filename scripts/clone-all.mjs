// Clone the three service repos as siblings of campus-tours-live.
import { existsSync } from 'node:fs';
import { parentDir, serviceDir, runToEnd } from './_lib.mjs';

const ORG = 'https://github.com/Campus-Tours-Live';
const repos = ['backend', 'bff', 'frontend'];

for (const name of repos) {
  if (existsSync(serviceDir(name))) {
    console.log(`- ${name} already exists, skipping`);
    continue;
  }
  console.log(`> Cloning ${name}...`);
  await runToEnd('git', ['clone', `${ORG}/${name}.git`], { cwd: parentDir });
}
console.log('> Done. All three services are now siblings of campus-tours-live.');
