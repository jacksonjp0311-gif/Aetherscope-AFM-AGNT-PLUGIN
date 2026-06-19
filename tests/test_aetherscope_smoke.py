import json, tempfile, numpy as np
from pathlib import Path
from aetherscope_afm.preprocess import preprocess_volume, clip_volume, minmax_normalize, superresolve_repeat
from aetherscope_afm.field import build_harmonic_field
from aetherscope_afm.transforms import compute_delta_phi, compute_omega, inject_gaussian_noise
from aetherscope_afm.metrics import assemble_metrics, triad_metrics, curvature_proxy, correlation_safe
from aetherscope_afm.visualize import write_visuals
from aetherscope_afm.ledger import append_jsonl, ledger_path_for, write_json
from aetherscope_afm.config import load_config
from aetherscope_afm.cli import run_pipeline

def test_preprocess():
    vol = np.random.rand(8,8,8).astype(np.float32) * 100
    assert clip_volume(vol, 10, 90).dtype == np.float32
    assert minmax_normalize(vol).min() >= 0
    assert superresolve_repeat(vol, 2, 128).shape == (16,16,16)
    assert preprocess_volume(vol).shape == vol.shape
    print("[PASS] preprocess")

def test_harmonic_field():
    vol = np.random.rand(8,8,8).astype(np.float32)
    f = build_harmonic_field(vol, T=4)
    assert f.shape == (4,8,8,8)
    print("[PASS] harmonic_field")

def test_transforms():
    f = np.random.rand(4,8,8,8).astype(np.float32)
    dp = compute_delta_phi(f)
    assert dp.shape == (3,8,8,8)
    om = compute_omega(dp)
    assert om.shape == (3,8,8,8)
    noise = inject_gaussian_noise(f, 0.1, 42)
    assert noise.shape == f.shape
    print("[PASS] transforms")

def test_metrics():
    vol = np.random.rand(8,8,8).astype(np.float32)
    field = build_harmonic_field(vol, T=4)
    dp = compute_delta_phi(field)
    ob = compute_omega(dp)
    on = inject_gaussian_noise(ob, 0.1, 42)
    m = assemble_metrics(field, dp, ob, on)
    assert "C_triad" in m and "lambda_eff" in m
    assert isinstance(curvature_proxy(dp), float)
    assert abs(correlation_safe(ob, ob) - 1.0) < 1e-5
    print("[PASS] metrics")

def test_visuals():
    with tempfile.TemporaryDirectory() as td:
        vol = np.random.rand(8,8,8).astype(np.float32)
        field = build_harmonic_field(vol, T=4)
        dp = compute_delta_phi(field)
        om = compute_omega(dp)
        v = write_visuals(str(td), "t", vol[:,:,4], field[0,:,:,4], om[0,:,:,4], dp[0,:,:,4])
        for k,p in v.items():
            assert Path(p).exists() and Path(p).stat().st_size > 0
    print("[PASS] visuals")

def test_ledger():
    with tempfile.TemporaryDirectory() as td:
        lf = ledger_path_for(td)
        append_jsonl(lf, {"run_id": "r1"})
        append_jsonl(lf, {"run_id": "r2"})
        lines = Path(lf).read_text().strip().splitlines()
        assert len(lines) == 2
        assert json.loads(lines[-1])["run_id"] == "r2"
    print("[PASS] ledger")

def test_config():
    c = load_config(profile="default")
    assert c.field__T == 8
    print("[PASS] config")

def test_e2e():
    with tempfile.TemporaryDirectory() as td:
        vol = np.random.rand(8,8,8).astype(np.float32)
        inp = Path(td) / "vol.npy"
        np.save(inp, vol)
        out = Path(td) / "out"
        result = run_pipeline(str(inp), str(out), "demo")
        assert "run_id" in result
        assert "C_triad" in result["metrics"]
        assert (out / "telemetry.json").exists()
        assert (out / "ledger" / "runs.jsonl").exists()
    print("[PASS] e2e")

if __name__ == "__main__":
    test_preprocess(); test_harmonic_field(); test_transforms()
    test_metrics(); test_visuals(); test_ledger(); test_config(); test_e2e()
    print("\n=== ALL 8 TESTS PASSED ===")
