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
const NUDGE_T = 0.15 // fraction of the way toward the accent hue
const NUDGE_MAX_DEG = 18 // hard cap on the hue shift from the canonical seed
const CHROMA_MIX = 0.15 // pull vibrancy slightly toward the accent's chroma

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

	const chroma = sc + (ac - sc) * CHROMA_MIX
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

export function buildSemanticColors({
	appearance,
	background,
	accent,
}: {
	appearance: ColorMode
	background: string
	accent: string
}): SemanticColors {
	const scaleFor = (hue: PaletteHue): RadixScale =>
		generateRadixScale({
			appearance,
			background,
			seed: nudgeTowardAccent(PALETTE[hue], accent),
		})

	const red = scaleFor('red')
	const amber = scaleFor('yellow')
	const green = scaleFor('green')
	const blue = scaleFor('blue')

	return {
		colorError: red.scale[TEXT],
		colorErrorSoft: red.scale[SOFT],
		colorWarning: amber.scale[TEXT],
		colorWarningSoft: amber.scale[SOFT],
		colorSuccess: green.scale[TEXT],
		colorSuccessSoft: green.scale[SOFT],
		colorRec: red.scale[SOLID],
		colorInfo: blue.scale[TEXT],
		colorAffirmative: green.scale[SOLID],
	}
}

// --- Monaco editor theme (pure palette, no accent nudge) --------------------

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
	foreground,
	comment,
	cursor,
	selection,
}: {
	appearance: ColorMode
	background: string
	/** Editor default text (typically gray step 12). */
	foreground: string
	/** Comments / line numbers (typically gray step 10–11). */
	comment: string
	/** Caret color (the UI accent). */
	cursor: string
	/** Selection highlight (the soft accent). */
	selection: string
}): MonacoThemeData {
	const scaleFor = (hue: PaletteHue): RadixScale =>
		generateRadixScale({appearance, background, seed: PALETTE[hue]})

	// Syntax colors come straight from the palette — deliberately accent-free so
	// code colors never shift when the UI accent changes.
	const red = noHash(scaleFor('red').scale[TEXT])
	const orange = noHash(scaleFor('orange').scale[TEXT])
	const yellow = noHash(scaleFor('yellow').scale[TEXT])
	const green = noHash(scaleFor('green').scale[TEXT])
	const cyan = noHash(scaleFor('cyan').scale[TEXT])
	const blue = noHash(scaleFor('blue').scale[TEXT])
	const purple = noHash(scaleFor('purple').scale[TEXT])

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
