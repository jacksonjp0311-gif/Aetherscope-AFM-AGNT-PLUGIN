from dataclasses import dataclass

@dataclass
class PreprocessConfig:
    clip_min = None
    clip_max = None
    superres = 1
    max_size = 128
