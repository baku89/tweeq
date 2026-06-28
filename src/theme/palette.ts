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
	cyan: '#00a2c7',
	blue: '#3e63dd',
	purple: '#8e4ec6',
} as const

export type PaletteHue = keyof typeof PALETTE

// --- Accent nudge (applied to UI semantics only, never to syntax) -----------
// Pull a semantic hue slightly toward the accent so the UI feels cohesive,
// without letting it leave its canonical band (red stays red, amber stays
// amber). The ±MAX_DEG clamp is what guarantees recognizability even when the
// accent sits on the opposite side of the wheel.
const NUDGE_T = 0.3 // fraction of the way toward the accent hue
const NUDGE_MAX_DEG = 24 // hard cap on the hue shift from the canonical seed
const CHROMA_MIX = 0.5 // pull vibrancy toward the accent's chroma
const CHROMA_FLOOR = 0.5 // never drop below this fraction of the seed's chroma

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
	colorWarning: string
	colorWarningSoft: string
	colorSuccess: string
	colorSuccessSoft: string
	/** Recording indicator — same red as error/alert. */
	colorRec: string
	colorInfo: string
	colorInfoSoft: string
	/** Back-compat alias used by older call sites; == success. */
	colorAffirmative: string
}

/**
 * The representative color of a palette hue: the accent's own lightness and
 * chroma, recolored to the (nudged) hue — i.e. "the accent, rendered as red /
 * amber / green". One color per hue, no per-role steps.
 */
function representativeColor(seedHex: string, accentHex: string): string {
	const seedHue = new Color(seedHex).to('oklch').coords[2]
	const [al, ac, ah] = new Color(accentHex).to('oklch').coords
	const hue = nudgedHue(seedHue, ah)

	return new Color('oklch', [al, ac, Number.isNaN(hue) ? seedHue : hue])
		.to('srgb')
		.toString({format: 'hex'})
}

/** Representative color for every palette hue (accent's L & C, nudged hue). */
export function paletteRepresentatives(
	accent: string
): Record<PaletteHue, string> {
	return Object.fromEntries(
		Object.entries(PALETTE).map(([name, seed]) => [
			name,
			representativeColor(seed, accent),
		])
	) as Record<PaletteHue, string>
}

/** A soft tinted background: the representative blended toward the background. */
function softTint(background: string, color: string): string {
	return new Color(Color.mix(background, color, 0.15, {space: 'oklch'}))
		.to('srgb')
		.toString({format: 'hex'})
}

export function buildSemanticColors({
	background,
	accent,
}: {
	background: string
	accent: string
}): SemanticColors {
	const rep = paletteRepresentatives(accent)

	return {
		colorError: rep.red,
		colorErrorSoft: softTint(background, rep.red),
		colorWarning: rep.yellow,
		colorWarningSoft: softTint(background, rep.yellow),
		colorSuccess: rep.green,
		colorSuccessSoft: softTint(background, rep.green),
		colorRec: rep.red, // identical to error / alert
		colorInfo: rep.blue,
		colorInfoSoft: softTint(background, rep.blue),
		colorAffirmative: rep.green,
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
	// Syntax draws from the same themed (accent-nudged) palette as the semantics.
	const s = paletteScales(nudgePalette(accent), appearance, background)

	const red = noHash(s.red.scale[TEXT])
	const orange = noHash(s.orange.scale[TEXT])
	const yellow = noHash(s.yellow.scale[TEXT])
	const green = noHash(s.green.scale[TEXT])
	const cyan = noHash(s.cyan.scale[TEXT])
	const blue = noHash(s.blue.scale[TEXT])
	const purple = noHash(s.purple.scale[TEXT])

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
			{token: 'string.escape', foreground: cyan},
			{token: 'regexp', foreground: cyan},
			{token: 'number', foreground: orange},
			{token: 'constant', foreground: orange},
			{token: 'constant.language', foreground: orange},
			{token: 'type', foreground: yellow},
			{token: 'type.identifier', foreground: yellow},
			{token: 'attribute.name', foreground: yellow},
			{token: 'function', foreground: blue},
			{token: 'variable', foreground: red},
			{token: 'variable.predefined', foreground: red},
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
