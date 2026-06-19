import numpy as np

def build_harmonic_field(volume, T=8):
    vol = np.asarray(volume, dtype=np.float32)
    if vol.ndim != 3: raise ValueError("Volume must be 3D [X,Y,Z]")
    X, Y, Z = vol.shape
    xs = np.linspace(-1, 1, X, dtype=np.float32)
    ys = np.linspace(-1, 1, Y, dtype=np.float32)
    zs = np.linspace(-1, 1, Z, dtype=np.float32)
    gx, gy, gz = np.meshgrid(xs, ys, zs, indexing="ij")
    r = np.sqrt(gx**2 + gy**2 + gz**2).astype(np.float32)
    out = np.empty((int(T), X, Y, Z), dtype=np.float32)
    for t in range(int(T)):
        theta = (2 * np.pi * t) / max(int(T), 1)
        modulation = 1.0 + 0.30 * np.sin(theta) + 0.22 * np.cos(2*theta + 3*r)
        out[t] = vol * modulation.astype(np.float32)
    return out
