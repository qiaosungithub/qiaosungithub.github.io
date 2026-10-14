#!/usr/bin/env python3
"""Stamp stylesheet and script URLs with a content hash.

GitHub Pages lets browsers cache assets for ten minutes, so without this a
reload can pair a new page with an old cached script. Run after editing
assets/css/site.css or assets/js/site.js.
"""
import hashlib
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
assets = ["assets/css/site.css", "assets/js/site.js"]

for page in ["index.html", "404.html"]:
    path = root / page
    html = path.read_text(encoding="utf-8")
    for asset in assets:
        digest = hashlib.sha1((root / asset).read_bytes()).hexdigest()[:8]
        html = re.sub(r'(/?%s)(\?v=[0-9a-f]+)?"' % re.escape(asset), r'\g<1>?v=%s"' % digest, html)
    path.write_text(html, encoding="utf-8")

print("stamped:", ", ".join(f"{a} {hashlib.sha1((root / a).read_bytes()).hexdigest()[:8]}" for a in assets))
