import numpy as np
from typing import Dict
_EPS = 1e-8

def triad_metrics(volume, delta_phi):
    V = np.asarray(volume, dtype=np.float32)
    D = np.asarray(delta_phi, dtype=np.float32)
    E = float(np.mean(np.abs(V)))
    I = float(np.mean(D))
    C = float((E * I) / (1.0 + abs(I) + _EPS))
    lam = float(min(0.99, I / (1.0 + I + _EPS)))
    barrier = float(((1-lam)**1.5) * (max(E*I, 0)**1.5))
    return {"E_mean_abs_volume": E, "I_mean_delta_phi": I, "C_triad": C,
            "lambda_eff": lam, "barrier_scale": barrier}

def curvature_proxy(delta_phi):
    D = np.asarray(delta_phi, dtype=np.float32)
    gx, gy, gz = np.gradient(D, axis=1), np.gradient(D, axis=2), np.gradient(D, axis=3)
    return float(np.mean(np.sqrt(gx*gx + gy*gy + gz*gz)))

def correlation_safe(a, b):
    x = np.asarray(a, dtype=np.float32).ravel() - np.mean(np.asarray(a, dtype=np.float32).ravel())
    y = np.asarray(b, dtype=np.float32).ravel() - np.mean(np.asarray(b, dtype=np.float32).ravel())
    denom = float(np.sqrt((x*x).mean()) * np.sqrt((y*y).mean()) + _EPS)
    return float((x*y).mean() / denom) if denom > _EPS else 0.0

def assemble_metrics(volume, delta_phi, omega_base, omega_noisy):
    base = triad_metrics(volume, delta_phi)
    base["curvature"] = curvature_proxy(delta_phi)
    base["omega_correlation"] = correlation_safe(
        np.asarray(omega_base, dtype=np.float32),
        np.asarray(omega_noisy, dtype=np.float32))
    return base
