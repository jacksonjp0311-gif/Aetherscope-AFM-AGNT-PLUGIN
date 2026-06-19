import json
from pathlib import Path
from typing import Dict

def write_json(path, payload):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return str(p)

def append_jsonl(path, payload):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with p.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    return str(p)

def ledger_path_for(root):
    return str(Path(root) / "ledger" / "runs.jsonl")
