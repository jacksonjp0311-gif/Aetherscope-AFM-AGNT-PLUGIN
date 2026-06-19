"""
Smoke test for the AetherScope-AFM Python package.
"""
import json
import tempfile
import numpy as np
from pathlib import Path

from aetherscope_afm.preprocess import preprocess_volume, clip_volume, minmax_normalize, superresolve_repeat
from aetherscope_afm.field import build_harmonic_field
from aetherscope_afm.transforms import compute_delta_phi, compute_omega, central_slice_3d, central_slice_4d, inject_gaussian_noise
from aetherscope_afm.metrics import assemble_metrics, triad_metrics, curvature_proxy, correlation_safe
from aetherscope_afm.visualize import write_visuals
from aetherscope_afm.ledger import append_jsonl, write_json, ledger_path_for
from aetherscope_afm.config import load_config, RunConfig


def test_preprocess():
    vol = np.random.rand(8, 8, 8).astype(np.float32) * 100
    clipped = clip_volume(vol, 10.0, 90.0)
    assert clipped.dtype == np.float32
    normed = minmax_normalize(clipped)
    assert normed.dtype == np.float32
    sr = superresolve_repeat(normed, factor=2, max_size=128)
    assert sr.shape == (16, 16, 16)
    sr_capped = superresolve_repeat(np.random.rand(64, 64, 64).astype(np.float32), factor=3, max_size=128)
    assert sr_capped.shape == (64, 64, 64)
    pre = preprocess_volume(vol, clip_min=10.0, clip_max=90.0, superres=1, max_size=64)
    assert pre.shape == vol.shape
    print("[PASS] preprocess")


def test_harmonic_field():
    vol = np.random.rand(8, 8, 8).astype(np.float32)
    field = build_harmonic_field(vol, T=4)
    assert field.shape == (4, 8, 8, 8)
    assert field.dtype == np.float32
    field8 = build_harmonic_field(vol, T=8)
    assert field8.shape == (8, 8, 8, 8)
    print("[PASS] harmonic_field")


def test_transforms():
    field = np.random.rand(4, 8, 8, 8).astype(np.float32)
    delta_phi = compute_delta_phi(field)
    assert delta_phi.shape == (3, 8, 8, 8)
    omega = compute_omega(delta_phi)
    assert omega.shape == (3, 8, 8, 8)
    noise = inject_gaussian_noise(field, level=0.1, seed=42)
    assert noise.shape == field.shape
    print("[PASS] transforms")


def test_metrics():
    # Use consistent shapes: field (4 frames), delta_phi (3 frames from diff)
    # triad_metrics uses volume and delta_phi separately (mean of each)
    # correlation_safe ravels both, so shapes just need same total elements
    vol = np.random.rand(8, 8, 8).astype(np.float32)
    field = build_harmonic_field(vol, T=4)
    delta_phi = compute_delta_phi(field)  # (3, 8, 8, 8)
    omega_base = compute_omega(delta_phi)  # (3, 8, 8, 8)
    omega_noisy = inject_gaussian_noise(omega_base, level=0.1, seed=42)  # (3, 8, 8, 8)

    metrics = assemble_metrics(field, delta_phi, omega_base, omega_noisy)
    assert "E_mean_abs_volume" in metrics
    assert "I_mean_delta_phi" in metrics
    assert "C_triad" in metrics
    assert "lambda_eff" in metrics
    assert "barrier_scale" in metrics
    assert "curvature" in metrics
    assert "omega_correlation" in metrics

    triad = triad_metrics(field, delta_phi)
    assert "C_triad" in triad

    curv = curvature_proxy(delta_phi)
    assert isinstance(curv, float)

    corr = correlation_safe(omega_base, omega_base)
    assert abs(corr - 1.0) < 1e-5

    print("[PASS] metrics")


def test_visuals():
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        vol = np.random.rand(8, 8, 8).astype(np.float32)
        field = build_harmonic_field(vol, T=4)
        delta_phi = compute_delta_phi(field)
        omega = compute_omega(delta_phi)

        vol_slice = vol[:, :, 4]
        field_slice = field[0, :, :, 4]
        omega_slice = omega[0, :, :, 4]

        visuals = write_visuals(
            output_dir=str(td),
            sample_id="smoke_test",
            volume_slice=vol_slice,
            field_slice=field_slice,
            omega_slice=omega_slice,
            delta_phi_slice=delta_phi[0, :, :, 4],
        )

        for key, png_path in visuals.items():
            assert Path(png_path).exists(), f"Missing PNG: {key}"
            assert Path(png_path).stat().st_size > 0, f"Empty PNG: {key}"

    print("[PASS] visuals")


def test_ledger():
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        ledger_file = ledger_path_for(str(td))
        entry = {
            "run_id": "test_run_001",
            "timestamp": "2026-06-18T00:00:00Z",
            "input_path": "/path/to/vol.npy",
            "profile": "fixture",
            "metrics": {"C_triad": 0.5},
        }
        append_jsonl(ledger_file, entry)
        append_jsonl(ledger_file, {**entry, "run_id": "test_run_002"})
        lines = Path(ledger_file).read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) == 2
        last = json.loads(lines[-1])
        assert last["run_id"] == "test_run_002"
    print("[PASS] ledger")


def test_config():
    cfg = load_config(config_path=None, profile="default")
    assert isinstance(cfg, RunConfig)
    cfg_fixture = load_config(config_path=None, profile="fixture")
    assert isinstance(cfg_fixture, RunConfig)
    print("[PASS] config")


def test_e2e_pipeline():
    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        vol = np.random.rand(8, 8, 8).astype(np.float32)
        inp = td / "volume.npy"
        np.save(inp, vol)

        pre = preprocess_volume(vol, clip_min=0.0, clip_max=1.0, superres=1, max_size=64)
        field = build_harmonic_field(pre, T=4)
        delta_phi = compute_delta_phi(field)
        omega_base = compute_omega(delta_phi)
        omega_noisy = inject_gaussian_noise(omega_base, level=0.1, seed=42)

        metrics = assemble_metrics(field, delta_phi, omega_base, omega_noisy)
        assert "C_triad" in metrics

        visuals = write_visuals(
            output_dir=str(td),
            sample_id="e2e_test",
            volume_slice=pre[:, :, 4],
            field_slice=field[0, :, :, 4],
            omega_slice=omega_noisy[0, :, :, 4],
        )
        assert Path(visuals["volume_slice"]).exists()

        ledger_file = ledger_path_for(str(td))
        entry = {
            "run_id": "e2e_run_001",
            "timestamp": "2026-06-18T00:00:00Z",
            "input_path": str(inp),
            "profile": "fixture",
            "metrics": metrics,
            "visuals": visuals,
        }
        append_jsonl(ledger_file, entry)
        lines = Path(ledger_file).read_text(encoding="utf-8").strip().splitlines()
        assert len(lines) >= 1

        telemetry = {
            "schemaVersion": 1,
            "pluginVersion": "1.1.0",
            "runId": "e2e_run_001",
            "metrics": metrics,
        }
        tele_path = td / "telemetry.json"
        write_json(str(tele_path), telemetry)
        assert tele_path.exists()

    print("[PASS] e2e_pipeline")


if __name__ == "__main__":
    test_preprocess()
    test_harmonic_field()
    test_transforms()
    test_metrics()
    test_visuals()
    test_ledger()
    test_config()
    test_e2e_pipeline()
    print("\n=== ALL 8 SMOKE TESTS PASSED ===")