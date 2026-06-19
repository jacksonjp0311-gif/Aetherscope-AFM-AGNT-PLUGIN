import numpy as np
from pathlib import Path

def load_and_canonicalize(path):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Input volume not found: {path}")
    data = np.load(p)
    vol = np.asarray(data, dtype=np.float32)
    if vol.ndim != 3:
        raise ValueError(f"Volume must be 3D, got ndim={vol.ndim}")
    meta = {"sample_id": p.stem, "shape": vol.shape, "dtype": str(vol.dtype)}
    return vol, meta
