/**
 * AetherScope AFM — File Search
 * Tool type: aetherscop-afm-file-search
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default new AFMFileSearch();
