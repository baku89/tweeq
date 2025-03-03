export type ColorMode = 'light' | 'dark'

export type CSSNumber = number

export interface ThemeOptions {
	appearance: ColorMode
	accent: string
	gray: string
	background: string
}

export interface Theme {
	// Colors

	// Accent
	colorAccent: string
	colorOnAccent: string
	colorAccentHover: string

	// Background
	colorBackground: string
	colorOnBackground: string
	colorGrayOnBackground: string

	// Surface
	colorSurface: string
	colorBorder: string
	colorShadow: string

	// Input
	// Background of the input
	colorInput: string
	// Hover color of the input
	colorInputHover: string
	// The color of the bar
	colorInputTintedAccent: string
	// The hover color of the bar
	colorInputTintedAccentHover: string
	// The tip color of the bar (becomes accent color when hovered)
	colorInputVividAccent: string
	// The scale color of the input
	colorInputScale: string

	// Selection
	colorSelection: string
	colorOnSelection: string

	// Secondary Colors
	colorSecondary: string

	// Semantic Colors: string,
	colorError: string
	colorRec: string
	colorAffirmative: string

	// Font
	fontCode: string
	fontHeading: string
	fontUi: string
	fontNumeric: string

	// UI Metrics
	paneBorderRadius: CSSNumber

	popupWidth: CSSNumber
	popupPadding: CSSNumber
	popupBorderRadius: CSSNumber

	inputBorderRadius: CSSNumber
	inputHeight: CSSNumber
	inputGap: CSSNumber

	panePadding: CSSNumber
	scrollbarWidth: CSSNumber

	hoverTransitionDuration: string
	activeTransitionDuration: string
}
