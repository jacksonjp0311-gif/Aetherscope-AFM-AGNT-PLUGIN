const { exec } = require('child_process');
const path = require('path');

const PYTHON_SRC = path.join(__dirname, '..', '..', '..', 'aetherscope_afm');
const TIMEOUT_MS = 300_000; // 5 minutes

function buildEnv() {
  return {
    ...process.env,
    // Force Agg backend and disable any display-related libraries
    MPLBACKEND: 'Agg',
    AGNT_PLUGIN_NAME: 'aetherscop-afm',
  };
}

function runPython(script, args) {
  return new Promise((resolve, reject) => {
    const cmd = `python3 "${script}" ${args.map(a => (typeof a === 'string' ? `"${a.replace(/"/g, '\\"')}"` : a)).join(' ')}`;
    const child = exec(cmd, { cwd: PYTHON_SRC, timeout: TIMEOUT_MS, env: buildEnv(), maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
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
      // Always surface stderr warnings as info, but don't reject on them
      if (stderr && stderr.trim().length > 0) {
        console.warn('[Python stderr]', stderr.trim());
      }
      resolve(stdout);
    });

    // Safety kill on shutdown signals
    process.on('SIGTERM', () => { try { child.kill('SIGTERM'); } catch {} });
    process.on('SIGINT', () => { try { child.kill('SIGINT'); } catch {} });
  });
}

function assertPythonResult(result) {
  if (result === null || result === undefined || result === '') {
    throw { error: 'EmptyPythonOutput', message: 'Python script produced no output' };
  }
  let parsed;
  try {
    parsed = JSON.parse(result);
  } catch (e) {
    throw { error: 'InvalidPythonJSON', message: 'Python output was not valid JSON', raw: result.slice(0, 500) };
  }
  // Basic payload shape validation
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw { error: 'InvalidPythonPayload', message: 'Python output JSON must be an object', shape: Object.prototype.toString.call(parsed) };
  }
  return parsed;
}

// Close all figures aggressively after every call (Agg backend still benefits)
function closeFigures() {
  try {
    const { execSync } = require('child_process');
    execSync('python3 -c "import matplotlib.pyplot as plt; plt.close(\"all\")"', { timeout: 15000 });
  } catch (e) {
    // ignore cleanup failures; Agg backend doesn't strictly require it
    console.debug('Figure cleanup warning:', e && e.message ? e.message : e);
  }
}

module.exports = {
  async preprocess({ input_path, clip_min, clip_max, superres = 1, max_size = 128 }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', input_path,
      '--profile', 'default',
      '--output-root', path.dirname(input_path),
      ...(clip_min !== undefined ? ['--overrides', `preprocess__clip_min=${clip_min}`] : []),
      ...(clip_max !== undefined ? ['--overrides', `preprocess__clip_max=${clip_max}`] : []),
      ...(superres > 1 ? ['--overrides', `preprocess__superres=${superres}`] : []),
      ...(max_size ? ['--overrides', `preprocess__max_size=${max_size}`] : []),
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  },

  async harmonicField({ volume_path, T = 8 }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', volume_path,
      '--profile', 'default',
      '--output-root', path.dirname(volume_path),
      '--overrides', `field__T=${T}`,
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  },

  async metrics({ volume, delta_phi, omega_base, omega_noisy }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', volume,
      '--profile', 'default',
      '--output-root', path.dirname(volume),
      ...(delta_phi ? ['--overrides', `metrics__delta_phi_path=${delta_phi}`] : []),
      ...(omega_base ? ['--overrides', `metrics__omega_base_path=${omega_base}`] : []),
      ...(omega_noisy ? ['--overrides', `metrics__omega_noisy_path=${omega_noisy}`] : []),
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  },

  async dashboard({ input_path, output_root = 'outputs', config_path, profile = 'demo' }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', input_path,
      '--profile', profile,
      '--output-root', output_root,
      ...(config_path ? ['--config', config_path] : []),
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  },

  async runSingle({ input_path, config, profile = 'default', output_root }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', input_path,
      '--profile', profile,
      '--output-root', output_root || path.dirname(input_path),
      ...(config ? ['--config', config] : []),
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  },

  async telemetry({ metrics_json, output_path }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', metrics_json,
      '--profile', 'default',
      '--output-root', path.dirname(output_path || metrics_json),
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  },

  async ledger({ output_root, sample_id, run_id, metrics }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', metrics,
      '--profile', 'default',
      '--output-root', output_root,
      '--overrides', `output__sample_id=${sample_id || ''}`,
      '--overrides', `output__run_id=${run_id || ''}`,
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  },

  async visualize({ volume_slice, field_slice, omega_slice, output_dir }) {
    const args = [
      'src/aetherscope_afm/cli.py', 'run-single',
      '--input-path', volume_slice || field_slice || omega_slice || '.',
      '--profile', 'demo',
      '--output-root', output_dir,
      '--overrides', `output__output_root=${output_dir}`,
    ];
    const out = await runPython(path.join(__dirname, '..', '..', '..', 'aetherscope_afm'), args);
    closeFigures();
    return assertPythonResult(out);
  }
};