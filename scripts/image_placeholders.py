"""Generate tiny blurred previews for app banners (used as next/image blurDataURL).

Run after `npm run import:collection` whenever banners change:
    python scripts/image_placeholders.py
"""

from __future__ import annotations

import base64
import io
import json
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
BANNERS = ROOT / "public" / "images" / "banners"
OUT = ROOT / "src" / "data" / "image-placeholders.generated.json"
SIZE = (24, 14)


def placeholder(path: Path) -> str:
    with Image.open(path) as im:
        small = im.convert("RGB").resize(SIZE, Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
        buf = io.BytesIO()
        small.save(buf, "WEBP", quality=40, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode("ascii")


def main() -> None:
    result = {
        f"/images/banners/{p.name}": placeholder(p)
        for p in sorted(BANNERS.glob("*.webp"))
    }
    OUT.write_text(json.dumps(result, indent=1) + "\n", encoding="utf-8")
    avg = sum(len(v) for v in result.values()) / max(len(result), 1)
    print(f"Wrote {len(result)} banner placeholders to {OUT.relative_to(ROOT)} (avg {avg:.0f} chars)")


if __name__ == "__main__":
    main()
