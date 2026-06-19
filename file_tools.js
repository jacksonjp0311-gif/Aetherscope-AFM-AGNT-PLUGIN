const fs = require('fs');
const path = require('path');
const openUrl = require('./open_url_tool');

const PYTHON_SRC = path.join(__dirname, 'src', 'aetherscope_afm');

module.exports = async function (input) {
  try {
    const type = input.__ragrant_type || input.type || 'file-analyze';

    if (type === 'file-explorer') {
      const base = path.resolve(PYTHON_SRC, '..', input.base_path || '.');
      const entries = [];
      try {
        for (const e of fs.readdirSync(base)) {
          const f = path.join(base, e);
          const s = fs.statSync(f);
          if (s.isFile()) entries.push({ name: e, size: s.size, type: path.extname(e) });
        }
      } catch (_) {}
      return { entries };
    }

    if (type === 'file-search') {
      const base = path.resolve(PYTHON_SRC, '..', input.base_path || '.');
      const re = new RegExp(input.pattern.replace(/\*/g, '.*').replace(/\?/g, '.'));
      const results = [];
      (function walk(dir) {
        let list;
        try { list = fs.readdirSync(dir); } catch { return; }
        for (const e of list) {
          const f = path.join(dir, e);
          try {
            const s = fs.statSync(f);
            if (s.isDirectory() && !e.startsWith('.') && e !== 'node_modules' && e !== '__pycache__') walk(f);
            else if (re.test(e)) results.push(f);
          } catch {}
        }
      })(base);
      return { results };
    }

    if (type === 'file-analyze') {
      const p = path.resolve(PYTHON_SRC, '..', input.input_path);
      if (!fs.existsSync(p)) return { exists: false, error: 'File not found' };
      const raw = fs.readFileSync(p);
      const headerEnd = raw.indexOf(41) + 1;
      const headerStr = raw.subarray(6, headerEnd).toString();
      const meta = eval('(' + headerStr.replace(/'/g, '"') + ')');
      return {
        path: input.input_path,
        exists: true,
        shape: meta.shape,
        dtype: meta.descr,
        header_length: headerEnd,
      };
    }

    if (type === 'open-url') {
      return await openUrl.execute({
        url: input.url,
        title: input.title,
        new: input.new,
      });
    }

    return { error: 'Unknown file tool type: ' + type };
  } catch (e) {
    return { error: e.message || String(e) };
  }
};