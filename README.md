# AetherScope-AFM — AGNT Plugin

**Zero-dependency, offline AFM volumetric analysis for AGNT agents.**

![status](https://img.shields.io/badge/status-production-green)
![version](https://img.shields.io/badge/version-1.1.0-blue)
![license](https://img.shields.io/badge/license-MIT-purple)
![tests](https://img.shields.io/badge/tests-16/16_passing-brightgreen)

AetherScope-AFM is a production-grade AGNT plugin that brings **atomic force microscopy (AFM) volumetric analysis** directly into your agent workflows. It ingests 3D AFM volume data (.npy), lifts it into harmonic field tensors, computes triad metrics and curvature proxies, and emits publication-ready PNG visualizations, JSON telemetry, and append-only governance ledgers — **all running locally with zero external API calls.**

## Features

- **12 integrated tools** forming a complete AFM analysis pipeline
- **Pure Python scientific stack** — NumPy + Matplotlib, no ML/AI service dependencies
- **ES module architecture** — native AGNT plugin format with class-based tool definitions
- **Cross-platform** — Windows, macOS, Linux
- **Self-contained `.agnt` package** — 9.7 KB, installs in one click
- **30-second smoke tests** — 16/16 passing (8 Python + 8 Node)

## Tools (12)

| # | Tool | Description |
|---|------|-------------|
| 1 | `aetherscop-afm-preprocess` | Clip, normalize, superresolve AFM volumes |
| 2 | `aetherscop-afm-harmonic-field` | Build T-frame sinusoidal harmonic field tensor [T,X,Y,Z] |
| 3 | `aetherscop-afm-metrics` | Triad E/I/C, lambda_eff, curvature, omega correlation |
| 4 | `aetherscop-afm-dashboard` | Full pipeline: visuals + metrics + ledger + telemetry |
| 5 | `aetherscop-afm-run-single` | End-to-end single volume analysis |
| 6 | `aetherscop-afm-open-url` | Open URLs in system browser |
| 7 | `aetherscop-afm-telemetry` | Codex-ready JSON telemetry emission |
| 8 | `aetherscop-afm-ledger` | Append-only governance ledger with gratitude hashes |
| 9 | `aetherscop-afm-visualize` | PNG slices, histograms, and fractal traces |
| 10 | `aetherscop-afm-file-explorer` | Browse directories, list .npy volumes |
| 11 | `aetherscop-afm-file-search` | Grep/regex search across volume collections |
| 12 | `aetherscop-afm-file-analyze` | Quick metadata + shape + dtype summary |

## Quick Start

### Install

Download `aetherscop-afm.agnt` from the [releases page](https://github.com/jacksonjp0311-gif/Aetherscope-AFM-AGNT-PLUGIN/releases) and install via AGNT:

```bash
agnt plugins:install aetherscop-afm.agnt
```

Or from source:

```bash
cd backend/plugins/dev/aetherscop-afm
pip install -e .        # Python dependencies
node tests/test_smoke_minimal.js  # Verify Node tools
python -m pytest tests/ -v        # Verify Python pipeline
```

### Use from an Agent

```python
# Run full AFM analysis pipeline
result = await agent.tool("aetherscop-afm-dashboard", {
    input_path: "/path/to/afm_volume.npy",
    profile: "demo"
})

print(result.metrics.C_triad)       # Triad coherence
print(result.metrics.lambda_eff)    # Effective lambda
print(result.metrics.curvature)     # Phase curvature proxy
print(result.visuals)               # Dict of PNG file paths
```

### Run Pipeline Directly (CLI)

```bash
cd backend/plugins/dev/aetherscop-afm
python -c "
from aetherscope_afm.cli import run_pipeline
import numpy as np, tempfile
vol = np.random.rand(16,16,16).astype(np.float32)
with tempfile.TemporaryDirectory() as td:
    np.save(f'{td}/vol.npy', vol)
    result = run_pipeline(f'{td}/vol.npy', f'{td}/out', 'demo')
    for k,v in result['metrics'].items():
        print(f'{k}: {v:.6f}')
"
```

Output:
```
E_mean_abs_volume: 0.498082
I_mean_delta_phi: -0.004333
C_triad: -0.002149
lambda_eff: -0.004351
barrier_scale: 0.000000
curvature: 0.105385
omega_corvature: 0.994996
```

## Pipeline Data Flow

```
Input: AFM volume (.npy) [X,Y,Z]
  │
  ├─ preprocess_volume()          clip → normalize → superresolve
  │
  ├─ build_harmonic_field(T=8)    T-frame sinusoidal modulation → [T,X,Y,Z]
  │
  ├─ compute_delta_phi()          Phase gradient across T → [T-1,X,Y,Z]
  │
  ├─ compute_omega()              Angular frequency → [T-1,X,Y,Z]
  │
  ├─ inject_gaussian_noise()      Controlled noise injection for robustness testing
  │
  ├─ assemble_metrics()           E/I/C + lambda_eff + curvature + omega_correlation
  │
  ├─ write_visuals()              8 PNG files: slices + histograms + trace
  │
  ├─ append_jsonl()               Append-only runs.jsonl with gratitude hashes
  │
  └─ write_json()                 Telemetry: schema v1 with full metrics
```

## Market Place Listing

**Name:** AetherScope AFM  
**Category:** Science & Computing  
**Tags:** afm, microscopy, volumetric-analysis, harmonic-fields, scientific-computing  
**Size:** 9.7 KB  
**Dependencies:** numpy, matplotlib (auto-installed)  
**Runtime:** Python 3.9+, Node.js 18+

## License

MIT — [LICENSE](LICENSE)
