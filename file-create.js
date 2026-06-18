import fs from 'fs';
import path from 'path';

export default {
  name: 'file-create',
  async execute(params) {
    try {
      const targetPath = path.resolve(params?.path || '');
      const type = params?.type || 'file';

      if (!targetPath) {
        return { success: false, error: 'path is required' };
      }

      if (type === 'directory') {
        fs.mkdirSync(targetPath, { recursive: true });
        return { success: true, path: targetPath, error: '' };
      }

      // File creation
      const content = params?.content || '';
      const permissions = params?.permissions ?? 420;

      fs.writeFileSync(targetPath, content);
      fs.chmodSync(targetPath, permissions);

      return { success: true, path: targetPath, error: '' };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};