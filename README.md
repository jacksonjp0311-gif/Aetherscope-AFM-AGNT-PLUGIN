# AetherScope-AFM AGNT Plugin

**Zero-dependency, offline AFM volumetric analysis for AGNT agents.**

## Tools (12)

| Tool | Description |
|------|-------------|
| aetherscop-afm-preprocess | Clip, normalize, superresolve AFM volumes |
| aetherscop-afm-harmonic-field | Build T-frame sinusoidal harmonic field tensor |
| aetherscop-afm-metrics | Triad E/I/C, lambda_eff, curvature, omega correlation |
| aetherscop-afm-dashboard | Full pipeline: visuals + metrics + ledger |
| aetherscop-afm-run-single | End-to-end single volume analysis |
| open-url | Open URLs in system browser |
| aetherscop-afm-telemetry | Codex-ready JSON telemetry |
| aetherscop-afm-ledger | Governance ledger with gratitude hashes |
| aetherscop-afm-visualize | PNG slices, histograms, traces |
| aetherscop-afm-file-explorer | Browse directories, list .npy volumes |
| aetherscop-afm-file-search | Grep/regex search across volumes |
| aetherscop-afm-file-analyze | Quick metadata + shape + dtype summary |

## Quick Start

    cd backend/plugins/dev/aetherscop-afm
    pip install -e .
    pytest tests/ -v
    node tests/test_smoke_minimal.js

## Dependencies

- Python >= 3.9, numpy, matplotlib, PyYAML, pydantic, typer
- Node.js >= 18

## License

MIT
