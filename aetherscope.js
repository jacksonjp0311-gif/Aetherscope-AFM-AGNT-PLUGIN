const { execSync } = require('child_process');
const path = require('path');

const PYTHON_SRC = path.join(__dirname, 'src', 'aetherscope_afm');
const TIMEOUT_MS = 300_000;

function buildEnv() {
  return {
    ...process.env,
    MPLBACKEND: 'Agg',
    AGNT_PLUGIN_NAME: 'aetherscop-afm',
  };
}

function runPython(script, args) {
  return new Promise((resolve, reject) => {
    const cmd = `python3 "${script}" ${args.map(a => (typeof a === 'string' ? `"${a.replace(/"/g, '\\"')}"` : a)).join(' ')}`;
    const child = execSync(cmd, { cwd: PYTHON_SRC, timeout: TIMEOUT_MS, env: buildEnv(), maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const wrapped = {
          error: 'PythonScriptError',
          message: error.message,
          code: error.code || null,
          exitCode: error.code === 'ETIMEDOUT' ? -9 : (error.status || null),
          timedOut: error.timedOut || false,
          killed: error.killed || false,
          stdout: stdout || '',
          stderr: stderr || '',
        };
        reject(wrapped);
        return;
      }
      if (stderr && stderr.trim().length > 0) {
        console.warn('[Python stderr]', stderr.trim());
      }
      resolve(stdout);
    });
    process.on('SIGTERM', () => { try { child.kill('SIGTERM'); } catch {} });
    process.on('SIGINT', () => { try { child.kill('SIGINT'); } catch {} });
  });
}

function closeFigures() {
  try {
    const { execSync } = require('child_process');
    execSync('python3 -c "import matplotlib.pyplot as plt; plt.close(\\"all\\")"', { timeout: 15000 });
  } catch (e) {}
}

module.exports = async function (input) {
  const type = input.__ragrant_type || 'custom';
  try {
    if (type === 'preprocess') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single',
        '--input-path', input.input_path,
        '--profile', 'default',
        '--output-root', input.output_root || path.dirname(input.input_path),
        ...(input.clip_min !== undefined ? ['--overrides', `preprocess__clip_min=${input.clip_min}`] : []),
        ...(input.clip_max !== undefined ? ['--overrides', `preprocess__clip_max=${input.clip_max}`] : []),
        ...(input.superres !== undefined ? ['--overrides', `preprocess__superres=${input.superres}`] : []),
        ...(input.max_size !== undefined ? ['--overrides', `preprocess__max_size=${input.max_size}`] : []),
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'harmonic-field') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single', '--input-path', input.volume_path, '--profile', 'default',
        '--output-root', path.dirname(input.volume_path),
        ...(input.T !== undefined ? ['--overrides', `field__T=${input.T}`] : []),
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'metrics') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single', '--input-path', input.volume, '--profile', 'default',
        '--output-root', path.dirname(input.volume),
        ...(input.delta_phi ? ['--overrides', `metrics__delta_phi_path=${input.delta_phi}`] : []),
        ...(input.omega_base ? ['--overrides', `metrics__omega_base_path=${input.omega_base}`] : []),
        ...(input.omega_noisy ? ['--overrides', `metrics__omega_noisy_path=${input.omega_noisy}`] : []),
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'dashboard') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single', '--input-path', input.input_path, '--profile', input.profile || 'demo',
        '--output-root', input.output_root || 'outputs',
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'run-single') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single', '--input-path', input.input_path, '--profile', input.profile || 'default',
        '--output-root', input.output_root || path.dirname(input.input_path),
        ...(input.config ? ['--config', input.config] : []),
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'telemetry') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single', '--input-path', input.metrics_json, '--profile', 'default',
        '--output-root', path.dirname(input.output_path || input.metrics_json),
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'ledger') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single', '--input-path', input.metrics, '--profile', 'default',
        '--output-root', input.output_root,
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'visualize') {
      const out = await runPython(path.join(PYTHON_SRC, 'cli.py'), [
        'run-single', '--input-path', input.volume_slice || input.field_slice || input.omega_slice || '.',
        '--profile', 'demo',
        '--output-root', input.output_dir,
      ]);
      closeFigures();
      return JSON.parse(out);
    }
    if (type === 'file-explorer') {
      const fs = require('fs');
      const base = input.base_path || '.';
      const entries = [];
      for (const e of fs.readdirSync(base)) {
        const s = fs.statSync(path.join(base, e));
        if (e.endsWith('.npy')) entries.push({ name: e, size: s.size, type: 'npy' });
      }
      return { entries };
    }
    if (type === 'file-search') {
      const fs = require('fs');
      const base = input.base_path || '.';
      const re = new RegExp(input.pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
      const results = [];
      (function walk(dir) {
        for (const e of fs.readdirSync(dir)) {
          const full = path.join(dir, e);
          try {
            const s = fs.statSync(full);
            if (s.isDirectory() && !e.startsWith('.') && e !== 'node_modules' && e !== '__pycache__') walk(full);
            else if (re.test(e)) results.push(full);
          } catch {} // skip
        }
      })(base);
      return { results };
    }
    if (type === 'file-analyze') {
      const fs = require('fs');
      const p = path.join(PYTHON_SRC, input.input_path);
      if (!fs.existsSync(p)) throw new Error('File not found: ' + p);
      // crude header parse
      const raw = fs.readFileSync(p);
      const headerEnd = raw.indexOf(b')') + 1;
      const headerStr = raw.subarray(6, headerEnd).toString();
      const meta = eval('(' + headerStr.replace(/'/g, '"') + ')');
      const ext = raw.subarray(headerEnd, headerEnd + 4).toString();
      return {
        path: input.input_path,
        exists: true,
        shape: meta.shape,
        dtype: meta.descr,
        header_length: headerEnd,
      };
    }
    if (type === 'open-url') {
      const url = input.url;
      const title = input.title || 'AGNT Dashboard';
      const newWin = input.new !== undefined ? input.new : 1;
      // Use xdg-open on Linux, open on macOS, start on Windows
      let cmd;
      if (process.platform === 'darwin') cmd = `open "${url}"`;
      else if (process.platform === 'win32') cmd = `start "" "${url}"`;
      else cmd = `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null || true`;
      try {
        execSync(cmd, { timeout: 10000 });
        return { success: true, message: `Opened ${url}`, url };
      } catch (e) {
        return { success: false, error: e.message, url };
      }
    }
    return { error: 'Unknown type', type };
  } catch (e) {
    return { error: e.message || String(e), type, input };
  }
};