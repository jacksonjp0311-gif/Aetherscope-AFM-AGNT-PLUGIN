/**
 * AetherScope AFM — Dashboard (primary entry point)
 * Tool type: aetherscop-afm-dashboard
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMDashboard {
  constructor() { this.name = 'aetherscop-afm-dashboard'; }

  async execute(params) {
    try {
      const args = [
        'run-single',
        '--input-path', params.input_path || '.',
        '--output-root', params.output_root || 'outputs',
        '--profile', params.profile || 'demo',
      ];
      if (params.config_path) args.push('--config', params.config_path);
      const out = await runPython(args);
      const result = parseOutput(out);
      return {
        run_id: result.run_id,
        output_root: result.output_root,
        metrics: result.metrics,
        visuals: result.visuals,
        ...result
      };
    } catch (e) {
      return { error: e.message || String(e) };
    }
  }
}

export default new AFMDashboard();
