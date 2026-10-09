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
import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "icon .svg"
OUTPUT = ROOT / "apps/web/src/assets/icons"


def remove_white_bg(img: Image.Image) -> Image.Image:
    """Remove outer white background while preserving internal white components and antialiasing edges."""
    rgba = np.array(img.convert("RGBA"))
    h, w = rgba.shape[:2]
    # Check if corner pixels are near-white
    corners = [rgba[0, 0], rgba[0, w - 1], rgba[h - 1, 0], rgba[h - 1, w - 1]]
    if not any(all(c[:3] > 230) and c[3] > 128 for c in corners):
        return img

    min_rgb = np.min(rgba[:, :, :3], axis=2)
    is_white = min_rgb >= 238
    bin_mask = np.zeros((h, w), dtype=np.uint8)
    bin_mask[is_white] = 255
    flood_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    seeds = [(x, 0) for x in range(w) if is_white[0, x]] + \
            [(x, h - 1) for x in range(w) if is_white[h - 1, x]] + \
            [(0, y) for y in range(h) if is_white[y, 0]] + \
            [(w - 1, y) for y in range(h) if is_white[y, w - 1]]
    for sx, sy in seeds:
        if flood_mask[sy + 1, sx + 1] == 0 and bin_mask[sy, sx] == 255:
            cv2.floodFill(bin_mask, flood_mask, (sx, sy), 128)
    bg_mask = (bin_mask == 128)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    dilated_bg = cv2.dilate(bg_mask.astype(np.uint8), kernel, iterations=1)
    transition = (dilated_bg > 0) & (~bg_mask) & (min_rgb >= 215)
    alpha = rgba[:, :, 3].astype(np.float32)
    alpha[bg_mask] = 0.0
    trans_factor = np.clip((255.0 - min_rgb[transition].astype(np.float32)) / (255.0 - 215.0), 0.0, 1.0)
    alpha[transition] *= trans_factor
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    return Image.fromarray(rgba)


def remove_white_bg_breadboard(orig: Image.Image) -> Image.Image:
    """Specialized high-resolution background removal for breadboards preserving off-white ABS plastic."""
    rgba = np.array(orig.convert("RGBA"))
    h, w = rgba.shape[:2]
    min_rgb = np.min(rgba[:, :, :3], axis=2)
    is_white = min_rgb >= 252
    bin_mask = np.zeros((h, w), dtype=np.uint8)
    bin_mask[is_white] = 255
    flood_mask = np.zeros((h + 2, w + 2), dtype=np.uint8)
    seeds = [(x, 0) for x in range(w) if is_white[0, x]] + \
            [(x, h - 1) for x in range(w) if is_white[h - 1, x]] + \
            [(0, y) for y in range(h) if is_white[y, 0]] + \
            [(w - 1, y) for y in range(h) if is_white[y, w - 1]]
    for sx, sy in seeds:
        if flood_mask[sy + 1, sx + 1] == 0 and bin_mask[sy, sx] == 255:
            cv2.floodFill(bin_mask, flood_mask, (sx, sy), 128)
    bg_mask = (bin_mask == 128)
    alpha = rgba[:, :, 3].astype(np.float32)
    alpha[bg_mask] = 0.0
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    dilated_bg = cv2.dilate(bg_mask.astype(np.uint8), kernel, iterations=1)
    transition = (dilated_bg > 0) & (~bg_mask) & (min_rgb >= 248)
    trans_factor = np.clip((255.0 - min_rgb[transition].astype(np.float32)) / (255.0 - 248.0), 0.0, 1.0)
    alpha[transition] *= trans_factor
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)
    cleaned = Image.fromarray(rgba)
    mask = rgba[:, :, 3] > 10
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    pad = 8
    y0 = max(0, rows[0] - pad)
    y1 = min(h, rows[-1] + 1 + pad)
    x0 = max(0, cols[0] - pad)
    x1 = min(w, cols[-1] + 1 + pad)
    return cleaned.crop((x0, y0, x1, y1))


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    montage = Image.new("RGB", (5 * 200, 5 * 220), "#202c3b")
    draw = ImageDraw.Draw(montage)
    for index, path in enumerate(sorted(SOURCE.glob("*.svg"))):
        raw = path.read_bytes()
        match = re.search(rb"data:image/png;base64,([A-Za-z0-9+/=\s]+)", raw)
        if match is None:
            raise ValueError(f"Expected embedded PNG in {path.name}")
        with Image.open(io.BytesIO(base64.b64decode(match.group(1)))) as original:
            if "breadboard" in path.name:
                artwork = remove_white_bg_breadboard(original)
                artwork.thumbnail((220, 220), Image.Resampling.LANCZOS)
                quality = 82
            else:
                artwork = original.convert("RGBA")
                artwork.thumbnail((160, 160), Image.Resampling.LANCZOS)
                artwork = remove_white_bg(artwork)
                quality = 82
        encoded = io.BytesIO()
        artwork.save(encoded, format="WEBP", quality=quality, method=6)
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
