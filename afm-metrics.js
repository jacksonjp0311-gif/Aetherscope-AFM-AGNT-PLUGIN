/**
 * AetherScope AFM — Metrics
 * Tool type: aetherscop-afm-metrics
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMMetrics {
  constructor() { this.name = 'aetherscop-afm-metrics'; }

  async execute(params) {
    try {
      const args = ['metrics', '--volume', params.volume || '.'];
      if (params.delta_phi) args.push('--delta-phi', params.delta_phi);
      if (params.omega_base) args.push('--omega-base', params.omega_base);
      if (params.omega_noisy) args.push('--omega-noisy', params.omega_noisy);
      const out = await runPython(args);
      return parseOutput(out);
    } catch (e) {
      return { error: e.message || String(e) };
    }
  }
}

export default new AFMMetrics();
