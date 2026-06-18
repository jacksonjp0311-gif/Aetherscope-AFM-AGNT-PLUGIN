import fs from 'fs';
import path from 'path';

export default {
  name: 'file-copy',
  async execute(params) {
    try {
      const source = path.resolve(params?.source || '');
      const destination = path.resolve(params?.destination || '');
      const recursive = String(params?.recursive ?? 'true').toLowerCase() === 'true';

      if (!source || !destination) {
        return { success: false, error: 'source and destination are required' };
      }
      if (!fs.existsSync(source)) {
        return { success: false, error: `Source does not exist: ${source}` };
      }

      const copyItem = (src, dest) => {
        if (fs.statSync(src).isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            copyItem(path.join(src, entry.name), path.join(dest, entry.name));
          }
        } else {
          fs.copyFileSync(src, dest);
        }
      };

      copyItem(source, destination);

      let bytesCopied = 0;
      const calcSize = (p) => {
        let size = 0;
        const entries = fs.readdirSync(p, { withFileTypes: true });
        for (const e of entries) {
          const full = path.join(p, e.name);
          if (fs.statSync(full).isDirectory()) {
            size += calcSize(full);
          } else {
            size += fs.statSync(full).size;
          }
        }
        return size;
      };
      bytesCopied = calcSize(source);

      return { success: true, source, destination, bytesCopied, error: '' };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};