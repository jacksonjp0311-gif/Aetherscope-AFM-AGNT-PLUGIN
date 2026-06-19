from typing import Optional

class AetherScopeConfig:
    preprocess__clip_min = None
    preprocess__clip_max = None
    preprocess__superres = 1
    preprocess__max_size = 128
    field__T = 8
    noise__noise_level = 0.10
    noise__seed = 42
    output__output_root = None

class RunConfig(AetherScopeConfig):
    pass

def load_config(config_path=None, profile="default"):
    return RunConfig()
