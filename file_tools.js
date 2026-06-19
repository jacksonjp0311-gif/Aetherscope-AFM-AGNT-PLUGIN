const fs = require('fs');
const path = require('path');

module.exports = async function(input) {
  try {
    const type = input.__ragrant_type || input.type;
    if (type === 'file-explorer') {
      const base = path.resolve(input.base_path || '.');
      const entries = [];
      for (const e of fs.readdirSync(base)) {
        try {
          const s = fs.statSync(path.join(base, e));
          entries.push({ name: e, size: s.size, isDir: s.isDirectory() });
        } catch(ex) {}
      }
      return { entries };
    }
    if (type === 'file-search') {
      const base = path.resolve(input.base_path || '.');
      const re = new RegExp((input.pattern || '').replace(/\*/g, '.*').replace(/\?/g, '.'));
      const results = [];
      (function walk(dir) {
        let list;
        try { list = fs.readdirSync(dir); } catch(e) { return; }
        for (const e of list) {
          const f = path.join(dir, e);
          try {
            const s = fs.statSync(f);
            if (s.isDirectory() && !e.startsWith('.') && e !== 'node_modules' && e !== '__pycache__') walk(f);
            else if (re.test(e)) results.push(f);
          } catch(ex) {}
        }
      })(base);
      return { results };
    }
    if (type === 'file-analyze') {
      const raw = fs.readFileSync(path.resolve(input.input_path));
      const headerEnd = raw.indexOf(41) + 1;
      const headerStr = raw.subarray(6, headerEnd).toString();
      const meta = eval('(' + headerStr.replace(/'/g, '"') + ')');
      return { path: input.input_path, exists: true, shape: meta.shape, dtype: meta.descr };
    }
    return { error: 'Unknown type: ' + type };
  } catch (e) {
    return { error: e.message };
  }
};
