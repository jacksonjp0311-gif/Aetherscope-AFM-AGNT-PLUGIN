/**
 * AetherScope AFM — File Explorer
 * Tool type: aetherscop-afm-file-explorer
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

export default new AFMFileExplorer();
