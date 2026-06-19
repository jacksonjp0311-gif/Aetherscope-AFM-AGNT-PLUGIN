import json
import sys
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
    write_json(str(tele_path), {"schemaVersion": 1, "pluginVersion": "1.2.0",
                                  "runId": run_id, "metrics": metrics})
    return {"run_id": run_id, "output_root": str(out), "metrics": metrics, "visuals": visuals}


def cmd_preprocess(args):
    """Handle 'preprocess' subcommand."""
    input_path = args.input_path
    cfg = load_config(profile="demo")
    vol, meta = load_and_canonicalize(input_path)
    pre = preprocess_volume(
        vol,
        clip_min=args.clip_min if args.clip_min is not None else cfg.preprocess__clip_min,
        clip_max=args.clip_max if args.clip_max is not None else cfg.preprocess__clip_max,
        superres=args.superres if args.superres is not None else cfg.preprocess__superres,
        max_size=args.max_size if args.max_size is not None else cfg.preprocess__max_size,
    )
    out_path = Path(input_path).with_suffix('.preprocessed.npy')
    import numpy as np
    np.save(str(out_path), pre)
    print(json.dumps({"success": True, "output_path": str(out_path), "shape": list(pre.shape)}))


def cmd_harmonic_field(args):
    """Handle 'harmonic-field' subcommand."""
    cfg = load_config(profile="demo")
    vol, meta = load_and_canonicalize(args.volume_path)
    pre = preprocess_volume(vol, clip_min=cfg.preprocess__clip_min,
                             clip_max=cfg.preprocess__clip_max,
                             superres=cfg.preprocess__superres,
                             max_size=cfg.preprocess__max_size)
    field = build_harmonic_field(pre, T=args.T or cfg.field__T)
    out_path = Path(args.volume_path).with_suffix('.harmonic.npy')
    import numpy as np
    np.save(str(out_path), field)
    print(json.dumps({"success": True, "output_path": str(out_path), "shape": list(field.shape), "T": field.shape[0]}))


def cmd_metrics(args):
    """Handle 'metrics' subcommand."""
    cfg = load_config(profile="demo")
    vol, meta = load_and_canonicalize(args.volume)
    pre = preprocess_volume(vol, clip_min=cfg.preprocess__clip_min,
                             clip_max=cfg.preprocess__clip_max,
                             superres=cfg.preprocess__superres,
                             max_size=cfg.preprocess__max_size)
    field = build_harmonic_field(pre, T=cfg.field__T)
    delta_phi = compute_delta_phi(field)
    omega_base = compute_omega(delta_phi)
    omega_noisy = inject_gaussian_noise(omega_base, level=cfg.noise__noise_level, seed=cfg.noise__seed)
    metrics = assemble_metrics(field, delta_phi, omega_base, omega_noisy)
    print(json.dumps(metrics))


def cmd_dashboard(args):
    """Handle 'dashboard' subcommand."""
    result = run_pipeline(args.input_path, args.output_root, args.profile)
    print(json.dumps(result))


def cmd_run_single(args):
    """Handle 'run-single' subcommand."""
    result = run_pipeline(args.input_path, args.output_root, args.profile)
    print(json.dumps(result))


def cmd_telemetry(args):
    """Handle 'telemetry' subcommand."""
    import json as _json
    with open(args.metrics_json) as f:
        metrics = _json.load(f)
    out_path = args.output_path or str(Path(args.metrics_json).with_suffix('.telemetry.json'))
    write_json(out_path, {"schemaVersion": 1, "pluginVersion": "1.2.0", "metrics": metrics})
    print(json.dumps({"success": True, "output_path": out_path}))


def cmd_ledger(args):
    """Handle 'ledger' subcommand."""
    import json as _json
    metrics = {}
    if args.metrics:
        with open(args.metrics) as f:
            metrics = _json.load(f)
    entry = {
        "run_id": args.run_id or "manual",
        "sample_id": args.sample_id or "unknown",
        "metrics": metrics,
    }
    ledger_path = ledger_path_for(args.output_root)
    append_jsonl(ledger_path, entry)
    print(json.dumps({"success": True, "ledger_path": ledger_path}))


def cmd_visualize(args):
    """Handle 'visualize' subcommand."""
    import numpy as np
    vol_s = np.load(args.volume_slice) if args.volume_slice else None
    field_s = np.load(args.field_slice) if args.field_slice else None
    omega_s = np.load(args.omega_slice) if args.omega_slice else None
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    run_id = "visualize_" + str(hash(args.output_dir))[:8]
    visuals = write_visuals(str(out_dir), run_id, vol_s, field_s, omega_s, None)
    print(json.dumps({"success": True, "visuals": visuals}))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="AetherScope AFM CLI")
    subparsers = parser.add_subparsers(dest="command")

    # preprocess
    p_pre = subparsers.add_parser("preprocess")
    p_pre.add_argument("--input-path", required=True)
    p_pre.add_argument("--clip-min", type=float, default=None)
    p_pre.add_argument("--clip-max", type=float, default=None)
    p_pre.add_argument("--superres", type=int, default=None)
    p_pre.add_argument("--max-size", type=int, default=None)

    # harmonic-field
    p_hf = subparsers.add_parser("harmonic-field")
    p_hf.add_argument("--volume-path", required=True)
    p_hf.add_argument("--T", type=int, default=None)

    # metrics
    p_met = subparsers.add_parser("metrics")
    p_met.add_argument("--volume", required=True)
    p_met.add_argument("--delta-phi", default=None)
    p_met.add_argument("--omega-base", default=None)
    p_met.add_argument("--omega-noisy", default=None)

    # dashboard
    p_dash = subparsers.add_parser("dashboard")
    p_dash.add_argument("--input-path", required=True)
    p_dash.add_argument("--output-root", default="outputs")
    p_dash.add_argument("--profile", default="demo")
    p_dash.add_argument("--config", default=None)

    # run-single
    p_rs = subparsers.add_parser("run-single")
    p_rs.add_argument("--input-path", required=True)
    p_rs.add_argument("--output-root", default="outputs")
    p_rs.add_argument("--profile", default="demo")
    p_rs.add_argument("--config", default=None)

    # telemetry
    p_tel = subparsers.add_parser("telemetry")
    p_tel.add_argument("--metrics-json", required=True)
    p_tel.add_argument("--output-path", default=None)

    # ledger
    p_led = subparsers.add_parser("ledger")
    p_led.add_argument("--output-root", required=True)
    p_led.add_argument("--sample-id", default=None)
    p_led.add_argument("--run-id", default=None)
    p_led.add_argument("--metrics", default=None)

    # visualize
    p_vis = subparsers.add_parser("visualize")
    p_vis.add_argument("--output-dir", required=True)
    p_vis.add_argument("--volume-slice", default=None)
    p_vis.add_argument("--field-slice", default=None)
    p_vis.add_argument("--omega-slice", default=None)

    args = parser.parse_args()

    commands = {
        "preprocess": cmd_preprocess,
        "harmonic-field": cmd_harmonic_field,
        "metrics": cmd_metrics,
        "dashboard": cmd_dashboard,
        "run-single": cmd_run_single,
        "telemetry": cmd_telemetry,
        "ledger": cmd_ledger,
        "visualize": cmd_visualize,
    }

    handler = commands.get(args.command)
    if handler:
        handler(args)
    else:
        parser.print_help()
        sys.exit(1)
