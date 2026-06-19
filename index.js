import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import openUrl from './open_url_tool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PYTHON_SRC = path.join(__dirname, 'src', 'aetherscope_afm');
const TIMEOUT_MS = 300_000;

function buildEnv() {
  return { ...process.env, MPLBACKEND: 'Agg', AGNT_PLUGIN_NAME: 'aetherscop-afm' };
}

function runPython(script, args) {
  return new Promise((resolve, reject) => {
    const cmd = 'python3 "' + script + '" ' + args.map(a =>
      typeof a === 'string' ? '"' + a.replace(/"/g, '\\"') + '"' : a).join(' ');
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
    process.on('SIGTERM', () => { try { child.kill('SIGTERM'); } catch(e) {} });
    process.on('SIGINT', () => { try { child.kill('SIGINT'); } catch(e) {} });
  });
}

class AetherScopeAFM {
  constructor() { this.name = 'aetherscop-afm'; }

  async execute(params) {
    const type = params.__tool_type || 'dashboard';
    try {
      if (type === 'open-url') {
        return await openUrl.execute({ url: params.url, new: params.new });
      }
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single',
        '--input-path', params.input_path || '.',
        '--profile', params.profile || 'demo',
        '--output-root', params.output_root || 'outputs',
      ]);
      return JSON.parse(out);
    } catch (e) {
      return { error: e.message || String(e), type };
    }
  }
}

export default new AetherScopeAFM();