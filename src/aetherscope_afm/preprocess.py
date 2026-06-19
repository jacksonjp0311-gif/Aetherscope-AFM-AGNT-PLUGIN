import numpy as np
from typing import Optional

def clip_volume(v, clip_min=None, clip_max=None):
    vol = np.asarray(v, dtype=np.float32)
    if clip_min is None and clip_max is None: return vol
    lo = np.min(vol) if clip_min is None else float(clip_min)
    hi = np.max(vol) if clip_max is None else float(clip_max)
    return np.clip(vol, lo, hi).astype(np.float32, copy=False)

def minmax_normalize(v):
    vol = np.asarray(v, dtype=np.float32)
    vmin, vmax = float(np.min(vol)), float(np.max(vol))
    if vmax <= vmin: return np.zeros_like(vol)
    return ((vol - vmin) / (vmax - vmin)).astype(np.float32, copy=False)

def superresolve_repeat(v, factor=1, max_size=128):
    vol = np.asarray(v, dtype=np.float32)
    if factor <= 1: return vol
    nx, ny, nz = vol.shape[0]*factor, vol.shape[1]*factor, vol.shape[2]*factor
    if max(nx, ny, nz) > max_size: return vol
    return vol.repeat(factor,0).repeat(factor,1).repeat(factor,2).astype(np.float32, copy=False)

def preprocess_volume(volume, clip_min=None, clip_max=None, superres=1, max_size=128):
    vol = clip_volume(volume, clip_min, clip_max)
    vol = minmax_normalize(vol)
    vol = superresolve_repeat(vol, factor=superres, max_size=max_size)
    return vol
