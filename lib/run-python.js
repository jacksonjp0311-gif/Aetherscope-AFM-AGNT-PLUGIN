import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_SRC = path.join(__dirname, '..', 'src', 'aetherscope_afm');
const TIMEOUT_MS = 300_000;

export function buildEnv() {
  return { ...process.env, MPLBACKEND: 'Agg', AGNT_PLUGIN_NAME: 'aetherscop-afm' };
}

export function runPython(args) {
  return new Promise((resolve, reject) => {
    const cmd = 'python "' + path.join(PYTHON_SRC, 'cli.py') + '" ' +
      args.map(a => typeof a === 'string' ? '"' + a.replace(/"/g, '\\"') + '"' : a).join(' ');
    const child = exec(cmd, {
      cwd: PYTHON_SRC, timeout: TIMEOUT_MS, env: buildEnv(), maxBuffer: 10 * 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        reject({ error: 'PythonScriptError', message: error.message, stderr: stderr || '' });
        return;
      }
      if (stderr && stderr.trim()) console.warn('[Python stderr]', stderr.trim());
      resolve(stdout);
    });
    process.on('SIGTERM', () => { try { child.kill('SIGTERM'); } catch (e) { } });
    process.on('SIGINT', () => { try { child.kill('SIGINT'); } catch (e) { } });
  });
}

export function parseOutput(raw) {
  try { return JSON.parse(raw); } catch { return { raw_output: raw }; }
}
