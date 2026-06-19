/**
 * AetherScope AFM — Harmonic Field
 * Tool type: aetherscop-afm-harmonic-field
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMHarmonicField {
  constructor() { this.name = 'aetherscop-afm-harmonic-field'; }

  async execute(params) {
    try {
      const args = ['harmonic-field', '--volume-path', params.volume_path || '.'];
      if (params.T !== undefined) args.push('--T', String(params.T));
      const out = await runPython(args);
      return { success: true, ...parseOutput(out) };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }
}

export default new AFMHarmonicField();
