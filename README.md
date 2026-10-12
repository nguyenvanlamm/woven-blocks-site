# Woven Blocks — website

Static site for Woven Blocks, a fair block puzzle:

- `index.html`: the landing page.
- `privacy.html`: the Privacy Policy URL.
- `support.html`: the Support URL.
- `play/`: the game's web build.
- `404.html`: catches missing pages.

No build step for the pages, and nothing loads from other servers.

Live: https://nguyenvanlamm.github.io/woven-blocks-site/

Published by GitHub Pages from the root of `main`.

```bash
python3 -m http.server 8092   # pages at http://localhost:8092/
```

`play/` only runs at `/woven-blocks-site/play/`, because it was built with that base href. To try it locally, serve the parent folder of this repo and open http://localhost:8092/woven-blocks-site/play/.

## Design

The direction is Swiss Monochrome over the game's own palette:

- Paper and ink come from the app.
- Hairline frame.
- An 8-column page grid, matching the 8-column board.
- Mono labels.
- Colour appears only in the tiles.

The design sources live in the game repo under `design/landing/`: the brief, the three explored directions, the approved one, and `share-card.html`.

- Fonts: Bricolage Grotesque, Hanken Grotesk and Geist Mono, subset to Latin WOFF2 (SIL Open Font License, see `assets/fonts/OFL-*.txt`).
- Screenshots: WebP copies of real captures of the game (`assets/img/shots/`).
- Share card: `assets/img/share-card.png` (1200×630), the `og:image` of every page. To re-render it, together with `favicon.png` and `apple-touch-icon.png`, run `node design/landing/tools/render_site_images.mjs --site <this repo>` from the game repo.

## Updating the game in `play/`

Build in the game repo:

```bash
flutter build web --wasm --release --base-href /woven-blocks-site/play/ --no-web-resources-cdn \
  --dart-define=SHARE_URL=https://nguyenvanlamm.github.io/woven-blocks-site/ -o /tmp/wb-web
```

Then, in this repo:

```bash
rm -rf play && cp -a /tmp/wb-web play
rm -f play/.last_build_id
find play/canvaskit -name '*.symbols' -delete
rm -rf play/canvaskit/wimp* play/canvaskit/*webparagraph
tools/subset-play-fonts.sh play   # needs fonttools
```

- `--wasm` loads about 15% fewer bytes than the JS build: about 2.8 MB instead of 3.4 MB on the wire. Browsers with WasmGC (Chrome 119+, Firefox 120+, Safari 18.2+) run `main.dart.wasm` on `canvaskit/skwasm.*`. Firefox and Safari use `skwasm_heavy.*`. Older browsers fall back to `main.dart.js` on `canvaskit/canvaskit.*` or `canvaskit/chromium/canvaskit.*`. Keep all of these.
- Without cross-origin isolation, which GitHub Pages can't enable, skwasm runs single-threaded and logs a console warning. That is expected.
- `SHARE_URL` puts the link in the Daily and Classic share texts. Without it, shared results carry no link.
- `--no-web-resources-cdn` makes the build serve its own engine, so the game loads nothing from Google's servers. The privacy policy states this.
- `subset-play-fonts.sh` cuts the fonts to Latin, about 45% smaller. The ranges are broad because a missing glyph would make Flutter fetch a fallback font from fonts.gstatic.com. If the game gains new symbols or languages, extend the ranges.
- The wimp and webparagraph engines and the `.symbols` files are not needed.
- The game uses path URLs. When a game screen is reloaded, GitHub Pages serves `404.html`, which sends the visitor back to `play/`. The board is saved, so nothing is lost. If the site moves to another path or a custom domain, update `<base href>` in `404.html` and rebuild with the new `--base-href`.

## Search and AI files

`sitemap.xml`, `llms.txt`, the JSON-LD in each page, and the Markdown copies (`index.html.md`, `privacy.html.md`, `support.html.md`) all repeat the pages' text. When a page changes, update these in the same commit:

- its `.html.md`
- `llms.txt`
- the JSON-LD
- the sitemap `lastmod`

Crawlers read robots.txt only at the host root (`nguyenvanlamm.github.io/robots.txt`), which this repo cannot serve.

## When the iOS app ships

- **Get it** section: replace "Coming soon to the App Store" with the official App Store badge and link.
- Hero note under "Play in your browser": same change.
- Add the `apple-itunes-app` meta tag (see the comment in `index.html`).
- JSON-LD in `index.html`: add the App Store URL and add iOS to `gamePlatform`.
- Replace "coming soon" in `llms.txt`, `index.html.md` and the Support FAQ.
