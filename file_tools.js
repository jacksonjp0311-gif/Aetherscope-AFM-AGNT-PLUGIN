import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import openUrl from './open_url_tool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FileTools {
  constructor() { this.name = 'aetherscop-afm-file-tools'; }

  async execute(params) {
    try {
      const type = params.__tool_type || 'file-analyze';
      const base = path.resolve(__dirname, params.base_path || '.');

      if (type === 'file-explorer') {
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
        const re = new RegExp((params.pattern || '').replace(/\*/g, '.*').replace(/\?/g, '.'));
        const results = [];
        const walk = (dir) => {
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
        };
        walk(base);
        return { results };
      }

      if (type === 'file-analyze') {
        const raw = fs.readFileSync(path.resolve(__dirname, params.input_path));
        const headerEnd = raw.indexOf(41) + 1;
        const headerStr = raw.subarray(6, headerEnd).toString();
        const meta = eval('(' + headerStr.replace(/'/g, '"') + ')');
        return { path: params.input_path, exists: true, shape: meta.shape, dtype: meta.descr };
      }

      if (type === 'open-url') {
        return await openUrl.execute({ url: params.url, new: params.new });
      }

      return { error: 'Unknown type: ' + type };
    } catch (e) {
      return { error: e.message };
    }
  }
}

export default new FileTools();