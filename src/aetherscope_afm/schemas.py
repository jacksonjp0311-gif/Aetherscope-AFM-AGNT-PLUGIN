"""Pydantic-like data schemas."""
from dataclasses import dataclass, field as dc_field
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
class MetricsConfig:
    delta_phi_path: Optional[str] = None
    omega_base_path: Optional[str] = None
    omega_noisy_path: Optional[str] = None
@dataclass(slots=True)
class NoiseConfig:
    noise_level: float = 0.10
    seed: int = 42
@dataclass(slots=True)
class OutputConfig:
    output_root: Optional[str] = None
@dataclass(slots=True)
class InputConfig:
    assumed_layout: Optional[str] = None
@dataclass(slots=True)
class RunConfig:
    preprocess: PreprocessConfig = dc_field(default_factory=PreprocessConfig)
    field: FieldConfig = dc_field(default_factory=FieldConfig)
    metrics: MetricsConfig = dc_field(default_factory=MetricsConfig)
    noise: NoiseConfig = dc_field(default_factory=NoiseConfig)
    output: OutputConfig = dc_field(default_factory=OutputConfig)
    input: InputConfig = dc_field(default_factory=InputConfig)