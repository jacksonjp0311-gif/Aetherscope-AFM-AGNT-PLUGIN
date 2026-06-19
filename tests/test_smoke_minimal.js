// Standalone smoke test (no framework required)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// Define tests
test('manifest has 12 tools (11 core + open-url)', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  if (manifest.tools.length !== 12) throw new Error(`Expected 12 tools, got ${manifest.tools.length}`);
});

test('open-url tool is defined', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  const openUrlTool = manifest.tools.find(t => t.type === 'open-url');
  if (!openUrlTool) throw new Error('open-url tool not found');
  if (!openUrlTool.entryPoint || !openUrlTool.schema) throw new Error('open-url tool missing required fields');
});

test('file-explorer tool defined', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8'));
  const fe = manifest.tools.find(t => t.type === 'aetherscop-afm-file-explorer');
  if (!fe) throw new Error('file-explorer tool missing');
});

test('index.js has required functions', () => {
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
  if (!index.includes('function runPython')) throw new Error('runPython not found');
  if (!index.includes('process.on')) throw new Error('process.on handlers not found');
});

test('Python package files exist', () => {
  const files = [
    'src/aetherscope_afm/__init__.py',
    'src/aetherscope_afm/preprocess.py',
    'src/aetherscope_afm/field.py',
    'src/aetherscope_afm/transforms.py',
    'src/aetherscope_afm/metrics.py',
    'src/aetherscope_afm/ledger.py',
    'src/aetherscope_afm/visualize.py',
    'src/aetherscope_afm/cli.py',
    'src/aetherscope_afm/config.py',
    'src/aetherscope_afm/io.py',
    'src/aetherscope_afm/schemas.py'
  ];
  const root = path.join(__dirname, '..');
  for (const f of files) {
    const full = path.join(root, f);
    if (!fs.existsSync(full)) throw new Error(`Missing file: ${f}`);
  }
});

// Run tests
let passed = 0, failed = 0;
for (const t of tests) {
  try {
    t.fn();
    console.log('[PASS]', t.name);
    passed++;
  } catch (e) {
    console.log('[FAIL]', t.name, '-', e.message);
    failed++;
  }
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);