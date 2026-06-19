/**
 * AetherScope AFM — Ledger
 * Tool type: aetherscop-afm-ledger
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMLedger {
  constructor() { this.name = 'aetherscop-afm-ledger'; }

  async execute(params) {
    try {
      const args = ['ledger', '--output-root', params.output_root || 'outputs'];
      if (params.sample_id) args.push('--sample-id', params.sample_id);
      if (params.run_id) args.push('--run-id', params.run_id);
      if (params.metrics) args.push('--metrics', params.metrics);
      const out = await runPython(args);
      return { success: true, ...parseOutput(out) };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }
}

export default new AFMLedger();
