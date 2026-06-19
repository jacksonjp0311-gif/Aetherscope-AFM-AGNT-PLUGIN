/**
 * AetherScope AFM — Visualize
 * Tool type: aetherscop-afm-visualize
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMVisualize {
  constructor() { this.name = 'aetherscop-afm-visualize'; }

  async execute(params) {
    try {
      const args = ['visualize', '--output-dir', params.output_dir || 'outputs'];
      if (params.volume_slice) args.push('--volume-slice', params.volume_slice);
      if (params.field_slice) args.push('--field-slice', params.field_slice);
      if (params.omega_slice) args.push('--omega-slice', params.omega_slice);
      const out = await runPython(args);
      const result = parseOutput(out);
      return { visuals: result.visuals || result, ...result };
    } catch (e) {
      return { error: e.message || String(e) };
    }
  }
}

export default new AFMVisualize();
