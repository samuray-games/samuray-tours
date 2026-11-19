#!/usr/bin/env python3
"""Fetch verified Wikimedia Commons photography and save as compact WebP assets."""
from io import BytesIO
from pathlib import Path
import time
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
DIRECTORY = Path("assets/tour-photos")
DIRECTORY.mkdir(parents=True, exist_ok=True)
session = requests.Session()
session.headers.update({"User-Agent":"SamuRayToursCatalog/1.0 (catalog visual assets; https://github.com/samuray-games/samuray-tours)"})

def get(url, params=None):
    for delay in (0, 10, 25, 50):
        if delay: time.sleep(delay)
        response=session.get(url,params=params,timeout=65)
        if response.status_code in (429,500,502,503,504):
            print("Backoff",response.status_code,url[:70],flush=True)
            continue
        response.raise_for_status()
        return response
    raise RuntimeError("Repeated rate limiting from Wikimedia Commons")

todo = {key: filename for key,filename in PHOTOS.items() if not (DIRECTORY / (key+".webp")).exists()}
if not todo:
    print("All photo assets already available.")
    raise SystemExit(0)

api = "https://commons.wikimedia.org/w/api.php"
params = {
    "action":"query","format":"json","prop":"imageinfo",
    "iiprop":"url","iiurlwidth":"1200",
    "titles":"|".join("File:"+name for name in todo.values()),
}
pages = get(api,params).json()["query"]["pages"]
lookup={str(v.get("title","")).replace("_"," ").lower():v for v in pages.values()}
failures=[]
for key,filename in todo.items():
    try:
        page=lookup.get(("File:"+filename).lower())
        if not page or "imageinfo" not in page: raise RuntimeError("Image not found on Commons")
        info=page["imageinfo"][0]
        data=None
        for url in (info.get("thumburl"),info.get("url")):
            if not url:continue
            try:
                r=get(url)
                if r.headers.get("Content-Type","").startswith("image/"):
                    data=r.content
                    break
            except Exception as exc:
                print("Retrying alternative",key,exc,flush=True)
        if not data: raise RuntimeError("No image response")
        im=Image.open(BytesIO(data))
        im=ImageOps.exif_transpose(im).convert("RGB")
        im.thumbnail((1280,1280),Image.Resampling.LANCZOS)
        if im.width<300 or im.height<250: raise RuntimeError("Image below minimum dimensions")
        path=DIRECTORY/(key+".webp")
        im.save(path,"WEBP",quality=82,method=6)
        print("SAVED",key,im.size,path.stat().st_size,flush=True)
        time.sleep(2.2)
    except Exception as exc:
        print("UNAVAILABLE",key,str(exc),flush=True)
        failures.append(key)
print("Saved",len(todo)-len(failures),"of",len(todo),"missing:",failures,flush=True)
# Do not fail an otherwise useful batch: the workflow commits successes, and
# remaining photo URLs have a live Commons fallback in catalog-photography.js.
