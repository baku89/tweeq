# Colors

Tweeq builds its whole color system from four inputs — **accent**, **gray**,
**background**, and **light/dark** — in the spirit of [Radix's custom palette
generator](https://www.radix-ui.com/colors/custom). Each input color is fit to a
12-step OKLCH scale against the chosen background, so contrast is engineered into
the step roles (step 9 = solid fill, 11/12 = text, 6/7 = borders…).

Semantic and syntax colors come from a single **curated base16-style palette**
([à la base16](https://github.com/chriskempson/base16)). That palette is *nudged*
toward the accent — each hue leans toward it in hue and vibrancy, but bounded
(±24° of hue, with a chroma floor) so a danger red stays recognizably red. Both
the UI semantics and the editor syntax are extracted from this one themed
palette, so they stay consistent and follow the accent together.

Tweak the inputs below to see every derived scale, semantic color, and palette
hue update live.

<ClientOnly>
<ColorPaletteDemo />
</ClientOnly>

## How it fits together

- **`generateThemeColorsRadix`** — accent + gray scales for the UI chrome.
- **`generateRadixScale(seed)`** — the same engine for any single hue.
- **`nudgePalette(accent)`** — the curated palette nudged toward the accent: the
  one themed source both of the next two draw from.
- **`buildSemanticColors`** — themed palette → `error`, `warning`, `success`,
  `info`, `rec`.
- **`buildMonacoTheme`** — themed palette mapped onto editor token types.

The palette is a single source of truth: swap it (or expose it as a chooseable
preset) to reskin every semantic and syntax color at once.
