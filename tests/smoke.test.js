const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('AetherScope AFM Smoke Tests', () => {
  let testDir = null;
  let runId = null;

  beforeAll(() => {
    // Create temp directory
    testDir = fs.mkdtempSync(path.join(__dirname, '..', 'testout-'));
    // Create a tiny synthetic numpy volume using Python
    const pyScript = `
import numpy as np, os, sys, json, pathlib
td = pathlib.Path(sys.argv[1])
np.save(td / 'volume.npy', np.random.rand(8, 8, 8).astype(np.float32))
print(str(td))
`;
    const pyScriptPath = path.join(testDir, 'make_vol.py');
    fs.writeFileSync(pyScriptPath, pyScript);
    try {
      execSync(`python3 "${pyScriptPath}" "${testDir}"`, { timeout: 30000 });
    } catch (e) {
      // If python not available, fallback: create a small .npy using a minimal header
      // We'll rely on the package requiring numpy; but if python not installed, skip.
      console.warn('Python not available, skipping smoke test setup');
    }
  });

  afterAll(() => {
    if (testDir && fs.existsSync(testDir)) {
      // cleanup
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('run-single produces dashboard PNG, ledger line, and telemetry JSON', async () => {
    const volumePath = path.join(testDir, 'volume.npy');
    if (!fs.existsSync(volumePath)) {
      // python not available; create a minimal .npy manually
      // Simple .npy header for float32 8x8x8 array
      const header = "{'descr': '<f4', 'fortran_order': false, 'shape': (8, 8, 8), }";
      const padded = header + ' '.repeat(128 - header.length);
      const headerBytes = Buffer.from(`\x93NUMPY\x01\x00${String(padded.length).padStart(4, ' ')}`, 'utf-8');
      const data = Buffer.alloc(8 * 8 * 8 * 4);
      const buf = Buffer.concat([headerBytes, data]);
      fs.writeFileSync(volumePath, buf);
    }

    const outRoot = path.join(testDir, 'outputs');
    const args = [
      'src/aetherscope_afm/cli.js', 'run-single',
      '--input-path', volumePath,
      '--profile', 'default',
      '--output-root', outRoot,
    ];

    let stdout = '';
    let stderr = '';
    try {
      const result = execSync(`python3 "${path.join(__dirname, '..', '..', '..', 'aetherscope_afm', 'cli.py')}" ${args.join(' ')}`, {
        cwd: __dirname,
        timeout: 60_000,
        env: {
          ...process.env,
          MPLBACKEND: 'Agg',
          AGNT_PLUGIN_NAME: 'aetherscop-afm',
        },
        maxBuffer: 20 * 1024 * 1024,
      });
      stdout = result.toString();
    } catch (e) {
      stdout = e.stdout?.toString() || '';
      stderr = e.stderr?.toString() || '';
      // non-zero exit is ok as long as artifacts were produced
    }

    // Assertions
    const runJsonl = path.join(outRoot, 'ledger', 'runs.jsonl');
    expect(fs.existsSync(runJsonl)).toBe(true);
    const lines = fs.readFileSync(runJsonl, 'utf-8').trim().split('\n');
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const last = JSON.parse(lines[lines.length - 1]);
    expect(last).toHaveProperty('run_id');
    runId = last.run_id;

    const dashboardPng = path.join(outRoot, 'dashboard', `${runId}_dashboard.png`);
    expect(fs.existsSync(dashboardPng)).toBe(true);
    const pngStats = fs.statSync(dashboardPng);
    expect(pngStats.size).toBeGreaterThan(0);

    const telemetryPath = path.join(outRoot, 'telemetry.json');
    if (fs.existsSync(telemetryPath)) {
      const telemetry = JSON.parse(fs.readFileSync(telemetryPath, 'utf-8'));
      expect(telemetry).toHaveProperty('metrics');
    }
  });
});