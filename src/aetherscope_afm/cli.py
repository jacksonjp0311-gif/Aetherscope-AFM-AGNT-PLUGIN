import json
from pathlib import Path
from .preprocess import preprocess_volume
from .field import build_harmonic_field
from .transforms import compute_delta_phi, compute_omega, inject_gaussian_noise, central_slice_3d, central_slice_4d
from .metrics import assemble_metrics
from .visualize import write_visuals
from .ledger import append_jsonl, ledger_path_for, write_json
from .io import load_and_canonicalize
from .config import load_config

def run_pipeline(input_path, output_root="outputs", profile="demo"):
    cfg = load_config(profile=profile)
    vol, meta = load_and_canonicalize(input_path)
    pre = preprocess_volume(vol, clip_min=cfg.preprocess__clip_min,
                             clip_max=cfg.preprocess__clip_max,
                             superres=cfg.preprocess__superres,
                             max_size=cfg.preprocess__max_size)
    field = build_harmonic_field(pre, T=cfg.field__T)
    delta_phi = compute_delta_phi(field)
    omega_base = compute_omega(delta_phi)
    omega_noisy = inject_gaussian_noise(omega_base, level=cfg.noise__noise_level, seed=cfg.noise__seed)
    metrics = assemble_metrics(field, delta_phi, omega_base, omega_noisy)
    run_id = meta["sample_id"] + "_" + str(hash(str(input_path)))[:8]
    out = Path(output_root)
    out.mkdir(parents=True, exist_ok=True)

    # Build 2D slices for visualization
    vol_s = central_slice_3d(pre) if pre.ndim == 3 else pre[0, :, :, pre.shape[3] // 2]
    field_s = central_slice_4d(field)
    if field_s.ndim > 2: field_s = field_s[:, :, field_s.shape[2] // 2]
    omega_s = central_slice_4d(omega_noisy)
    if omega_s.ndim > 2: omega_s = omega_s[:, :, omega_s.shape[2] // 2]
    dp_s = central_slice_4d(delta_phi)
    if dp_s.ndim > 2: dp_s = dp_s[:, :, dp_s.shape[2] // 2]

    visuals = write_visuals(str(out), run_id, vol_s, field_s, omega_s, dp_s)
    entry = {"run_id": run_id, "input_path": str(input_path), "profile": profile,
             "metrics": metrics, "visuals": visuals}
    append_jsonl(ledger_path_for(str(out)), entry)
    tele_path = out / "telemetry.json"
    write_json(str(tele_path), {"schemaVersion": 1, "pluginVersion": "1.1.0",
                                  "runId": run_id, "metrics": metrics})
    return {"run_id": run_id, "output_root": str(out), "metrics": metrics, "visuals": visuals}

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["run-single"])
    parser.add_argument("--input-path", required=True)
    parser.add_argument("--output-root", default="outputs")
    parser.add_argument("--profile", default="demo")
    parser.add_argument("--config", default=None)
    parser.add_argument("--overrides", nargs="*", default=[])
    args = parser.parse_args()
    if args.command == "run-single":
        result = run_pipeline(args.input_path, args.output_root, args.profile)
        print(json.dumps(result, indent=2))
