import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export default {
  name: 'file-compress',
  async execute(params) {
    try {
      const source = path.resolve(params?.source || '');
      const format = params?.format || 'zip';
      const outputPath = params?.outputPath ? path.resolve(params.outputPath) : null;
      const level = Math.max(1, Math.min(9, Number(params?.level || 6)));

      if (!source || !fs.existsSync(source)) {
        return { success: false, error: `Source does not exist: ${source}` };
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseName = path.basename(source);
      const name = baseName === '.' ? 'archive' : baseName;

      let archivePath, command, args;

      if (process.platform === 'win32') {
        const zipPath = outputPath || path.join(path.dirname(source), `${name}-${timestamp}.zip`);
        if (format === 'zip') {
          command = 'powershell';
          args = ['-Command', `Compress-Archive -Path "${source}" -DestinationPath "${zipPath}" -Force`];
        } else {
          throw new Error('tar formats not supported on Windows without WSL');
        }
      } else {
        if (format === 'zip') {
          const zipPath = outputPath || path.join(path.dirname(source), `${name}-${timestamp}.zip`);
          command = 'zip';
          args = ['-q', '-r', '-9', zipPath, path.basename(source)];
          const cwd = path.dirname(source);
          const fileName = path.basename(source);
          execSync(`${command} -q -r${level === 9 ? '' : level === 1 ? '-1' : `-${level}`} "${zipPath}" "${fileName}"`, { cwd, stdio: 'pipe' });
        } else if (format === 'tar.gz') {
          const tarPath = outputPath || path.join(path.dirname(source), `${name}-${timestamp}.tar.gz`);
          command = 'tar';
          args = ['-czf', tarPath, '-C', path.dirname(source), path.basename(source)];
          if (level > 1) {
            args[1] = `-c${'z'.repeat(level > 5 ? 2 : 1)}f`;
          }
        } else if (format === 'tar.bz2') {
          const tarPath = outputPath || path.join(path.dirname(source), `${name}-${timestamp}.tar.bz2`);
          command = 'tar';
          args = ['-cjf', tarPath, '-C', path.dirname(source), path.basename(source)];
        } else {
          throw new Error(`Unsupported format: ${format}`);
        }
      }

      if (process.platform !== 'win32' && (format === 'zip' ? true : !execSync('which tar', { stdio: 'ignore' }))) {
        throw new Error('tar command not available');
      }

      const originalSize = fs.statSync(source).size;
      let archiveStat;
      try {
        archiveStat = fs.statSync(archivePath);
      } catch {
        archiveStat = null;
      }

      return {
        success: true,
        archivePath: archivePath || source,
        originalSize,
        compressedSize: archiveStat ? archiveStat.size : originalSize,
        ratio: archiveStat ? (1 - archiveStat.size / originalSize) * 100 : 0,
        error: ''
      };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};