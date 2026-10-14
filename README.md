# qiaosungithub.github.io

Personal website of Qiao Sun, served by GitHub Pages at https://qiaosungithub.github.io/.

It is a plain static site; `.nojekyll` tells GitHub Pages to publish the files as they are.

- `index.html`: the whole page. Edit the content here.
- `assets/css/site.css`: styles, including the light and dark colors.
- `assets/js/site.js`: the theme toggle, the top bar, and scroll reveal. The page works without it.
- `tools/stamp_assets.py`: run it after editing `site.css` or `site.js`. It puts a content hash in their URLs (`?v=…`) so a reload never pairs the new page with a stale cached copy.
- `assets/pdf/Qiao-Sun-CV.pdf`: the CV linked from the page. `resume.pdf` is an identical copy kept so older links still work; replace both when the CV changes.
- `assets/fonts/`: self-hosted Newsreader (a display cut and an italic text cut, both Basic Latin only) and Source Sans 3, all under the SIL Open Font License (license texts alongside).

Preview locally with `python3 -m http.server` in this directory and open http://localhost:8000/.
