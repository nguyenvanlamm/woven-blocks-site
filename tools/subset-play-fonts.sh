#!/usr/bin/env bash
# Subset the game's bundled fonts in a web build to Latin text, about 45% fewer bytes.
#
# The game is English only and has no text input, so it never draws glyphs
# outside these ranges. The ranges stay broad on purpose: when a glyph is
# missing, Flutter fetches a Noto fallback from fonts.gstatic.com, which the
# privacy policy rules out. Run from the site repo after copying the build:
#
#   tools/subset-play-fonts.sh play
#
# Needs fonttools (pip install fonttools).
set -euo pipefail

build="${1:?usage: tools/subset-play-fonts.sh <web build dir>}"
fonts="$build/assets/assets/fonts"
[ -d "$fonts" ] || { echo "no fonts in $fonts" >&2; exit 1; }
command -v pyftsubset >/dev/null || { echo "pyftsubset not found: pip install fonttools" >&2; exit 1; }

# Basic Latin, Latin-1, typographic punctuation (– — ’ “ ” … ·), super- and
# subscripts (²), € ™, arrows, minus, block elements and geometric shapes.
unicodes="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2070-209F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+2580-259F,U+25A0-25FF"

for f in "$fonts"/*.ttf; do
  before=$(stat -c%s "$f")
  pyftsubset "$f" --unicodes="$unicodes" --layout-features='*' --output-file="$f.sub" 2>/dev/null
  mv "$f.sub" "$f"
  printf '%-36s %7d -> %7d bytes\n' "$(basename "$f")" "$before" "$(stat -c%s "$f")"
done
