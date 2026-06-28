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
