import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
from typing import Dict, Optional

def _save_image(arr, path, title, cmap="viridis"):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fig = plt.figure(figsize=(6, 5))
    plt.imshow(arr, cmap=cmap, aspect="auto")
    plt.title(title)
    plt.colorbar()
    plt.tight_layout()
    fig.savefig(str(p), dpi=160)
    plt.close(fig)
    return str(p)

def _save_hist(arr, path, title):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fig = plt.figure(figsize=(6, 4))
    plt.hist(np.asarray(arr).ravel(), bins=40)
    plt.title(title)
    plt.tight_layout()
    fig.savefig(str(p), dpi=160)
    plt.close(fig)
    return str(p)

def _save_trace(values, path, title):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fig = plt.figure(figsize=(6, 4))
    plt.plot(values, marker="o")
    plt.title(title)
    plt.xlabel("t")
    plt.ylabel("value")
    plt.tight_layout()
    fig.savefig(str(p), dpi=160)
    plt.close(fig)
    return str(p)

def write_visuals(output_dir, sample_id, volume_slice, field_slice, omega_slice, delta_phi_slice=None):
    out = {}
    out["volume_slice"] = _save_image(volume_slice, f"{output_dir}/visuals/{sample_id}_volume_slice.png", "Volume Slice")
    out["field_slice"] = _save_image(field_slice, f"{output_dir}/visuals/{sample_id}_field_slice.png", "Field Slice")
    out["omega_slice"] = _save_image(omega_slice, f"{output_dir}/visuals/{sample_id}_omega_slice.png", "Omega Slice")
    out["hist_volume"] = _save_hist(volume_slice, f"{output_dir}/visuals/{sample_id}_volume_hist.png", "Volume Histogram")
    out["hist_field"] = _save_hist(field_slice, f"{output_dir}/visuals/{sample_id}_field_hist.png", "Field Histogram")
    out["hist_omega"] = _save_hist(omega_slice, f"{output_dir}/visuals/{sample_id}_omega_hist.png", "Omega Histogram")
    omega_arr = np.asarray(omega_slice)
    if omega_arr.ndim >= 3:
        trace_vals = omega_arr.mean(axis=tuple(range(1, omega_arr.ndim))).tolist()
    else:
        trace_vals = [float(omega_arr.mean())]
    out["trace_omega"] = _save_trace(trace_vals, f"{output_dir}/visuals/{sample_id}_fractal_trace.png", "Omega Trace")
    if delta_phi_slice is not None:
        out["delta_phi_slice"] = _save_image(delta_phi_slice, f"{output_dir}/visuals/{sample_id}_delta_phi_slice.png", "Delta Phi Slice")
        out["hist_delta_phi"] = _save_hist(delta_phi_slice, f"{output_dir}/visuals/{sample_id}_delta_phi_hist.png", "Delta Phi Histogram")
    return out
