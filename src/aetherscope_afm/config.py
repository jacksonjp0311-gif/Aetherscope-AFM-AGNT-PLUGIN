"""Configuration loading and validation."""
import copy
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional
import yaml
def _deep_merge(base: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    out = copy.deepcopy(base)
    for k, v in updates.items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = v
    return out
class AetherScopeConfig:
    """Default AetherScope-AFM configuration."""
    preprocess__clip_min: Optional[float] = None
    preprocess__clip_max: Optional[float] = None
    preprocess__superres: int = 1
    preprocess__max_size: int = 128
    field__T: int = 8
    metrics__delta_phi_path: Optional[str] = None
    metrics__omega_base_path: Optional[str] = None
    metrics__omega_noisy_path: Optional[str] = None
    noise__noise_level: float = 0.10
    noise__seed: int = 42
    output__output_root: Optional[str] = None
    input__assumed_layout: Optional[str] = None
@dataclass(slots=True)
class RunConfig:
    preprocess: AetherScopeConfig = field(default_factory=AetherScopeConfig)
    field: AetherScopeConfig = field(default_factory=AetherScopeConfig)
    metrics: AetherScopeConfig = field(default_factory=AetherScopeConfig)
    noise: AetherScopeConfig = field(default_factory=AetherScopeConfig)
    output: AetherScopeConfig = field(default_factory=AetherScopeConfig)
    input: AetherScopeConfig = field(default_factory=AetherScopeConfig)
def load_config(config_path: Optional[Path], profile: str = "default") -> RunConfig:
    """Load, merge profile config and return validated RunConfig."""
    base = AetherScopeConfig()
    base_dict = base.model_dump()
    # Profile overrides
    profiles = {
        "fixture": {"preprocess__clip_min": 0.0, "preprocess__clip_max": 1.0},
        "demo": {},
        "production": {"metrics__delta_phi_path": "delta_phi.npy", "metrics__omega_base_path": "omega_base.npy"},
    }
    merged = _deep_merge(base_dict, profiles.get(profile, {}))
    if config_path and Path(config_path).exists():
        with Path(config_path).open() as f:
            file_cfg = yaml.safe_load(f) or {}
        merged = _deep_merge(merged, file_cfg)
    # Apply overrides from CLI __overrides__ if present
    # For CLI use, we'll handle overrides externally via __dict__ manipulation
    cfg = RunConfig()
    for key, value in merged.items():
        parts = key.split("__")
        obj = cfg
        for p in parts[:-1]:
            obj = getattr(obj, p)
        setattr(obj, parts[-1], value)
    return cfg