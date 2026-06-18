"""Phase, frequency, and noise transforms."""
import numpy as np
def compute_delta_phi(field: np.ndarray) -> np.ndarray:
    """Phase gradient across the T-frame dimension."""
    f = np.asarray(field, dtype=np.float32)
    return np.diff(f, axis=0).astype(np.float32, copy=False)
def compute_omega(delta_phi: np.ndarray) -> np.ndarray:
    """Angular frequency derived from phase difference."""
    d = np.asarray(delta_phi, dtype=np.float32)
    # omega = 2π * Δφ per frame; shape matches delta_phi along T
    return (2.0 * np.pi * d).astype(np.float32, copy=False)
def central_slice_3d(volume: np.ndarray, axis: int = 0) -> np.ndarray:
    """Extract central 2D slice along the given axis."""
    vol = np.asarray(volume, dtype=np.float32)
    idx = vol.shape[axis] // 2
    sl = [slice(None)] * vol.ndim
    sl[axis] = idx
    return vol[tuple(sl)]
def central_slice_4d(vol: np.ndarray, axis: int = 0) -> np.ndarray:
    """Extract central 3D cube from a 4D tensor along T axis."""
    vol = np.asarray(vol, dtype=np.float32)
    idx = vol.shape[0] // 2
    sl = [slice(None)] * vol.ndim
    sl[0] = idx
    return vol[tuple(sl)]
def inject_gaussian_noise(field: np.ndarray, level: float = 0.10, seed: int = 42) -> np.ndarray:
    """Add zero-mean Gaussian noise scaled by field std."""
    f = np.asarray(field, dtype=np.float32)
    rng = np.random.default_rng(seed)
    noise = rng.normal(loc=0.0, scale=float(f.std()) * float(level), size=f.shape).astype(np.float32)
    return (f + noise).astype(np.float32, copy=False)