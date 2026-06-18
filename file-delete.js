import fs from 'fs';
import path from 'path';

export default {
  name: 'file-delete',
  async execute(params) {
    try {
      const targetPath = path.resolve(params?.path || '');
      const recursive = String(params?.recursive ?? 'true').toLowerCase() === 'true';
      const backup = String(params?.backup ?? 'false').toLowerCase() === 'true';

      if (!targetPath) {
        return { success: false, error: 'path is required' };
      }
      if (!fs.existsSync(targetPath)) {
        return { success: false, error: `Path does not exist: ${targetPath}` };
      }

      let backupPath = null;

      if (backup) {
        const backupDir = path.join(process.env.AGNT_DATA_DIR || process.cwd(), '.backup', String(Date.now()));
        backupPath = path.join(backupDir, path.basename(targetPath));
        fs.mkdirSync(backupDir, { recursive: true });
        fs.renameSync(targetPath, backupPath);
      }

      if (fs.statSync(targetPath).isDirectory()) {
        if (recursive) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
          fs.rmdirSync(targetPath);
        }
      } else {
        fs.unlinkSync(targetPath);
      }

      return { success: true, path: targetPath, backupPath, error: '' };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};