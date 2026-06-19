import { spawn } from 'child_process';

class OpenUrlTool {
  constructor() { this.name = 'open-url'; }

  async execute(params) {
    try {
      const url = String(params?.url || '').trim();
      if (!url) throw new Error('url is required');
      const platform = process.platform;
      let cmd, args;
      if (platform === 'win32') { cmd = 'cmd'; args = ['/c', 'start', '""', url]; }
      else if (platform === 'darwin') { cmd = 'open'; args = [url]; }
      else { cmd = 'xdg-open'; args = [url]; }
      const child = spawn(cmd, args, { detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();
      return { success: true, url, platform, pid: child.pid, error: '' };
    } catch (error) {
      return { success: false, error: error?.message || String(error) };
    }
  }
}

export default new OpenUrlTool();