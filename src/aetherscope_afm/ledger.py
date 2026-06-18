"""Append-only ledger for governance-aware runs."""
import json
import csv
from pathlib import Path
from typing import Dict, List
def _ledger_path(root: str) -> str:
    return str(Path(root) / "ledger" / "runs.jsonl")
def write_json(path: str, payload: Dict) -> str:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return str(p)
def append_jsonl(path: str, payload: Dict) -> str:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return str(p)
def write_csv_summary(path: str, rows: List[Dict]) -> str:
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        p.write_text("", encoding="utf-8")
        return str(p)
    keys = sorted({k for row in rows for k in row.keys()})
    with p.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        for row in rows:
            w.writerow(row)
    return str(p)
def write_json_summary(path: str, payload: Dict) -> str:
    return write_json(path, payload)
def ledger_path_for(root: str) -> str:
    return _ledger_path(root)