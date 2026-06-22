// Shared helpers for the dev launcher scripts.
// Pure Node built-ins — no dependencies, no `npm install` needed.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join, resolve } from 'node:path';
import { copyFileSync, existsSync } from 'node:fs';
import http from 'node:http';

export const isWin = process.platform === 'win32';

// scripts/ lives at <repo>/scripts; the service repos are siblings of <repo>,
// i.e. two levels up from this file.
const here = dirname(fileURLToPath(import.meta.url));
export const parentDir = resolve(here, '..', '..');

export const serviceDir = (name) => join(parentDir, name);

// Exit early with a clear message if a service repo isn't cloned as a sibling.
export function ensureDir(name) {
  const dir = serviceDir(name);
  if (!existsSync(dir)) {
    console.error(`x Cannot find ${name}/ (expected at ${dir})`);
    console.error('  Clone it next to campus-tours-live, or run: npm run clone-all');
    process.exit(1);
  }
  return dir;
}

// Seed <dir>/.env from <dir>/.env.example on first run so a fresh clone starts
// without a manual copy. Never overwrites an existing .env. Returns true when it
// just created the file, so callers can nudge about secrets that still need real
// values. No-ops (returns false) if the service has no .env.example.
export function ensureEnv(dir) {
  const env = join(dir, '.env');
  if (existsSync(env)) return false;
  const example = join(dir, '.env.example');
  if (!existsSync(example)) return false;
  copyFileSync(example, env);
  console.log(`> Created ${basename(dir)}/.env from .env.example`);
  return true;
}

// Maven wrapper / npm differ by platform; use the wrapper's absolute path so
// spawn resolves it against the service dir rather than PATH.
export const mavenWrapper = (backendDir) =>
  join(backendDir, isWin ? 'mvnw.cmd' : 'mvnw');
export const npmBin = isWin ? 'npm.cmd' : 'npm';

// Foreground child (individual start scripts): inherit stdio and share our
// process group so a terminal Ctrl-C reaches it directly.
export const run = (cmd, args, opts = {}) =>
  spawn(cmd, args, { stdio: 'inherit', ...opts });

// Run a command to completion; resolve on exit 0, reject otherwise.
export const runToEnd = (cmd, args, opts = {}) =>
  new Promise((res, rej) => {
    const c = spawn(cmd, args, { stdio: 'inherit', ...opts });
    c.on('error', rej);
    c.on('exit', (code) =>
      code === 0 ? res() : rej(new Error(`${cmd} exited with code ${code}`)),
    );
  });

// Background child for start-all: pipe output and prefix each line with a
// label. Detached on unix so we can later kill the whole process group.
export function runPrefixed(label, cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: !isWin,
    ...opts,
  });
  const pipe = (src, dst) => {
    let buf = '';
    src.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const ln of lines) dst.write(`[${label}] ${ln}\n`);
    });
    src.on('end', () => buf && dst.write(`[${label}] ${buf}\n`));
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  return child;
}

// Kill a child process tree cross-platform.
export function killTree(child) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  try {
    if (isWin) {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-child.pid, 'SIGINT'); // negative pid = whole process group
    }
  } catch {
    /* already gone */
  }
}

// Poll an HTTP endpoint until it returns 2xx, or until timeout (ms).
export function waitForHealth(url, { timeoutMs = 90_000, intervalMs = 1500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolveOuter) => {
    const tick = () => {
      const req = http.get(url, (r) => {
        r.resume();
        if (r.statusCode >= 200 && r.statusCode < 300) resolveOuter(true);
        else retry();
      });
      req.on('error', retry);
      req.setTimeout(2000, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() > deadline) resolveOuter(false);
      else setTimeout(tick, intervalMs);
    };
    tick();
  });
}
