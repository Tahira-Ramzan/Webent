'use strict';
/** Runs the API and the Vite dev server together for local development. */
const { spawn } = require('node:child_process');

const children = [];

function run(name, command, args, colour) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' });
  const tag = `\u001b[${colour}m[${name}]\u001b[0m`;
  const pipe = (stream) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      for (const line of chunk.split('\n')) {
        if (line.trim()) console.log(`${tag} ${line}`);
      }
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);
  child.on('exit', (code) => {
    console.log(`${tag} exited with code ${code}`);
    shutdown(code ?? 0);
  });
  children.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('api', process.execPath, ['server/index.js'], '32');
run('web', process.execPath, ['node_modules/vite/bin/vite.js'], '35');
