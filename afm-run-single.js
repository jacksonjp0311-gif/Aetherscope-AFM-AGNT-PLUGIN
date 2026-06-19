/**
 * AetherScope AFM — Run Single
 * Tool type: aetherscop-afm-run-single
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMRunSingle {
  constructor() { this.name = 'aetherscop-afm-run-single'; }

  async execute(params) {
    try {
      const args = [
        'run-single',
        '--input-path', params.input_path || '.',
        '--profile', params.profile || 'demo',
        '--output-root', params.output_root || 'outputs',
      ];
      if (params.config) args.push('--config', params.config);
      const out = await runPython(args);
      return { run_id: parseOutput(out).run_id, ...parseOutput(out) };
    } catch (e) {
      return { error: e.message || String(e) };
    }
  }
}

export default new AFMRunSingle();
