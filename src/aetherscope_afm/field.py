"""Harmonic field generation."""
import numpy as np
def build_harmonic_field(volume: np.ndarray, T: int = 8) -> np.ndarray:
    """Build a T-frame harmonic field via sinusoidal modulation.

    Returns an array of shape (T, X, Y, Z) where each frame t is:
        out[t] = volume * (1 + 0.30*sin(2πt/T) + 0.22*cos(2πt/T + 3*r))
    with r = sqrt((x/X)^2 + (y/Y)^2 + (z/Z)^2).
    """
    vol = np.asarray(volume, dtype=np.float32)
    if vol.ndim != 3:
        raise ValueError(f"Volume must be 3D [X,Y,Z], got ndim={vol.ndim}")
    X, Y, Z = vol.shape
    xs = np.linspace(-1.0, 1.0, X, dtype=np.float32)
    ys = np.linspace(-1.0, 1.0, Y, dtype=np.float32)
    zs = np.linspace(-1.0, 1.0, Z, dtype=np.float32)
    gx, gy, gz = np.meshgrid(xs, ys, zs, indexing="ij")
    r = np.sqrt(gx ** 2 + gy ** 2 + gz ** 2).astype(np.float32)
    out = np.empty((int(T), X, Y, Z), dtype=np.float32)
    for t in range(int(T)):
        theta = (2.0 * np.pi * t) / max(int(T), 1)
        modulation = 1.0 + 0.30 * np.sin(theta) + 0.22 * np.cos(2.0 * theta + 3.0 * r)
        out[t] = vol * modulation.astype(np.float32)
    return out.astype(np.float32, copy=False)