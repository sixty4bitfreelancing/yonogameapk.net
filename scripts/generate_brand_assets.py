"""Build the default social preview image from the brand banner.

Usage: python scripts/generate_brand_assets.py

Input:  source-assets/brand/og-banner.png  (any size; centre-cropped to 1.91:1)
Output: public/brand/og-default.jpg        (1200x630, the Open Graph / Twitter card image)

The logo (public/brand/logo.webp), favicons, Apple touch icon, Android icons and
public/site.webmanifest are supplied brand files and are used as-is.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "source-assets" / "brand" / "og-banner.png"
OUTPUT = ROOT / "public" / "brand" / "og-default.jpg"
WIDTH, HEIGHT = 1200, 630


def main() -> None:
    with Image.open(SOURCE) as im:
        im = im.convert("RGB")
        scale = max(WIDTH / im.width, HEIGHT / im.height)
        resized = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
        left = (resized.width - WIDTH) // 2
        top = (resized.height - HEIGHT) // 2
        resized.crop((left, top, left + WIDTH, top + HEIGHT)).save(OUTPUT, "JPEG", quality=85, optimize=True, progressive=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT).as_posix()} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
