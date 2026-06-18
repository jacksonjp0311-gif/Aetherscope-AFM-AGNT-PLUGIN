import fs from 'fs';
import path from 'path';

export default {
  name: 'file-search',
  async execute(params) {
    const startTime = Date.now();
    try {
      const rootPath = path.resolve(params?.rootPath || process.env.AGNT_DATA_DIR || process.cwd());
      const patterns = Array.isArray(params?.patterns) ? params.patterns : [params?.patterns || ''];
      const searchType = params?.type || 'all';
      const caseSensitive = String(params?.caseSensitive ?? 'false') === 'true';
      const includeHidden = String(params?.includeHidden ?? 'false') === 'true';
      const maxResults = Math.max(1, Math.min(1000, Number(params?.maxResults || 100)));

      if (!fs.existsSync(rootPath)) {
        return { success: false, error: `Root path does not exist: ${rootPath}` };
      }

      const results = [];
      let totalFilesSearched = 0;
      let totalMatches = 0;

      const flags = caseSensitive ? '' : 'i';

      function shouldInclude(dirName) {
        if (!includeHidden && (dirName.startsWith('.') || dirName.includes(path.sep + '.'))) {
          return false;
        }
        return true;
      }

      function searchDirectory(currentPath, relPath) {
        let entries;
        try {
          entries = fs.readdirSync(currentPath, { withFileTypes: true });
        } catch (err) {
          return;
        }

        for (const entry of entries) {
          const fullEntryPath = path.join(currentPath, entry.name);
          const currentRelPath = relPath ? path.join(relPath, entry.name) : entry.name;

          if (!includeHidden && (entry.name.startsWith('.') || entry.name.includes(path.sep + '.'))) {
            continue;
          }

          if (entry.isDirectory()) {
            if (shouldInclude(entry.name)) {
              searchDirectory(fullEntryPath, currentRelPath);
            }
            continue;
          }

          if (!entry.isFile()) continue;
          totalFilesSearched++;

          let fileContent = null;
          let matches = [];

          if (searchType === 'file' || searchType === 'all') {
            for (const pattern of patterns) {
              try {
                const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
                if (regex.test(entry.name)) {
                  matches.push({ type: 'filename', pattern, match: entry.name });
                }
              } catch (e) {
                // fallback
                if (entry.name.includes(pattern)) {
                  matches.push({ type: 'filename', pattern, match: entry.name });
                }
              }
            }
          }

          if ((searchType === 'content' || searchType === 'all') && matches.length === 0) {
            try {
              const ext = path.extname(entry.name).toLowerCase();
              const textExts = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.py', '.java', '.c', '.cpp', '.h', '.xml', '.yml', '.yaml', '.env', '.config', '.conf', '.log'];
              const readContent = ext === '.log' ? false : textExts.includes(ext);

              if (readContent) {
                fileContent = fs.readFileSync(fullEntryPath, 'utf8');
                for (const pattern of patterns) {
                  try {
                    const regex = new RegExp(pattern, flags);
                    let m;
                    const lineMatches = [];
                    const lines = fileContent.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                      if (regex.test(lines[i])) {
                        lineMatches.push(i + 1);
                      }
                    }
                    if (lineMatches.length > 0) {
                      matches.push({ type: 'content', pattern, lines: lineMatches });
                      // Build snippet
                      const start = Math.max(0, Math.min(lines.length - 1, lineMatches[0] - 2));
                      const end = Math.min(lines.length, start + 5);
                      const snippet = lines.slice(start, end).map((l, i) => {
                        const lineNum = start + i + 1;
                        return lineMatches.includes(lineNum) ? `> ${lineNum}: ${l}` : `  ${lineNum}: ${l}`;
                      }).join('\n');
                      totalMatches++;
                      if (results.length < maxResults) {
                        results.push({
                          path: currentRelPath,
                          type: 'file',
                          matches: matches,
                          snippet: snippet
                        });
                      }
                    }
                  } catch (e) {
                    // pattern failed, skip
                  }
                }
              }
            } catch (err) {
              // Can't read file, skip
            }
          }

          if (matches.length > 0 && searchType !== 'content') {
            totalMatches += matches.length;
            if (results.length < maxResults) {
              results.push({
                path: currentRelPath,
                type: 'file',
                matches: matches,
                snippet: ''
              });
            }
          }
        }
      }

      searchDirectory(rootPath, '');

      return {
        success: true,
        results: results.slice(0, maxResults),
        stats: {
          totalFilesSearched,
          totalMatches,
          searchTimeMs: Date.now() - startTime
        },
        error: ''
      };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};