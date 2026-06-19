import numpy as np

def compute_delta_phi(field):
    return np.diff(np.asarray(field, dtype=np.float32), axis=0)

def compute_omega(delta_phi):
    return 2 * np.pi * np.asarray(delta_phi, dtype=np.float32)

def central_slice_3d(vol, axis=0):
    vol = np.asarray(vol, dtype=np.float32)
    idx = vol.shape[axis] // 2
    sl = [slice(None)] * vol.ndim
    sl[axis] = idx
    return vol[tuple(sl)]

def central_slice_4d(vol):
    vol = np.asarray(vol, dtype=np.float32)
    return vol[vol.shape[0] // 2]

def inject_gaussian_noise(field, level=0.1, seed=42):
    f = np.asarray(field, dtype=np.float32)
    rng = np.random.default_rng(seed)
    noise = rng.normal(0.0, float(f.std()) * level, size=f.shape).astype(np.float32)
    return (f + noise).astype(np.float32, copy=False)
