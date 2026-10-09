"""Reproducibly thumbnail supplied SVG/embedded-PNG artwork; never modify originals.

Run from the repository root with Python + Pillow. Generated SVGs are committed,
so ordinary frontend builds and CI do not require Pillow.
"""
from pathlib import Path
import base64
import hashlib
import io
import json
import re
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "icon .svg"
OUTPUT = ROOT / "apps/web/src/assets/icons"


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    montage = Image.new("RGB", (5 * 200, 4 * 220), "#202c3b")
    draw = ImageDraw.Draw(montage)
    for index, path in enumerate(sorted(SOURCE.glob("*.svg"))):
        raw = path.read_bytes()
        match = re.search(rb"data:image/png;base64,([A-Za-z0-9+/=\s]+)", raw)
        if match is None:
            raise ValueError(f"Expected embedded PNG in {path.name}")
        with Image.open(io.BytesIO(base64.b64decode(match.group(1)))) as original:
            artwork = original.convert("RGBA")
            artwork.thumbnail((160, 160), Image.Resampling.LANCZOS)
        encoded = io.BytesIO()
        artwork.save(encoded, format="WEBP", quality=82, method=6)
        payload = base64.b64encode(encoded.getvalue()).decode("ascii")
        width, height = artwork.size
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
               f'viewBox="0 0 {width} {height}"><image width="{width}" height="{height}" '
               f'href="data:image/webp;base64,{payload}"/></svg>\n')
        target = OUTPUT / path.name
        target.write_text(svg, encoding="utf-8", newline="\n")
        manifest.append({"file": path.name, "source": path.relative_to(ROOT).as_posix(),
                         "sha256": hashlib.sha256(raw).hexdigest(), "source_bytes": len(raw),
                         "output_bytes": len(svg.encode("utf-8"))})
        x, y = index % 5 * 200, index // 5 * 220
        montage.paste(artwork, (x + (200 - width) // 2, y + 10), artwork)
        draw.text((x + 8, y + 180), path.name, fill="white")
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    metadata = {}
    for relative in ["logic-ic/74hc08.json", "breadboards/generic-full-size.json"]:
        entry = json.loads((ROOT / "device-library" / relative).read_text(encoding="utf-8"))
        metadata[entry["id"]] = entry
    (ROOT / "apps/web/src/data/deviceMetadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    preview = ROOT / ".superpowers" / "icon-preview.png"
    preview.parent.mkdir(exist_ok=True)
    montage.save(preview)
    print(f"Prepared {len(manifest)} icons: {sum(m['source_bytes'] for m in manifest):,} -> "
          f"{sum(m['output_bytes'] for m in manifest):,} bytes")


if __name__ == "__main__":
    main()
