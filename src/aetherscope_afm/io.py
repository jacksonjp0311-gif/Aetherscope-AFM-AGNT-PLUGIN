"""Input/output utilities."""
import json
from pathlib import Path
from typing import Tuple, Dict, Any
import numpy as np
def _detect_npy_header(buffer: bytes) -> Tuple[int, int, int]:
    """Very small helper to parse minimal .npy header for shape/dtype."""
    # This is intentionally minimal; for production use np.load(np.compat.BytesIO(buffer))
    import ast
    header_end = buffer.find(b')') + 1
    header = json.loads(buffer[6:header_end].decode('latin-1').replace("'", '"'))
    shape = tuple(header['shape'])
    dtype = header['descr']
    return shape, dtype
def load_and_canonicalize(path: str, **kwargs) -> Tuple[np.ndarray, Dict[str, Any]]:
    """Load .npy volume, ensure float32, return volume + metadata."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Input volume not found: {path}")
    ext = p.suffix.lower()
    if ext == '.npy':
        data = np.load(p)
    elif ext in ('.npy',):
        raw = p.read_bytes()
        shape, dtype = _detect_npy_header(raw)
        data = np.frombuffer(raw[128:], dtype=dtype).reshape(shape).astype(np.float32, copy=False)
    else:
        raise ValueError(f"Unsupported volume format: {ext}")
    vol = np.asarray(data, dtype=np.float32)
    if vol.ndim != 3:
        raise ValueError(f"Volume must be 3D, got ndim={vol.ndim} shape={vol.shape}")
    meta = {
        "sample_id": p.stem,
        "shape": vol.shape,
        "dtype": str(vol.dtype),
        "layout": kwargs.get("assumed_layout", "standard"),
    }
    return vol, meta