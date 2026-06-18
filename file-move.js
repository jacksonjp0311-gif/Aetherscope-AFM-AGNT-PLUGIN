import fs from 'fs';
import path from 'path';

export default {
  name: 'file-move',
  async execute(params) {
    try {
      const source = path.resolve(params?.source || '');
      const destination = path.resolve(params?.destination || '');

      if (!source || !destination) {
        return { success: false, error: 'source and destination are required' };
      }
      if (!fs.existsSync(source)) {
        return { success: false, error: `Source does not exist: ${source}` };
      }

      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.renameSync(source, destination);

      return { success: true, path: destination, error: '' };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};