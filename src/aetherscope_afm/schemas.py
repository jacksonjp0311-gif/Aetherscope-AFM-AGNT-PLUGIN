"""Pydantic-like data schemas for run state."""
from dataclasses import dataclass
from typing import Optional
@dataclass(slots=True)
class PreprocessConfig:
    clip_min: Optional[float] = None
    clip_max: Optional[float] = None
    superres: int = 1
    max_size: int = 128
@dataclass(slots=True)
class FieldConfig:
    T: int = 8
@dataclass(slots=True)
class NoiseConfig:
    noise_level: float = 0.10
    seed: int = 42
@dataclass(slots=True)
class MetricsConfig:
    delta_phi_path: Optional[str] = None
    omega_base_path: Optional[str] = None
    omega_noisy_path: Optional[str] = None
@dataclass(slots=True)
class OutputConfig:
    output_root: Optional[str] = None
@dataclass(slots=True)
class InputConfig:
    assumed_layout: Optional[str] = None
@dataclass(slots=True)
class RunConfig:
    preprocess: PreprocessConfig = PreprocessConfig()
    field: FieldConfig = FieldConfig()
    metrics: MetricsConfig = MetricsConfig()
    noise: NoiseConfig = NoiseConfig()
    output: OutputConfig = OutputConfig()
    input: InputConfig = InputConfig()