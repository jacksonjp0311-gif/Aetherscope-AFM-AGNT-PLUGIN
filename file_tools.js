/**
 * AetherScope AFM — File Tools
 * Tool types:
 *   aetherscop-afm-file-explorer
 *   aetherscop-afm-file-search
 *   aetherscop-afm-file-analyze
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AFMFileExplorer {
  constructor() { this.name = 'aetherscop-afm-file-explorer'; }

  async execute(params) {
    try {
      const base = path.resolve(__dirname, params.base_path || '.');
      const entries = [];
      for (const e of fs.readdirSync(base)) {
        try {
          const s = fs.statSync(path.join(base, e));
          entries.push({ name: e, size: s.size, isDir: s.isDirectory() });
        } catch (ex) { /* skip */ }
      }
      return { entries };
    } catch (e) {
      return { error: e.message };
    }
  }
}

class AFMFileSearch {
  constructor() { this.name = 'aetherscop-afm-file-search'; }

  async execute(params) {
    try {
      const base = path.resolve(__dirname, params.base_path || '.');
      const re = new RegExp((params.pattern || '').replace(/\\*/g, '.*').replace(/\\?/g, '.'));
      const results = [];
      const walk = (dir) => {
        let list;
        try { list = fs.readdirSync(dir); } catch (e) { return; }
        for (const e of list) {
          const f = path.join(dir, e);
          try {
            const s = fs.statSync(f);
            if (s.isDirectory() && !e.startsWith('.') && e !== 'node_modules' && e !== '__pycache__') walk(f);
            else if (re.test(e)) results.push(f);
          } catch (ex) { /* skip */ }
        }
      };
      walk(base);
      return { results };
    } catch (e) {
      return { error: e.message };
    }
  }
}

class AFMFileAnalyze {
  constructor() { this.name = 'aetherscop-afm-file-analyze'; }

  async execute(params) {
    try {
      const raw = fs.readFileSync(path.resolve(__dirname, params.input_path));
      const headerEnd = raw.indexOf(41) + 1;
      const headerStr = raw.subarray(6, headerEnd).toString();
      const meta = eval('(' + headerStr.replace(/'/g, '"') + ')');
      return { path: params.input_path, exists: true, shape: meta.shape, dtype: meta.descr };
    } catch (e) {
      return { error: e.message };
    }
  }
}

// Default export: file-explorer (first tool in this file)
export default new AFMFileExplorer();
