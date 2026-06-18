import fs from 'fs';
import path from 'path';

export default {
  name: 'file-analyze',
  async execute(params) {
    try {
      const filePath = path.resolve(params?.filePath || '');
      if (!filePath) {
        return { success: false, error: 'filePath is required' };
      }
      if (!fs.existsSync(filePath)) {
        return { success: false, error: `File does not exist: ${filePath}` };
      }
      if (!fs.statSync(filePath).isFile()) {
        return { success: false, error: `Path is not a file: ${filePath}` };
      }

      const analysisType = (params?.analysisType || 'auto').toLowerCase();
      const outputFormat = (params?.outputFormat || 'structured').toLowerCase();
      const customPatterns = params?.extractPatterns ? JSON.parse(params.extractPatterns) : [];

      const ext = path.extname(filePath).toLowerCase();
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('utf8');
      const lines = text.split('\n');

      if (analysisType === 'auto' || analysisType === 'code') {
        return analyzeCode(filePath, text, ext, outputFormat, customPatterns);
      } else if (analysisType === 'data') {
        return analyzeData(filePath, text, ext, outputFormat);
      } else if (analysisType === 'text') {
        return analyzeText(filePath, text, outputFormat);
      } else if (analysisType === 'csv') {
        return analyzeCSV(filePath, text, outputFormat);
      } else if (analysisType === 'json') {
        return analyzeJSON(filePath, text, outputFormat);
      } else if (analysisType === 'logs') {
        return analyzeLogs(filePath, text, outputFormat);
      }

      return { success: false, error: `Unknown analysis type: ${analysisType}` };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
};

function analyzeCode(filePath, text, ext, outputFormat, customPatterns) {
  const patterns = [
    { name: 'imports', regex: /^(import\s+.*?from\s+['"][^'"]+['"];?|require\(['"][^'"]+['"]\))/gm },
    { name: 'functions', regex: /^(?:async\s+)?function\s+\w+|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(|^\w+\s*=>|class\s+\w+|=>/gm },
    { name: 'classes', regex: /class\s+\w+/gm },
    { name: 'TODOs', regex: /(TODO|FIXME|HACK|XXX|NOTE):?/gi },
    ...customPatterns
  ];

  const results = patterns.map(p => {
    const matches = [...text.matchAll(p.regex)];
    return { pattern: p.name, count: matches.length, matches: matches.map(m => m[0].substring(0, 100)) };
  });

  const wordCount = text.split(/\s+/).filter(w => w.trim().length > 0).length;
  const complexity = calculateComplexity(text, ext);

  return {
    success: true,
    filePath,
    analysisType: 'code',
    outputFormat,
    analysis: {
      language: guessLanguage(ext, text),
      lines: text.split('\n').length,
      words: wordCount,
      characters: text.length,
      complexity,
      patterns: results.filter(r => r.count > 0),
      summary: summarizeCode(results, wordCount, complexity)
    }
  };
}

function analyzeData(filePath, text, ext, outputFormat) {
  const rows = text.trim().split('\n').filter(l => l.trim().length > 0);
  const headers = rows.length > 0 ? rows[0].split(',').map(h => h.trim()) : [];
  const dataRows = rows.slice(1);

  return {
    success: true,
    filePath,
    analysisType: 'data',
    outputFormat,
    analysis: {
      format: guessFormat(ext, text),
      rows: dataRows.length,
      columns: headers.length,
      headers: headers,
      sample: dataRows.slice(0, 5).map(r => r.substring(0, 200)),
      summary: `Data file with ${headers.length} columns and ${dataRows.length} rows`
    }
  };
}

function analyzeText(filePath, text, outputFormat) {
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const lines = text.split('\n');

  return {
    success: true,
    filePath,
    analysisType: 'text',
    outputFormat,
    analysis: {
      lines: lines.length,
      words: words.length,
      characters: text.length,
      averageWordLength: words.length > 0 ? (words.join('').length / words.length).toFixed(2) : '0',
      summary: `Text file: ${words.length} words, ${lines.length} lines`
    }
  };
}

function analyzeCSV(filePath, text, outputFormat) {
  const rows = text.trim().split('\n').filter(l => l.trim().length > 0);
  const headers = rows.length > 0 ? rows[0].split(',').map(h => h.trim()) : [];
  const dataRows = rows.slice(1);
  const columnStats = headers.map((h, i) => {
    const colValues = dataRows.map(r => r.split(',')[i] || '').filter(v => v.trim().length > 0);
    return { column: h, count: colValues.length, unique: [...new Set(colValues)].length };
  });

  return {
    success: true,
    filePath,
    analysisType: 'csv',
    outputFormat,
    analysis: {
      rows: dataRows.length,
      columns: headers.length,
      headers: headers,
      columnStats,
      summary: `CSV with ${headers.length} columns and ${dataRows.length} data rows`
    }
  };
}

function analyzeJSON(filePath, text, outputFormat) {
  try {
    const parsed = JSON.parse(text);
    return {
      success: true,
      filePath,
      analysisType: 'json',
      outputFormat,
      analysis: {
        type: Array.isArray(parsed) ? 'array' : typeof parsed,
        keys: typeof parsed === 'object' && parsed !== null ? Object.keys(parsed) : [],
        size: text.length,
        summary: `Valid JSON: ${typeof parsed} (${Array.isArray(parsed) ? parsed.length : 'object'})${Object.keys(parsed).length ? ', keys: ' + Object.keys(parsed).join(', ') : ''}`
      }
    };
  } catch (e) {
    return { success: false, error: 'Invalid JSON format' };
  }
}

function analyzeLogs(filePath, text, outputFormat) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const levels = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 };
  lines.forEach(l => {
    if (/\bERROR\b/i.test(l)) levels.ERROR++;
    else if (/\bWARN\b/i.test(l)) levels.WARN++;
    else if (/\bINFO\b/i.test(l)) levels.INFO++;
    else if (/\bDEBUG\b/i.test(l)) levels.DEBUG++;
  });

  return {
    success: true,
    filePath,
    analysisType: 'logs',
    outputFormat,
    analysis: {
      lines: lines.length,
      levels,
      summary: `Log file: ${levels.ERROR} errors, ${levels.WARN} warnings, ${levels.INFO} info, ${levels.DEBUG} debug`
    }
  };
}

function calculateComplexity(text, ext) {
  const loops = (text.match(/\b(for|while|do)\b/g) || []).length;
  const conditions = (text.match(/\b(if|else if|switch)\b/g) || []).length;
  const functions = (text.match(/\bfunction\b|\bconst\s+\w+\s*=\s*(?:async\s*)?\(|\bclass\b/g) || []).length;
  return { cyclomatic: loops + conditions + 1, functions, complexity: loops + conditions };
}

function guessLanguage(ext, text) {
  switch (ext) {
    case '.js': return 'JavaScript'; case '.jsx': return 'JavaScript (JSX)'; case '.ts': return 'TypeScript'; case '.tsx': return 'TypeScript (TSX)'; case '.py': return 'Python'; case '.java': return 'Java'; case '.c': return 'C'; case '.cpp': case '.cc': return 'C++'; case '.h': return 'C/C++ Header'; case '.go': return 'Go'; case '.rs': return 'Rust'; case '.php': return 'PHP'; case '.rb': return 'Ruby'; case '.sh': return 'Shell'; case '.ps1': return 'PowerShell'; case '.html': return 'HTML'; case '.css': return 'CSS'; default: return 'Unknown';
  }
}

function guessFormat(ext, text) {
  const lower = text.toLowerCase();
  if (ext === '.csv') return 'CSV';
  if (ext === '.json' || lower.includes('"') && lower.includes('{')) return 'JSON';
  return 'Text';
}

function summarizeCode(patterns, wordCount, complexity) {
  return {
    totalPatterns: patterns.reduce((s, p) => s + p.count, 0),
    wordCount,
    complexity,
    summary: `${patterns.reduce((s, p) => s + p.count, 0)} significant patterns found, ${wordCount} words, complexity score: ${complexity.complexity}`
  };
}