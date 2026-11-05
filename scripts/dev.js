import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const children = [
  spawn(process.execPath, ['src/index.js'], {
    cwd: resolve(projectRoot, 'server'),
    stdio: 'inherit',
  }),
  spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...process.argv.slice(2)], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
];

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  process.exitCode = exitCode;
  for (const child of children) {
    if (child.exitCode === null) child.kill();
  }
}

for (const child of children) {
  child.once('error', (error) => {
    console.error('Failed to start a development service:', error);
    stop(1);
  });
  child.once('exit', (code, signal) => {
    if (stopping) return;
    console.error(`A development service stopped (${signal ?? `exit code ${code}`}).`);
    stop(code ?? 1);
  });
}

process.once('SIGINT', () => stop());
process.once('SIGTERM', () => stop());
