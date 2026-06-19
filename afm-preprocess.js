/**
 * AetherScope AFM — Preprocess
 * Tool type: aetherscop-afm-preprocess
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMPreprocess {
  constructor() { this.name = 'aetherscop-afm-preprocess'; }

  async execute(params) {
    try {
      const args = ['preprocess', '--input-path', params.input_path || '.'];
      if (params.clip_min !== undefined) args.push('--clip-min', String(params.clip_min));
      if (params.clip_max !== undefined) args.push('--clip-max', String(params.clip_max));
      if (params.superres !== undefined) args.push('--superres', String(params.superres));
      if (params.max_size !== undefined) args.push('--max-size', String(params.max_size));
      const out = await runPython(args);
      return { success: true, ...parseOutput(out) };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }
}

export default new AFMPreprocess();
