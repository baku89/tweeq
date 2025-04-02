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

	/** The accent color */
	colorAccent: string

	/** The color of the text on the accent color */
	colorOnAccent: string

	/** The hover color of the accent color */
	colorAccentHover: string

	/** Soft colors of the accent color, can be used as background of the input box, such as bar of the input number */
	colorAccentSoft: string

	/** Hover colors of the soft accent color */
	colorAccentSoftHover: string

	/** Background color of the app */
	colorBackground: string

	/** Colors of the text on the background color */
	colorText: string

	/** Colors for muted texts, such as "inactive menu" or "info texts" */
	colorTextMute: string

	/** Color for subtle text, such as as "placeholders" or "caret icon". */
	colorTextSubtle: string

	// Surface
	colorSurface: string

	/** The color of the border, such as the border of disabled input */
	colorBorder: string

	/** The subtle color of the border, such as scales of the input number */
	colorBorderSubtle: string

	/** The color of the shadow, such as the shadow of the dropdown */
	colorShadow: string

	// Input

	/** Background of the input box */
	colorInput: string
	/** Background of the input box when hovered */
	colorInputHover: string

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
	rem: number

	// Border Radius
	radiusInput: number
	radiusPane: number
	radiusPopup: number

	iconSize: number

	// Input
	inputHeight: number
	inputGap: number // Drag-to-t

	// Popup
	popupWidth: number
	popupPadding: number

	// Pane
	panePadding: number
	scrollbarWidth: number

	// Transition
	hoverTransitionDuration: string
	activeTransitionDuration: string
}
