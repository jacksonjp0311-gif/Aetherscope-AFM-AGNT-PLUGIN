/**
 * AetherScope AFM — Telemetry
 * Tool type: aetherscop-afm-telemetry
 */
import { runPython, parseOutput } from './lib/run-python.js';

class AFMTelemetry {
  constructor() { this.name = 'aetherscop-afm-telemetry'; }

  async execute(params) {
    try {
      const args = ['telemetry', '--metrics-json', params.metrics_json || '.'];
      if (params.output_path) args.push('--output-path', params.output_path);
      const out = await runPython(args);
      return { success: true, ...parseOutput(out) };
    } catch (e) {
      return { success: false, error: e.message || String(e) };
    }
  }
}

export default new AFMTelemetry();
