const { exec } = require('child_process');
const path = require('path');
const openUrl = require('./open_url_tool');

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

module.exports = async function(input) {
  const type = input.__ragrant_type || input.type || 'dashboard';
  try {
    if (type === 'open-url') {
      return await openUrl.execute({ url: input.url, new: input.new });
    }
    const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
      'run-single',
      '--input-path', input.input_path || '.',
      '--profile', input.profile || 'demo',
      '--output-root', input.output_root || 'outputs',
    ]);
    return JSON.parse(out);
  } catch (e) {
    return { error: e.message || String(e), type };
  }
};
