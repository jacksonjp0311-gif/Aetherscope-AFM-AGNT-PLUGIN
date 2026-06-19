const { spawn } = require('child_process');
const path = require('path');

function normalizeUrl(raw) {
  const url = String(raw || '').trim();
  if (!url) throw new Error('url is required');
  const lower = url.toLowerCase();
  const ok =
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('file:///') ||
    lower.startsWith('mailto:');
  if (!ok) {
    throw new Error('Unsupported URL scheme. Use http(s)://, file:///, or mailto:.');
  }
  if (url.includes('\n') || url.includes('\r')) throw new Error('Invalid url: contains newline characters');
  return url;
}

class OpenUrlTool {
  constructor() {
    this.name = 'open-url';
  }

  async execute(params) {
    try {
      const url = normalizeUrl(params?.url);
      const title = String(params?.title || '').trim();
      const newWin = Number(params?.new ?? 1);

      const platform = process.platform;
      let cmd, args;
      if (platform === 'win32') {
        cmd = 'cmd';
        args = ['/c', 'start', '""', url];
      } else if (platform === 'darwin') {
        cmd = 'open';
        args = [url];
      } else {
        cmd = 'xdg-open';
        args = [url];
      }

      const child = spawn(cmd, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();

      return {
        success: true,
        url,
        title,
        newWindow: newWin,
        platform,
        command: cmd,
        args,
        pid: child.pid,
        error: '',
      };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
}

module.exports = new OpenUrlTool();