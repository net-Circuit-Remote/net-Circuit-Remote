"""Sync the canonical, hardware-independent editor catalog into the web boundary."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    source = ROOT / 'device-library/editor/components.json'
    catalog = json.loads(source.read_text(encoding='utf-8'))
    types = [component['type'] for component in catalog['components']]
    if len(types) != len(set(types)):
        raise ValueError('Duplicate editor type')
    target = ROOT / 'apps/web/src/data/editorCatalog.json'
    target.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'Synced {len(types)} functional editor definitions')


if __name__ == '__main__':
    main()
