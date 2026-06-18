# AetherScope-AFM AGNT Plugin

**Zero-dependency, offline AFM volumetric analysis for AGNT agents.**

---

## 🚀 Overview

`aetherscop-afm` is an [AGNT](https://github.com/agnt-gg/agnt) plugin that brings the **AetherScope-AFM** Python toolkit to AGNT agents. It provides 11 production-grade tools for AFM (atomic force microscopy) volume preprocessing, harmonic-field generation, metric computation, visualization, ledger-based governance, and open‑url dashboard preview — all running locally, with no external API calls.

---

## 📦 Tools (11 total)

| Tool | Description |
|------|-------------|
| `aetherscop-afm-preprocess` | Clip, min–max normalize, and optional super‑resolution on AFM volumes (.npy) |
| `aetherscop-afm-harmonic-field` | Build a T‑frame sinusoidal harmonic field tensor from a volume |
| `aetherscop-afm-metrics` | Compute triad metrics (E/I/C), lambda_eff, curvature, and omega correlation |
| `aetherscop-afm-dashboard` | Full pipeline: preprocess → field → metrics → visuals + ledger + telemetry |
| `aetherscop-afm-run-single` | End‑to‑end single‑volume analysis pipeline with configurable profile |
| `aetherscop-afm-telemetry` | Emit Codex‑ready JSON telemetry from computed metrics |
| `aetherscop-afm-ledger` | Append governance‑ready ledger entries with gratitude hashes |
| `aetherscop-afm-visualize` | Generate Matplotlib PNGs: slices, histograms, trace overlays |
| `aetherscop-afm-file-explorer` | Browse directories and list .npy AFM volumes |
| `aetherscop-afm-file-search` | Grep/regex search across volume collections |
| `aetherscop-afm-file-analyze` | Quick metadata + shape + dtype summary of volumes |

All tools accept and return JSON‑serializable payloads, making them ideal for AGNT agent workflows.

---

## ⚙️ Quick Start

### Install the plugin

```bash
cd "C:\Users\jacks\OneDrive\Desktop\agnt-evo\backend\plugins\dev\aetherscop-afm"
npx agnt plugins:install file://.
```

> Note: AGNT must be able to execute `python3` with the following packages available in the working environment: `numpy`, `matplotlib`, `PyYAML`, `pydantic`, `typer`.

### Run a single analysis (CLI)

```bash
# Using the AGNT tool interface
aetherscop-afm-run-single \
  --input-path data/sample.npy \
  --profile demo
```

### Using from within an agent

```agnt
# Preprocess
await use_tool("aetherscop-afm-preprocess", {
  input_path: "/path/to/volume.npy",
  clip_min: 0.0,
  clip_max: 1.0,
  superres: 2,
});

# Build harmonic field
await use_tool("aetherscop-afm-harmonic-field", {
  volume_path: "/path/to/preprocessed.npy",
  T: 8,
});

# Generate dashboard (opens in browser via open-url-toolkit)
await use_tool("aetherscop-afm-dashboard", {
  input_path: "/path/to/volume.npy",
  profile: "demo",
});
```

---

## 🔐 Governance Profiles

The plugin supports three profiles via `--profile`:

| Profile | Gating | Use case |
|---------|--------|----------|
| `fixture` | None | Fast local dev and unit tests |
| `demo` | Advisory only | Demonstrations; logs gratitude hash to ledger |
| `production` | Requires `asf::governance_evaluate` | Regulated pipelines; approval recorded in ledger |

Governance integration uses the ASF‑R `asf-governed-evolution` plugin. When a governed profile is used and the policy requires approval, AGNT will pause and present an **Authorize** button.

---

## 📊 Observability

- **Structured logs**: JSON lines written to stdout via `pino` (`{ts, level, msg, op, traceId, runId, ...}`)
- **Telemetry**: Codex‑ready schema v1 with plugin version, Python package version, and metrics
- **Health endpoints** (when running as a service):
  - `GET /health` — `{status, checks:{python,policies:{governance,openUrl}}}`
  - `GET /metrics` — counters: runsStarted/Completed/Failed, ledgerAppends
- **Trace correlation**: every run carries a `traceId` that is included in logs and telemetry

---

## 🧪 Testing

### Python smoke test

```bash
cd "C:\Users\jacks\OneDrive\Desktop\agnt-evo\backend\plugins\dev\aetherscop-afm"
pytest tests/test_aetherscope_smoke.py -v
```

Generates a synthetic volume, runs the full pipeline, and asserts:
- Dashboard PNG exists and is non‑empty
- Ledger line contains matching `run_id`
- Telemetry JSON is valid

### Node smoke test

```bash
npm run test:node
```
(Jest harness that spawns the Python package and validates outputs.)

---

## 🔧 Architecture

- **Node.js wrapper** (`index.js`): launches `python3 src/aetherscope_afm/cli.py` via a defended subprocess (5‑minute timeout, 10 MiB buffer, `MPLBACKEND=Agg`). All Python stdout/stderr is captured; errors are surfaced as structured JSON back to AGNT. Figures are explicitly closed after each run to prevent leaks.
- **Python package** (`src/aetherscope_afm/`): pure NumPy/Matplotlib/Typer stack. No external API calls.
- **Open‑URL Toolkit**: dashboard PNGs can be previewed inside AGNT with the native `navigator.share`/open‑url authorize flow.
- **Governance**: ASF‑R policy profiles gate execution; ledger entries are append‑only and include gratitude hashes.

---

## 📁 Repository Map

```
aetherscop-afm/
├── manifest.json          # 11 AGNT tool definitions
├── index.js               # Defensive Node subprocess wrapper
├── package.json           # Metadata + test scripts
├── pyproject.toml         # Locked Python dependencies
├── README.md              # This file
├── src/aetherscope_afm/   # Python package
│   ├── cli.py             # Typer CLI (run-single, run-batch)
│   ├── preprocess.py      # clip / normalize / superres
│   ├── field.py           # build_harmonic_field
│   ├── transforms.py      # delta_phi, omega, slices, noise
│   ├── metrics.py         # triad E/I/C, lambda_eff, correlation
│   ├── ledger.py          # append_jsonl governance ledger
│   ├── visualize.py       # Matplotlib PNG generators
│   ├── config.py          # Pydantic‑like configs + profiles
│   ├── io.py              # .npy loader
│   └── schemas.py         # Dataclass run schemas
├── tests/
│   ├── test_aetherscope_smoke.py  # pytest
│   └── smoke.test.js              # Jest
└── test_package.py        # Quick Python sanity check
```

---

## 🔐 Security & Reproducibility

- Python dependencies are **frozen** in `pyproject.toml` (`numpy>=1.24,<2.0`, etc.)
- The Python submodule is pinned to a commit SHA (see `src/aetherscope_afm/` git history)
- Optional `--profile production` requires explicit governance approval via `asf-governed-evolution`
- `MPLBACKEND=Agg` ensures zero display dependencies in headless environments

---

## 🤝 Contributing

1. Fork this repo.
2. Make changes in `src/aetherscope_afm/` (Python) or the `.js` files (Node) as needed.
3. Run tests:
   ```bash
   pytest tests/ -v
   npm run test:node
   ```
4. Commit and push. The ASF‑R governance policy will apply according to the selected profile.

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

> Built for AGNT by the AGNT team. 🚀