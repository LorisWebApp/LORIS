import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.join(root, 'LORIS-backend-hybrid-sessions');
const viteBin = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');

const children = [
  spawn(process.execPath, ['--watch', 'index.js'], {
    cwd: backendDir,
    stdio: 'inherit',
    env: process.env,
  }),
  spawn(process.execPath, [viteBin], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  }),
];

let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(code), 250).unref();
}

for (const child of children) {
  child.on('error', (error) => {
    console.error('Could not start a development server:', error);
    stopAll(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stopAll(code ?? 1);
  });
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
