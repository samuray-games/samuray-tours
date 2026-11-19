#!/usr/bin/env python3
"""Download and optimize freely licensed Tokyo location photography.

Sources, authors and licenses are shown to visitors by assets/catalog-photography.js.
Run as a GitHub Action to vendor photos under assets/tour-photos.
"""
from io import BytesIO
from pathlib import Path
from urllib.parse import quote
import requests
from PIL import Image, ImageOps

PHOTOS = {
    "shibuya": "Shibuya crossing at night.jpg",
    "asakusa": "Kaminari-mon.jpg",
    "tsukiji": "Tsukiji Outer Market.jpg",
    "ginza": "Ginza Wako Clock.jpg",
    "akiba": "Akihabara Night.jpg",
    "yanaka": "Yanaka Ginza entrance.jpg",
    "shinjuku": "2024-10-20 Shinjuku Golden Gai at night.jpg",
    "classic": "Five-storied Pagoda and Tokyo Skytree.jpg",
    "garden": "Koishikawa Korakuen.jpg",
    "sakura": "Cherry blossoms in Chidorigafuchi.jpg",
    "station": "Tokyo Station Marunouchi building.jpg",
    "bay": "Rainbow Bridge as seen from Odaiba at night.jpg",
    "fuji": "Fuji Kawaguchi 457.JPG",
    "kamakura": "The Great Buddha of Kamakura (Daibutsu).jpg",
    "karaoke": "Room 601, Karaoke Kan, Tokyo.jpg",
}

OUTPUT_DIR = Path("assets/tour-photos")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
session = requests.Session()
session.headers.update({"User-Agent":"SamuRayToursCatalog/1.0 (Wikimedia Commons photo attribution)"})
failed = []
for key, filename in PHOTOS.items():
    target = OUTPUT_DIR / f"{key}.webp"
    try:
        api = "https://commons.wikimedia.org/w/api.php"
        params = {
            "action": "query", "format": "json", "prop": "imageinfo",
            "iiprop": "url", "iiurlwidth": "1200",
            "titles": f"File:{filename}"
        }
        response = session.get(api, params=params, timeout=40)
        response.raise_for_status()
        pages = response.json()["query"]["pages"]
        page = next(iter(pages.values()))
        info = page["imageinfo"][0]
        candidates = [info.get("thumburl"), info.get("url")]
        blob = None
        for source in candidates:
            if not source: continue
            r = session.get(source, timeout=65)
            if r.ok and r.content and r.headers.get("Content-Type","").startswith("image/"):
                blob = r.content
                break
        if blob is None:
            raise RuntimeError("No valid image response")
        picture = Image.open(BytesIO(blob))
        picture = ImageOps.exif_transpose(picture).convert("RGB")
        picture.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
        if picture.width < 300 or picture.height < 250:
            raise RuntimeError("Too small for a catalog cover")
        picture.save(target, "WEBP", quality=82, method=6)
        print(f"OK {key}: {picture.size}, {target.stat().st_size} bytes")
    except Exception as exc:
        failed.append((key, str(exc)))
        print(f"FAILED {key}: {exc}")

if failed:
    print("Missing photos:", failed)
    raise SystemExit(1)
print(f"Saved {len(PHOTOS)} tour photos.")
