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


def clean_artwork(orig: Image.Image, is_breadboard: bool = False) -> Image.Image:
    """Remove outer white background while preserving internal white components and antialiasing edges."""
    img = orig.convert("RGBA")
    rgba = np.array(img)
    h, w = rgba.shape[:2]

    # Check if corner pixels are near-white
    corners = [rgba[0, 0], rgba[0, w - 1], rgba[h - 1, 0], rgba[h - 1, w - 1]]
    if not any(all(c[:3] > 230) and c[3] > 128 for c in corners):
        return img

    min_rgb = np.min(rgba[:, :, :3], axis=2)

    if is_breadboard:
        thresh = 252
        trans_thresh = 248
        ksize = 3
    else:
        thresh = 248
        trans_thresh = 210
        ksize = 5

    is_white = min_rgb >= thresh
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
    bg = (bin_mask == 128)

    # Edge transition zone via morphological dilation
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (ksize, ksize))
    dilated_bg = cv2.dilate(bg.astype(np.uint8), kernel, iterations=1)
    trans = (dilated_bg > 0) & (~bg) & (min_rgb >= trans_thresh)

    alpha = np.full((h, w), 255, dtype=np.float32)
    alpha[bg] = 0.0

    # Linear alpha falloff in transition zone
    alpha[trans] = np.clip((255.0 - min_rgb[trans].astype(np.float32)) / (255.0 - trans_thresh) * 255.0, 0.0, 255.0)

    # RGB unmixing / defringing: strip out white background contamination from RGB channels
    unmix = (alpha > 0) & (alpha < 255)
    a_norm = (alpha[unmix] / 255.0)[:, None]
    rgb_unmixed = (rgba[unmix, :3].astype(np.float32) - (1.0 - a_norm) * 255.0) / np.maximum(a_norm, 0.05)
    rgba[unmix, :3] = np.clip(rgb_unmixed, 0, 255).astype(np.uint8)

    # Zero RGB on background so downsampling filter does not sample 255 white from transparent pixels
    rgba[bg, :3] = 0
    rgba[:, :, 3] = np.clip(alpha, 0, 255).astype(np.uint8)

    cleaned = Image.fromarray(rgba)
    if is_breadboard:
        mask = rgba[:, :, 3] > 10
        rows = np.where(mask.any(axis=1))[0]
        cols = np.where(mask.any(axis=0))[0]
        pad = 8
        y0 = max(0, rows[0] - pad)
        y1 = min(h, rows[-1] + 1 + pad)
        x0 = max(0, cols[0] - pad)
        x1 = min(w, cols[-1] + 1 + pad)
        cleaned = cleaned.crop((x0, y0, x1, y1))

    return cleaned


def remove_white_bg(img: Image.Image) -> Image.Image:
    return clean_artwork(img, is_breadboard=False)


def remove_white_bg_breadboard(orig: Image.Image) -> Image.Image:
    return clean_artwork(orig, is_breadboard=True)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source_names = {p.name for p in SOURCE.glob("*.svg")}
    for existing in OUTPUT.glob("*.svg"):
        if existing.name not in source_names:
            existing.unlink()
    manifest = []
    montage = Image.new("RGB", (5 * 200, 5 * 220), "#202c3b")
    draw = ImageDraw.Draw(montage)
    for index, path in enumerate(sorted(SOURCE.glob("*.svg"))):
        raw = path.read_bytes()
        match = re.search(rb"data:image/png;base64,([A-Za-z0-9+/=\s]+)", raw)
        if match is None:
            raise ValueError(f"Expected embedded PNG in {path.name}")
        with Image.open(io.BytesIO(base64.b64decode(match.group(1)))) as original:
            is_bb = "breadboard" in path.name
            artwork = clean_artwork(original, is_breadboard=is_bb)
            if is_bb:
                artwork.thumbnail((220, 220), Image.Resampling.LANCZOS)
                quality = 80
            else:
                artwork.thumbnail((140, 140), Image.Resampling.LANCZOS)
                quality = 72
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
