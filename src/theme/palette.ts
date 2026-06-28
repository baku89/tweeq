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

function nudgeTowardAccent(seedHex: string, accentHex: string): string {
	const seed = new Color(seedHex).to('oklch')
	const accent = new Color(accentHex).to('oklch')

	const [sl, sc, sh] = seed.coords
	const ac = accent.coords[1]
	const ah = accent.coords[2]

	// Achromatic seed or accent → no meaningful hue to pull toward.
	if (Number.isNaN(sh) || Number.isNaN(ah)) return seedHex

	// Shortest signed angle from the seed hue to the accent hue, in (-180, 180].
	const delta = ((ah - sh + 540) % 360) - 180
	const shifted = clamp(sh + delta * NUDGE_T, sh - NUDGE_MAX_DEG, sh + NUDGE_MAX_DEG)

	// Track the accent's vibrancy, but keep a floor so a muted accent can't wash
	// a semantic color out (an error must stay saturated enough to read as one).
	const chroma = Math.max(sc + (ac - sc) * CHROMA_MIX, sc * CHROMA_FLOOR)
	const hue = ((shifted % 360) + 360) % 360

	return new Color('oklch', [sl, chroma, hue]).to('srgb').toString({format: 'hex'})
}

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n))
}

// Step roles within a Radix scale (0-indexed: index = step − 1).
const SOLID = 8 // step 9  — solid fill
const TEXT = 10 // step 11 — text on the app background
const SOFT = 1 // step 2  — soft tinted background

export interface SemanticColors {
	colorError: string
	colorErrorSoft: string
	colorWarning: string
	colorWarningSoft: string
	colorSuccess: string
	colorSuccessSoft: string
	/** Recording indicator — a vivid solid red, not the contrast-safe text red. */
	colorRec: string
	colorInfo: string
	/** Back-compat alias used by older call sites; == success solid. */
	colorAffirmative: string
}

/**
 * The single "themed palette": every curated hue nudged toward the accent
 * (bounded per-hue). Both semantic colors and editor syntax are extracted from
 * this, so they share one accent-following source of truth.
 */
export function nudgePalette(accent: string): Record<PaletteHue, string> {
	return Object.fromEntries(
		Object.entries(PALETTE).map(([name, seed]) => [
			name,
			nudgeTowardAccent(seed, accent),
		])
	) as Record<PaletteHue, string>
}

/** Fit every hue of a (themed) palette to a 12-step scale against the background. */
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

export function buildSemanticColors({
	appearance,
	background,
	accent,
}: {
	appearance: ColorMode
	background: string
	accent: string
}): SemanticColors {
	const s = paletteScales(nudgePalette(accent), appearance, background)

	return {
		colorError: s.red.scale[TEXT],
		colorErrorSoft: s.red.scale[SOFT],
		colorWarning: s.yellow.scale[TEXT],
		colorWarningSoft: s.yellow.scale[SOFT],
		colorSuccess: s.green.scale[TEXT],
		colorSuccessSoft: s.green.scale[SOFT],
		colorRec: s.red.scale[SOLID],
		colorInfo: s.blue.scale[TEXT],
		colorAffirmative: s.green.scale[SOLID],
	}
}

// --- Monaco editor theme ----------------------------------------------------

export interface MonacoThemeData {
	base: 'vs' | 'vs-dark'
	inherit: boolean
	rules: {token: string; foreground?: string; fontStyle?: string}[]
	colors: Record<string, string>
}

const noHash = (hex: string) => hex.replace('#', '')

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
			'editor.background': background,
			'editor.foreground': foreground,
			'editorCursor.foreground': cursor,
			'editor.selectionBackground': selection,
			'editorLineNumber.foreground': comment,
			'editor.lineHighlightBackground': '#00000000',
		},
	}
}
