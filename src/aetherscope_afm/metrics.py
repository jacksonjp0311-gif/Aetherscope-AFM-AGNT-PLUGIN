"""Triad metrics, omega analysis, and aggregation."""
import numpy as np
from typing import Dict
_EPS = 1e-8
def triad_metrics(volume: np.ndarray, delta_phi: np.ndarray) -> Dict[str, float]:
    """Compute E/I/C, lambda_eff, and barrier scale."""
    V = np.asarray(volume, dtype=np.float32)
    D = np.asarray(delta_phi, dtype=np.float32)
    E = float(np.mean(np.abs(V)))
    I = float(np.mean(D))
    C = float((E * I) / (1.0 + abs(I) + _EPS))
    lambda_eff = float(min(0.99, I / (1.0 + I + _EPS)))
    barrier_scale = float(((1.0 - lambda_eff) ** 1.5) * (max(E * I, 0.0) ** 1.5))
    return {
        "E_mean_abs_volume": E,
        "I_mean_delta_phi": I,
        "C_triad": C,
        "lambda_eff": lambda_eff,
        "barrier_scale": barrier_scale,
    }
def curvature_proxy(delta_phi: np.ndarray) -> float:
    """Gradient magnitude of phase as a curvature estimate."""
    D = np.asarray(delta_phi, dtype=np.float32)
    gx = np.gradient(D, axis=1)
    gy = np.gradient(D, axis=2)
    gz = np.gradient(D, axis=3)
    curv = np.sqrt(gx * gx + gy * gy + gz * gz)
    return float(np.mean(curv))
def correlation_safe(a: np.ndarray, b: np.ndarray) -> float:
    """Normalized correlation with numerical stability."""
    x = np.asarray(a, dtype=np.float32).ravel() - np.mean(np.asarray(a, dtype=np.float32).ravel())
    y = np.asarray(b, dtype=np.float32).ravel() - np.mean(np.asarray(b, dtype=np.float32).ravel())
    denom = float(np.sqrt((x * x).mean()) * np.sqrt((y * y).mean()) + _EPS)
    return float((x * y).mean() / denom) if denom > _EPS else 0.0
def assemble_metrics(
    volume: np.ndarray,
    delta_phi: np.ndarray,
    omega_base: np.ndarray,
    omega_noisy: np.ndarray,
) -> Dict[str, float]:
    """Aggregate all metrics into a single dictionary."""
    base = triad_metrics(volume, delta_phi)
    base["curvature"] = float(curvature_proxy(delta_phi))
    base["omega_correlation"] = float(correlation_safe(omega_base, omega_noisy))
    return base