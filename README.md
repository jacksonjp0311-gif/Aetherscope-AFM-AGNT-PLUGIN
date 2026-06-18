# AetherScope AFM Plugin

## Overview
`aetherscop-afm` is an AGNT plugin that brings the [AetherScope-AFM](https://github.com/jacksonjp0311-gif/AetherScope-AFM) Python toolkit to AGNT. It provides tools for AFM volume preprocessing, harmonic field generation, metrics computation, dashboard visualization, and telemetry emission — all fully offline with zero external API calls.

## Features
- **Harmonic field analysis** of AFM volumes (T-frame sinusoidal modulation)
- **Metrics**: triad E/I/C, lambda_eff, barrier scale, curvature, omega correlation
- **Visualization**: Matplotlib PNG renders (volume, field, omega slices + histograms)
- **Ledger**: Append-only governance-ready runs with gratitude hashes
- **Zero dependencies**: Pure NumPy/Matplotlib/Pydantic/Typer stack

## Quick Start
```agnt
# 1) Preprocess an AFM volume
aetherscop-afm-preprocess --input-path data/sample.npy --clip-min 0 --clip-max 1.0 --superres 2

# 2) Build harmonic field
aetherscop-afm-harmonic-field --volume-path output/preprocessed.npy --T 8

# 3) Compute metrics
aetherscop-afm-metrics --volume output/field.npy --delta-phi output/delta_phi.npy --omega-base output/omega_base.npy

# 4) Generate full dashboard (visuals + ledger + telemetry)
aetherscop-afm-dashboard --input-path data/sample.npy --output-root outputs --profile demo

# 5) Run complete pipeline in one call
aetherscop-afm-run-single --input-path data/sample.npy --config configs/default.yaml --profile demo
```

## Tool Reference

### `aetherscop-afm-preprocess`
**Description**: Preprocess AFM volume — clip, normalize (min-max), superresolve
**Parameters**:
- `input_path` (required): Path to .npy AFM volume
- `clip_min`: Minimum clip value
- `clip_max`: Maximum clip value  
- `superres`: Superresolution upscaling factor (default: 1)
- `max_size`: Maximum allowed dimension (default: 128)

### `aetherscop-afm-harmonic-field`
**Description**: Build harmonic field tensor from volume
**Parameters**:
- `volume_path`: Path to preprocessed volume
- `T`: Number of harmonic frames (default: 8)

### `aetherscop-afm-metrics`
**Description**: Compute triad metrics, omega correlation, curvature
**Parameters**:
- `volume`: Path to volume data
- `delta_phi`: Path to delta phi (computed)
- `omega_base`: Path to base omega
- `omega_noisy`: Path to noisy omega (for correlation)

### `aetherscop-afm-dashboard`
**Description**: Full pipeline + PNG dashboards + ledger entries
**Parameters**:
- `input_path`: Input AFM volume path
- `output_root`: Root output directory (default: `outputs`)
- `config_path`: Optional YAML config
- `profile`: Config profile: `demo` or `real_afm` (default: `demo`)

### `aetherscop-afm-run-single`
**Description**: Complete single-volume analysis pipeline
**Parameters**:
- `input_path`: Input AFM volume
- `config`: YAML config path
- `profile`: Config profile (default: `default`)
- `output_root`: Override output root

### `aetherscop-afm-telemetry`
**Description**: Emit Codex-ready JSON telemetry from metrics
**Parameters**:
- `metrics_json`: Path to metrics JSON
- `output_path`: Output telemetry path

### `aetherscop-afm-ledger`
**Description**: Append governance ledger entry
**Parameters**:
- `output_root`: Output root directory
- `sample_id`: Sample identifier
- `run_id`: Run identifier
- `metrics`: Path to metrics JSON

## Architecture
```
inputs (AFM .npy) → load_and_canonicalize → preprocess (clip/norm/superres)
                   → build_harmonic_field (T-frame) → compute_delta_phi → compute_omega
                   → assemble_metrics → build_dashboard_run
                   → write_visuals (PNGs) + ledger (runs.jsonl) + telemetry (JSON)
```

## Output Structure
```
outputs/
├── profiles/
│   ├── demo/
│   │   ├── dashboard/<run_id>_<sample>_dashboard.png
│   │   ├── visuals/<run_id>/<sample>_volume_slice.png
│   │   ├── visuals/<run_id>/<sample>_field_slice.png
│   │   ├── visuals/<run_id>/<sample>_omega_slice.png
│   │   ├── visuals/<run_id>/<sample>_delta_phi_hist.png
│   │   ├── visuals/<run_id>/<sample>_fractal_trace.png
│   │   ├── state/<sample>_state.json
│   │   └── ledger/runs.jsonl
```

## Integration
- **asf-governed-evolution**: Governance gates before pipeline execution
- **open-url-toolkit**: Dashboard PNG viewing with iframe + external browser
- **ledger**: Append-only JSONL with timestamps, run IDs, metrics hashes

## Notes
- All processing is local/offline — no network calls
- Python dependencies: numpy, matplotlib, pyyaml, pydantic, typer
- The plugin wraps the AetherScope-AFM Python package, invoked via shell from AGNT's Node.js runtime