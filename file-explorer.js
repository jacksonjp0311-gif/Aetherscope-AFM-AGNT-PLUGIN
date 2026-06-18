import fs from 'fs';
import path from 'path';

export default {
  name: 'file-explorer',
  async execute(params) {
    try {
      const targetPath = path.resolve(params?.path || process.env.AGNT_DATA_DIR || process.cwd());
      const depth = Math.max(0, Math.min(10, Number(params?.depth || 1)));
      const recursive = String(params?.recursive ?? 'true').toLowerCase() === 'true';
      const filterPattern = params?.filter?.trim();

      if (!fs.existsSync(targetPath)) {
        return { success: false, error: `Path does not exist: ${targetPath}` };
      }
      if (!fs.statSync(targetPath).isDirectory()) {
        return { success: false, error: `Path is not a directory: ${targetPath}` };
      }

      function matchesFilter(name) {
        if (!filterPattern) return true;
        try {
          const regex = new RegExp(filterPattern.replace(/\\\*/g, '.*').replace(/\\\?/g, '.'), 'i');
          return regex.test(name);
        } catch {
          return name.includes(filterPattern);
        }
      }

      const directories = [];
      const files = [];

      function explore(currentPath, currentDepth) {
        let entries;
        try {
          entries = fs.readdirSync(currentPath, { withFileTypes: true });
        } catch (err) {
          return;
        }

        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          const relative = path.relative(targetPath, fullPath);

          if (entry.isDirectory()) {
            if (matchesFilter(entry.name)) {
              const stat = fs.statSync(fullPath);
              directories.push({
                name: entry.name,
                path: relative || '.',
                size: formatSize(stat.size),
                modified: stat.mtime.toISOString()
              });
            }
            if (recursive && currentDepth < depth) {
              explore(fullPath, currentDepth + 1);
            }
          } else if (entry.isFile()) {
            if (matchesFilter(entry.name)) {
              const stat = fs.statSync(fullPath);
              const ext = path.extname(entry.name).toLowerCase() || '(no extension)';
              files.push({
                name: entry.name,
                path: relative,
                size: formatSize(stat.size),
                modified: stat.mtime.toISOString(),
                extension: ext,
                isExecutable: isExecutableFile(entry.name)
              });
            }
          }
        }
      }

      explore(targetPath, 0);

      return {
        success: true,
        path: targetPath,
        directories: directories.sort((a, b) => a.name.localeCompare(b.name)),
        files: files.sort((a, b) => a.name.localeCompare(b.name)),
        error: ''
      };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function isExecutableFile(name) {
  const ext = path.extname(name).toLowerCase();
  const executableExts = ['.sh', '.bat', '.cmd', '.ps1', '.py', '.js', '.ts', '.jsx', '.tsx', '.pl', '.rb', '.go', '.rs', '.bin', '.out', '.exe'];
  return executableExts.includes(ext);
}