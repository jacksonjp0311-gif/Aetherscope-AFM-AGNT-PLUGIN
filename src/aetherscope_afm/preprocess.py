"""Preprocessing: clip, normalize, superresolve AFM volumes."""
from typing import Optional
import numpy as np
def clip_volume(volume: np.ndarray, clip_min: Optional[float], clip_max: Optional[float]) -> np.ndarray:
    """Clip volume to [clip_min, clip_max] (None means no bound)."""
    vol = np.asarray(volume, dtype=np.float32)
    if clip_min is None and clip_max is None:
        return vol
    lo = np.min(vol) if clip_min is None else float(clip_min)
    hi = np.max(vol) if clip_max is None else float(clip_max)
    return np.clip(vol, lo, hi).astype(np.float32, copy=False)
def minmax_normalize(volume: np.ndarray) -> np.ndarray:
    """Min-max normalize to [0, 1]."""
    vol = np.asarray(volume, dtype=np.float32)
    vmin, vmax = float(np.min(vol)), float(np.max(vol))
    if vmax <= vmin:
        return np.zeros_like(vol)
    return ((vol - vmin) / (vmax - vmin)).astype(np.float32, copy=False)
def superresolve_repeat(volume: np.ndarray, factor: int = 1, max_size: int = 128) -> np.ndarray:
    """Nearest-neighbor upsample by factor, enforcing max_size constraint."""
    vol = np.asarray(volume, dtype=np.float32)
    if factor <= 1:
        return vol.astype(np.float32, copy=False)
    nx, ny, nz = vol.shape
    if max(nx * factor, ny * factor, nz * factor) > max_size:
        return vol.astype(np.float32, copy=False)
    return vol.repeat(factor, axis=0).repeat(factor, axis=1).repeat(factor, axis=2).astype(np.float32, copy=False)
def preprocess_volume(
    volume: np.ndarray,
    clip_min: Optional[float] = None,
    clip_max: Optional[float] = None,
    superres: int = 1,
    max_size: int = 128,
) -> np.ndarray:
    """Full preprocessing pipeline: clip → normalize → superresolve."""
    vol = clip_volume(volume, clip_min, clip_max)
    vol = minmax_normalize(vol)
    vol = superresolve_repeat(vol, factor=superres, max_size=max_size)
    return vol