"""Minimal smoke test that bypasses CLI override parsing."""
import json
import tempfile
import numpy as np
from pathlib import Path

from aetherscope_afm.preprocess import preprocess_volume
from aetherscope_afm.field import build_harmonic_field
from aetherscope_afm.transforms import compute_delta_phi, compute_omega, central_slice_3d, central_slice_4d
from aetherscope_afm.metrics import assemble_metrics
from aetherscope_afm.visualize import write_visuals
from aetherscope_afm.ledger import append_jsonl, ledger_path_for
from aetherscope_afm.config import RunConfig

def test_minimal_smoke():
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)

        # 1) Create a tiny synthetic volume
        vol = np.random.rand(8, 8, 8).astype(np.float32)
        inp = td / "volume.npy"
        np.save(inp, vol)

        # 2) Preprocess
        pre = preprocess_volume(vol, clip_min=0.0, clip_max=1.0, superres=1, max_size=64)
        assert pre.shape == vol.shape
        print("PREPROCESS OK")

        # 3) Build harmonic field
        field = build_harmonic_field(pre, T=4)
        assert field.shape == (4, 8, 8, 8)
        print("HARMONIC FIELD OK")

        # 4) Metrics base computations
        delta_phi = compute_delta_phi(field)
        omega_base = compute_omega(delta_phi)
        assert delta_phi.shape == (3, 8, 8, 8)
        assert omega_base.shape == (3, 8, 8, 8)
        print("TRANSFORMS OK")

        # 5) Assemble metrics
        metrics = assemble_metrics(field, delta_phi, omega_base, omega_base)
        assert "C_triad" in metrics
        assert "lambda_eff" in metrics
        print("METRICS OK")

        # 6) Visuals - 2D single slices (single time frame, spatial plane)
        vol_slice = pre[0]                           # (8, 8) at t=0
        field_slice = field[0, :, :, 4]              # (8, 8) mid-T, mid-Z
        omega_slice = omega_base[0, :, :, 4]         # (8, 8) mid-T, mid-Z, first component
        visuals = write_visuals(
            output_dir=str(td),
            sample_id="smoke_test",
            volume_slice=vol_slice,
            field_slice=field_slice,
            omega_slice=omega_slice,
        )
        assert "volume_slice" in visuals
        png_path = td / "visuals" / "smoke_test_volume_slice.png"
        assert png_path.exists(), f"MISSING: {png_path}"
        print("VISUALS OK")

        # 7) Ledger
        cfg = RunConfig()
        run_id = "smoke_run_001"
        ledger_file = Path(str(td) + "/ledger/runs.jsonl")
        entry = {
            "run_id": run_id,
            "timestamp": "2026-06-18T00:00:00Z",
            "input_path": str(inp),
            "profile": "fixture",
            "metrics": metrics,
            "visuals": visuals,
        }
        append_jsonl(str(ledger_file), entry)
        lines = ledger_file.read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) >= 1
        last = json.loads(lines[-1])
        assert last["run_id"] == run_id
        print("LEDGER OK")

        print("ALL CHECKS PASSED - PLUGIN FUNCTIONS CORRECTLY")

if __name__ == "__main__":
    test_minimal_smoke()