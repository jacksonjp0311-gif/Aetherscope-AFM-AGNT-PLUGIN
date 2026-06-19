const fs = require('fs');
const path = require('path');
const BASE = path.join(__dirname, '..');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('[PASS]', name); passed++; }
  catch(e) { console.log('[FAIL]', name, '-', e.message); failed++; }
}

test('manifest has 12 tools', () => {
  const m = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'));
  if (m.tools.length !== 12) throw new Error('Expected 12, got ' + m.tools.length);
});

test('open-url tool present', () => {
  const m = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'));
  if (!m.tools.find(t => t.type === 'open-url')) throw new Error('open-url missing');
});

test('index.js has module.exports', () => {
  if (!fs.readFileSync(path.join(BASE, 'index.js'), 'utf8').includes('module.exports'))
    throw new Error('No module.exports');
});

test('open_url_tool.js has module.exports', () => {
  if (!fs.readFileSync(path.join(BASE, 'open_url_tool.js'), 'utf8').includes('module.exports'))
    throw new Error('No module.exports');
});

test('file_tools.js has module.exports', () => {
  if (!fs.readFileSync(path.join(BASE, 'file_tools.js'), 'utf8').includes('module.exports'))
    throw new Error('No module.exports');
});

test('all Python modules exist', () => {
  for (const f of ['__init__.py','preprocess.py','field.py','transforms.py','metrics.py',
                    'ledger.py','visualize.py','cli.py','config.py','io.py','schemas.py']) {
    if (!fs.existsSync(path.join(BASE, 'src', 'aetherscope_afm', f)))
      throw new Error('Missing: ' + f);
  }
});

test('test files exist', () => {
  if (!fs.existsSync(path.join(BASE, 'tests', 'test_aetherscope_smoke.py')))
    throw new Error('Missing test_aetherscope_smoke.py');
  if (!fs.existsSync(path.join(BASE, 'tests', 'test_smoke_minimal.js')))
    throw new Error('Missing test_smoke_minimal.js');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
