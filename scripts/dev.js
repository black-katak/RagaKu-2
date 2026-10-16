#!/usr/bin/env node
/**
 * RagaKu dev launcher.
 *
 * Menjalankan backend FastAPI (uvicorn) dan Expo sekaligus dalam satu perintah:
 *   npm run dev
 *
 * Tanpa dependency tambahan — hanya memakai child_process bawaan Node.
 *
 * Argumen setelah "--" diteruskan ke Expo, mis:
 *   npm run dev -- --web
 *   npm run dev -- --android
 *
 * Variabel lingkungan opsional:
 *   SKIP_BACKEND=1   -> hanya menjalankan Expo (jika backend sudah jalan sendiri)
 *   PYTHON=python    -> override biner Python (default: python3)
 *   API_PORT=8000    -> port backend
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname ? path.resolve(__dirname, '..') : process.cwd();
const backendDir = path.join(root, 'backend');
const python = process.env.PYTHON || 'python3';
const apiPort = process.env.API_PORT || '8000';
const extraExpoArgs = process.argv.slice(2);

const children = [];
let shuttingDown = false;

function prefix(name, color) {
  return (line) => `\x1b[${color}m[${name}]\x1b[0m ${line}`;
}

function pipe(child, name, color) {
  const tag = prefix(name, color);
  const onData = (buf) => {
    buf
      .toString()
      .split('\n')
      .filter((l) => l.length > 0)
      .forEach((l) => process.stdout.write(tag(l) + '\n'));
  };
  child.stdout.on('data', onData);
  child.stderr.on('data', onData);
}

function startExpo() {
  const child = spawn('npx', ['expo', 'start', ...extraExpoArgs], {
    cwd: root,
    env: process.env,
    shell: process.platform === 'win32',
  });
  pipe(child, 'expo', '36'); // cyan
  children.push(child);
  child.on('exit', (code) => shutdown(code ?? 0));
}

function startBackend() {
  if (process.env.SKIP_BACKEND === '1') {
    console.log(prefix('dev', '33')('SKIP_BACKEND=1 -> backend tidak dijalankan.'));
    return false;
  }
  if (!fs.existsSync(backendDir)) {
    console.log(prefix('dev', '33')(`Folder backend tidak ditemukan di ${backendDir}; melewati backend.`));
    return false;
  }
  const envFile = path.join(backendDir, '.env');
  const args = ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', apiPort];
  if (fs.existsSync(envFile)) {
    args.push('--env-file', '.env');
  } else {
    console.log(
      prefix('dev', '33')('backend/.env belum ada — rencana AI akan 503. Salin dari .env.example lalu isi OPENROUTER_API_KEY.'),
    );
  }
  const child = spawn(python, args, {
    cwd: backendDir,
    env: process.env,
    shell: process.platform === 'win32',
  });
  pipe(child, 'api', '35'); // magenta
  child.on('error', (err) => {
    console.log(prefix('dev', '31')(`Gagal menjalankan backend (${python}): ${err.message}`));
    console.log(prefix('dev', '33')('Jalankan backend manual atau set PYTHON=... / SKIP_BACKEND=1.'));
  });
  children.push(child);
  return true;
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const c of children) {
    if (!c.killed) {
      try {
        c.kill('SIGTERM');
      } catch {
        /* ignore */
      }
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(prefix('dev', '32')('Menjalankan RagaKu (backend + Expo). Tekan Ctrl+C untuk berhenti.'));
startBackend();
startExpo();
