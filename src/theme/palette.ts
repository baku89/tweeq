import Color from 'colorjs.io'

import {generateRadixScale, type RadixScale} from './radix'
import type {ColorMode} from './types'

/**
 * A base16-style curated hue palette — the single source of truth for both the
 * UI's semantic colors (error/warning/success/…) and the code editor's syntax
 * highlighting. Seeded from Radix's canonical step-9 hues so the scale
 * generator reproduces clean, mutually-distinct families. Swap these (or make
 * them a chooseable preset) to reskin every semantic/syntax color at once.
 */
export const PALETTE = {
	red: '#e5484d',
	orange: '#f76b15',
	yellow: '#ffc53d', // amber
	green: '#46a758', // grass
	teal: '#12a594',
	cyan: '#00a2c7',
	blue: '#3e63dd',
	purple: '#8e4ec6',
	magenta: '#d6409f', // plum-pink
} as const

export type PaletteHue = keyof typeof PALETTE

// --- Accent nudge (applied to the editor syntax only) ------------------------
// Pull a hue slightly toward the accent so the theme feels cohesive, without
// letting it leave its canonical band. The ±MAX_DEG clamp is what guarantees
// recognizability even when the accent sits on the opposite side of the wheel.
const NUDGE_T = 0.3 // fraction of the way toward the accent hue
const NUDGE_MAX_DEG = 24 // hard cap on the hue shift from the canonical seed
const CHROMA_MIX = 0.5 // pull vibrancy toward the accent's chroma
const CHROMA_FLOOR = 0.5 // never drop below this fraction of the seed's chroma

// --- Semantic colors -----------------------------------------------------------
// Radix's vividness and Material's harmony. Each color keeps the palette's own
// lightness and chroma, so amber stays bright and red stays saturated, and only its
// hue reacts to the accent, in OKLCH, within a narrow band so it keeps its meaning:
// - Harmonize: lean slightly toward the accent (Material's "harmonize").
// - Separate: if that leaves it too close to the accent, move away, so an error
//   doesn't read as the primary color.
// A grey accent has no hue to react to; it fades out by the accent's chroma.
const HARMONY_RATIO = 0.15 // fraction of the hue distance to lean
const HARMONY_MAX_DEG = 8 // however far apart the two are
const SEPARATION_DEG = 24 // the closest a semantic hue gets to the accent's
const SEMANTIC_MAX_SHIFT_DEG = 20 // hard cap from the palette hue, so red stays red
const ACCENT_CHROMA_FULL = 0.05 // the accent's hue counts fully from this chroma
const MIN_CONTRAST = 4.5 // these are read as text, too

/** Signed shortest distance from hue `a` to hue `b`, in degrees. */
function hueDelta(a: number, b: number) {
	return ((b - a + 540) % 360) - 180
}

/** A palette hue as it reacts to the accent. */
export function semanticHue(seedHue: number, accentHue: number, accentChroma: number) {
	if (Number.isNaN(accentHue) || accentHue === null) return seedHue
	const weight = Math.min(accentChroma / ACCENT_CHROMA_FULL, 1)

	const toAccent = hueDelta(seedHue, accentHue)
	const lean = clamp(toAccent * HARMONY_RATIO, -HARMONY_MAX_DEG, HARMONY_MAX_DEG)

	// What's left between them after leaning, and how much further to get clear.
	const apart = Math.abs(toAccent - lean)
	const away = toAccent === 0 ? 1 : -Math.sign(toAccent)
	const shift = apart < SEPARATION_DEG ? lean + away * (SEPARATION_DEG - apart) : lean

	const capped = clamp(shift * weight, -SEMANTIC_MAX_SHIFT_DEG, SEMANTIC_MAX_SHIFT_DEG)
	return ((seedHue + capped) % 360 + 360) % 360
}

// Lean a seed hue toward the accent hue along the shorter arc, bounded so it
// can't leave its canonical band. Returns the seed hue unchanged when either is
// achromatic.
function nudgedHue(seedHue: number, accentHue: number): number {
	if (Number.isNaN(seedHue) || Number.isNaN(accentHue)) return seedHue
	const delta = ((accentHue - seedHue + 540) % 360) - 180
	const shifted = clamp(
		seedHue + delta * NUDGE_T,
		seedHue - NUDGE_MAX_DEG,
		seedHue + NUDGE_MAX_DEG
	)
	return ((shifted % 360) + 360) % 360
}

// Full hue + chroma nudge of a seed (lightness stays). Used to build the themed
// palette the editor syntax draws from.
function nudgeTowardAccent(seedHex: string, accentHex: string): string {
	const seed = new Color(seedHex).to('oklch')
	const accent = new Color(accentHex).to('oklch')

	const [sl, sc, sh] = seed.coords
	const ac = accent.coords[1]
	const ah = accent.coords[2]

	if (Number.isNaN(sh) || Number.isNaN(ah)) return seedHex

	// Track the accent's vibrancy, but keep a floor so a muted accent can't wash
	// the hue out entirely.
	const chroma = Math.max(sc + (ac - sc) * CHROMA_MIX, sc * CHROMA_FLOOR)

	return new Color('oklch', [sl, chroma, nudgedHue(sh, ah)])
		.to('srgb')
		.toString({format: 'hex'})
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

// Step role within a Radix scale used by the editor theme.
const TEXT = 10 // step 11 — readable token text on the background

export interface SemanticColors {
	colorError: string
	colorErrorSoft: string
	/** Text and icons on a colorError fill. */
	colorOnError: string
	colorWarning: string
	colorWarningSoft: string
	colorSuccess: string
	colorSuccessSoft: string
	/**
	 * Recording indicator: the canonical red, at its own full intensity.
	 */
	colorRec: string
	colorInfo: string
	colorInfoSoft: string
	/** Back-compat alias used by older call sites; == success. */
	colorAffirmative: string
}

function toHex(color: Color) {
	return color.to('srgb').toGamut({space: 'srgb'}).toString({format: 'hex', collapse: false})
}

function semanticColor(seedHex: string, accentHex: string, background: string): string {
	const [seedL, seedC, seedH] = new Color(seedHex).to('oklch').coords
	const [, accentC, accentH] = new Color(accentHex).to('oklch').coords
	const hue = semanticHue(seedH, accentH, accentC)

	// Readable on the background: move the lightness away from it only as far as
	// that takes. The blue lifts on dark; the amber drops on white.
	const step = new Color(background).to('oklch').coords[0] < 0.5 ? 0.01 : -0.01
	let lightness = seedL
	let hex = toHex(new Color('oklch', [lightness, seedC, hue]))
	while (
		new Color(hex).contrast(new Color(background), 'WCAG21') < MIN_CONTRAST &&
		lightness > 0.2 &&
		lightness < 0.95
	) {
		lightness += step
		hex = toHex(new Color('oklch', [lightness, seedC, hue]))
	}
	return hex
}

/** A soft tinted background: the color blended toward the background. */
function softTint(background: string, color: string): string {
	return new Color(Color.mix(background, color, 0.15, {space: 'oklch'}))
		.to('srgb')
		.toString({format: 'hex'})
}

export interface HueColors {
	colorHueRed: string
	colorHueOrange: string
	colorHueYellow: string
	colorHueGreen: string
	colorHueTeal: string
	colorHueCyan: string
	colorHueBlue: string
	colorHuePurple: string
	colorHueMagenta: string
}

/**
 * Each hue as text on the background, for what is told apart by color and is neither
 * right nor wrong, as a kind of value is. Not nudged, so that each stays what it is.
 */
export function buildHueColors({
	appearance,
	background,
}: {
	appearance: ColorMode
	background: string
}): HueColors {
	const s = paletteScales(PALETTE, appearance, background)
	return {
		colorHueRed: s.red.scale[TEXT],
		colorHueOrange: s.orange.scale[TEXT],
		colorHueYellow: s.yellow.scale[TEXT],
		colorHueGreen: s.green.scale[TEXT],
		colorHueTeal: s.teal.scale[TEXT],
		colorHueCyan: s.cyan.scale[TEXT],
		colorHueBlue: s.blue.scale[TEXT],
		colorHuePurple: s.purple.scale[TEXT],
		colorHueMagenta: s.magenta.scale[TEXT],
	} as HueColors
}

export function buildSemanticColors({
	background,
	accent,
}: {
	background: string
	accent: string
}): SemanticColors {
	const color = (seed: string) => semanticColor(seed, accent, background)

	const error = color(PALETTE.red)
	const warning = color(PALETTE.yellow)
	const success = color(PALETTE.green)
	const info = color(PALETTE.blue)

	return {
		colorError: error,
		colorErrorSoft: softTint(background, error),
		colorOnError: '#ffffff',
		colorWarning: warning,
		colorWarningSoft: softTint(background, warning),
		colorSuccess: success,
		colorSuccessSoft: softTint(background, success),
		colorRec: PALETTE.red, // canonical, never accent-nudged
		colorInfo: info,
		colorInfoSoft: softTint(background, info),
		colorAffirmative: success,
	}
}

/**
 * The themed palette (hue + chroma nudged) fit to full 12-step scales — used by
 * the editor syntax theme, which needs readable text steps per token.
 */
export function nudgePalette(accent: string): Record<PaletteHue, string> {
	return Object.fromEntries(
		Object.entries(PALETTE).map(([name, seed]) => [
			name,
			nudgeTowardAccent(seed, accent),
		])
	) as Record<PaletteHue, string>
}

export function paletteScales(
	palette: Record<PaletteHue, string>,
	appearance: ColorMode,
	background: string
): Record<PaletteHue, RadixScale> {
	return Object.fromEntries(
		Object.entries(palette).map(([name, seed]) => [
			name,
			generateRadixScale({appearance, background, seed}),
		])
	) as Record<PaletteHue, RadixScale>
}

// --- Monaco editor theme ----------------------------------------------------

export interface MonacoThemeData {
	base: 'vs' | 'vs-dark'
	inherit: boolean
	rules: {token: string; foreground?: string; fontStyle?: string}[]
	colors: Record<string, string>
}

// colorjs.io collapses #112233 → #123 and #111111 → #111, but Monaco's theme
// parser rejects 3/4-digit hex (in both `colors` and token `rules`) — it wants
// the full 6/8-digit form. Expand back before handing colors to Monaco.
function toFullHex(hex: string): string {
	const h = hex.replace('#', '')
	const full =
		h.length === 3 || h.length === 4
			? h
					.split('')
					.map(c => c + c)
					.join('')
			: h
	return '#' + full
}

const noHash = (hex: string) => toFullHex(hex).slice(1)

export function buildMonacoTheme({
	appearance,
	background,
	accent,
	foreground,
	comment,
	cursor,
	selection,
}: {
	appearance: ColorMode
	background: string
	/** UI accent — the palette is nudged toward it, like the semantic colors. */
	accent: string
	/** Editor default text (typically gray step 12). */
	foreground: string
	/** Comments / line numbers (typically gray step 10–11). */
	comment: string
	/** Caret color (the UI accent). */
	cursor: string
	/** Selection highlight (the soft accent). */
	selection: string
}): MonacoThemeData {
	// Syntax keeps the palette's own hues: nudged toward a strong accent, an orange
	// on its way round to blue turns into a red, which reads as something wrong.
	void accent
	const s = paletteScales(PALETTE, appearance, background)

	const red = noHash(s.red.scale[TEXT])
	const orange = noHash(s.orange.scale[TEXT])
	const yellow = noHash(s.yellow.scale[TEXT])
	const green = noHash(s.green.scale[TEXT])
	const cyan = noHash(s.cyan.scale[TEXT])
	const blue = noHash(s.blue.scale[TEXT])
	const purple = noHash(s.purple.scale[TEXT])
	const magenta = noHash(s.magenta.scale[TEXT])
	const teal = noHash(s.teal.scale[TEXT])

	const fg = noHash(foreground)
	const muted = noHash(comment)

	return {
		base: appearance === 'dark' ? 'vs-dark' : 'vs',
		inherit: false,
		// base16 token conventions mapped onto the palette hues.
		rules: [
			{token: '', foreground: fg},
			{token: 'comment', foreground: muted, fontStyle: 'italic'},
			{token: 'keyword', foreground: purple},
			{token: 'storage', foreground: purple},
			{token: 'string', foreground: green},
			{token: 'string.escape', foreground: teal},
			{token: 'regexp', foreground: teal},
			{token: 'number', foreground: orange},
			{token: 'constant', foreground: orange},
			{token: 'constant.language', foreground: magenta},
			{token: 'type', foreground: yellow},
			{token: 'type.identifier', foreground: yellow},
			{token: 'attribute.name', foreground: yellow},
			{token: 'function', foreground: blue},
			{token: 'variable', foreground: cyan},
			{token: 'variable.predefined', foreground: cyan},
			{token: 'tag', foreground: red},
			{token: 'delimiter', foreground: fg},
			{token: 'operator', foreground: fg},
			{token: 'invalid', foreground: red},
		],
		colors: {
			'editor.background': toFullHex(background),
			'editor.foreground': toFullHex(foreground),
			'editorCursor.foreground': toFullHex(cursor),
			'editor.selectionBackground': toFullHex(selection),
			'editorLineNumber.foreground': toFullHex(comment),
			'editor.lineHighlightBackground': '#00000000',
		},
	}
}
