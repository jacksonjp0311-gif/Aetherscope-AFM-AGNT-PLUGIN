import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export default {
  name: 'file-extract',
  async execute(params) {
    try {
      const archivePath = path.resolve(params?.archivePath || '');
      const destination = params?.destination ? path.resolve(params.destination) : null;
      const overwrite = String(params?.overwrite ?? 'false').toLowerCase() === 'true';
      const verify = String(params?.verify ?? 'true').toLowerCase() === 'true';

      if (!archivePath || !fs.existsSync(archivePath)) {
        return { success: false, error: `Archive does not exist: ${archivePath}` };
      }

      const ext = path.extname(archivePath).toLowerCase();
      const autoDest = destination || path.join(path.dirname(archivePath), path.basename(archivePath, ext));
      let dest = autoDest;

      if (!overwrite && fs.existsSync(dest)) {
        let counter = 1;
        while (fs.existsSync(`${dest}_${counter}`)) counter++;
        dest = `${dest}_${counter}`;
      }

      const isZip = ext === '.zip';
      const isTar = ['.tar', '.tar.gz', '.tar.bz2', '.tar.xz'].includes(ext);

      if (!isZip && !isTar) {
        return { success: false, error: `Unsupported archive format: ${ext}` };
      }

      if (process.platform === 'win32' && isTar) {
        throw new Error('Tar extraction on Windows requires WSL or third-party tools');
      }

      if (isZip) {
        if (process.platform === 'win32') {
          execSync(`powershell -Command "Expand-Archive -Path '${archivePath}' -DestinationPath '${dest}' -Force"`);
        } else {
          execSync(`unzip -o "${archivePath}" -d "${dest}" 2>/dev/null || true`);
        }
      } else {
        const cmd = ext === '.tar.gz' ? 'tar -xzf' : ext === '.tar.bz2' ? 'tar -xjf' : 'tar -xf';
        execSync(`${cmd} "${archivePath}" -C "${dest}"`);
      }

      if (verify) {
        const verifyResult = this._verifyExtraction(dest, archivePath);
        if (!verifyResult.ok) {
          return { success: false, error: `Verification failed: ${verifyResult.error}` };
        }
      }

      const extractedCount = this._countFiles(dest);

      return { success: true, destination: dest, fileCount: extractedCount, error: '' };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  },

  _verifyExtraction(dest, archivePath) {
    try {
      if (!fs.existsSync(dest)) return { ok: false, error: 'Extraction directory was not created' };
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || 'Verification error' };
    }
  },

  _countFiles(dir) {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        count += this._countFiles(full);
      } else {
        count++;
      }
    }
    return count;
  }
};