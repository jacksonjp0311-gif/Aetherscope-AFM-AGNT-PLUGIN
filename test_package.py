#!/usr/bin/env python3
"""Quick test of the AetherScope-AFM Python package."""
import sys
import tempfile
import numpy as np
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

from aetherscope_afm.preprocess import preprocess_volume
from aetherscope_afm.field import build_harmonic_field
from aetherscope_afm.transforms import compute_delta_phi, compute_omega
from aetherscope_afm.metrics import assemble_metrics

def test_package():
    with tempfile.TemporaryDirectory() as td:
        # Create tiny volume
        vol = np.random.rand(8, 8, 8).astype(np.float32)
        
        # Preprocess
        pre = preprocess_volume(vol, clip_min=0.0, clip_max=1.0, superres=1, max_size=64)
        assert pre.shape == vol.shape
        print("✅ Preprocess OK")
        
        # Harmonic field
        field = build_harmonic_field(pre, T=4)
        assert field.shape == (4, 8, 8, 8)
        print("✅ Harmonic field OK")
        
        # Transforms
        delta_phi = compute_delta_phi(field)
        omega = compute_omega(delta_phi)
        assert delta_phi.shape == (3, 8, 8, 8)
        assert omega.shape == (3, 8, 8, 8)
        print("✅ Transforms OK")
        
        # Metrics
        metrics = assemble_metrics(field, delta_phi, omega, omega)
        assert "C_triad" in metrics
        assert "lambda_eff" in metrics
        print("✅ Metrics OK")
        
        print("\n🎉 All Python package tests passed!")

if __name__ == "__main__":
    test_package()