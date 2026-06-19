import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
  if (!m.tools.find(t => t.type === 'aetherscop-afm-open-url')) throw new Error('open-url missing');
});

test('index.js has export default', () => {
  const src = fs.readFileSync(path.join(BASE, 'index.js'), 'utf8');
  if (!src.includes('export default')) throw new Error('No export default');
});

test('open_url_tool.js has export default', () => {
  const src = fs.readFileSync(path.join(BASE, 'open_url_tool.js'), 'utf8');
  if (!src.includes('export default')) throw new Error('No export default');
});

test('file_tools.js has export default', () => {
  const src = fs.readFileSync(path.join(BASE, 'file_tools.js'), 'utf8');
  if (!src.includes('export default')) throw new Error('No export default');
});

test('all 11 Python modules exist', () => {
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

test('package.json has type module', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(BASE, 'package.json'), 'utf8'));
  if (pkg.type !== 'module') throw new Error('package.json missing type: module');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);