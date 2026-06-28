import {toReactive} from '@vueuse/core'
import Case from 'case'
import {defineStore} from 'pinia'
import {computed, toRefs, watch} from 'vue'

import {
	buildMonacoTheme,
	buildSemanticColors,
	type ColorMode,
	generateThemeColorsRadix,
	type MonacoThemeData,
	type Theme,
} from '../theme'
import {useAppConfigStore} from './appConfig'

export const useThemeStore = defineStore('theme', () => {
	const config = useAppConfigStore().group('theme')

	const accentColor = config.ref('accentColor', '#0000ff')
	const colorMode = config.ref<ColorMode>('colorMode', 'light')
	const grayColor = config.ref('grayColor', '#8B8D98')
	const backgroundColor = config.ref(
		'backgroundColor',
		colorMode.value === 'light' ? '#ffffff' : '#111111'
	)

	// Snap the background to the appearance's default when the user toggles
	// light/dark, but leave it untouched afterwards (and on load) so a custom
	// background sticks. No `immediate`: we must not clobber a saved background
	// when the store first restores it.
	watch(colorMode, mode => {
		backgroundColor.value = mode === 'light' ? '#ffffff' : '#111111'
	})

	function setDefault(options: {
		colorMode?: ColorMode
		accentColor?: string
		backgroundColor?: string
		grayColor?: string
	}) {
		if (options.colorMode) {
			colorMode.default = options.colorMode
		}
		if (options.accentColor) {
			accentColor.default = options.accentColor
		}
		if (options.backgroundColor) {
			backgroundColor.default = options.backgroundColor
		}
		if (options.grayColor) {
			grayColor.default = options.grayColor
		}
	}

	// Accent + gray scales, fit to the chosen background (the Radix engine).
	const radix = computed(() =>
		generateThemeColorsRadix({
			appearance: colorMode.value,
			background: backgroundColor.value,
			accent: accentColor.value,
			gray: grayColor.value,
		})
	)

	// Semantic colors from the curated palette, nudged toward the accent.
	const semanticColors = computed(() =>
		buildSemanticColors({
			background: backgroundColor.value,
			accent: accentColor.value,
		})
	)

	const theme = computed<Theme>(() => {
		const radixColors = radix.value
		const dark = colorMode.value === 'dark'

		return {
			// Accent
			colorAccent: radixColors.accentScale[8],
			colorOnAccent: radixColors.accentContrast,
			colorAccentHover: radixColors.accentScale[10],
			colorAccentSoft: radixColors.accentScale[4],
			colorAccentSoftHover: radixColors.accentScale[5],

			// Background
			colorBackground: radixColors.background,
			colorText: radixColors.grayScale[11],
			colorTextMute: radixColors.grayScale[10],
			colorTextSubtle: radixColors.grayScale[9],

			// Surface
			colorSurface: `color-mix(in srgb, transparent, ${radixColors.grayScale[0]} 80%)`,
			colorBorder: radixColors.grayScaleAlpha[3],
			colorBorderSubtle: radixColors.grayScaleAlpha[2],
			colorShadow: dark
				? '#000000aa'
				: `color-mix(in srgb, transparent, ${radixColors.grayScale[11]} 20%)`,

			// Input
			colorInput: radixColors.grayScale[2],
			colorInputHover: radixColors.grayScale[3],

			// Neutral: an achromatic filled-button tone. More present than the
			// input/checkbox-off background (grayScale[2]) so it reads as a real
			// button, but without borrowing the accent color.
			colorNeutral: radixColors.grayScale[4],
			colorNeutralHover: radixColors.grayScale[5],

			// Selection
			colorSelection: radixColors.accentScale[10],
			colorOnSelection: radixColors.background,

			// Semantic Colors (curated palette → see theme/palette.ts)
			...semanticColors.value,

			fontCode: "'Geist Mono', monospace",
			fontHeading: 'Geist, sans-serif',
			fontUi: 'system-ui, sans-serif',
			fontNumeric: 'Geist, system-ui, sans-serif',

			rem: 12,

			radiusInput: 4,
			// Concentric with the content: inner control radius (4) + popup padding
			// (9), so a popup's corners stay parallel to the controls inside it.
			radiusPopup: 13,
			radiusPane: 12,

			popupWidth: 240,
			popupPadding: 9,
			// Shared backdrop blur for popup surfaces (menus, dropdowns, balloons,
			// tooltips) so they read as the same frosted glass.
			popupBlur: 6,

			iconSize: 18,
			inputHeight: 24,
			// Width at which every input renders its full (non-compact) form
			// comfortably — sized for the most demanding ones (InputColor's hex
			// code, InputVec's side-by-side fields). Hosts that size to content
			// (e.g. a modal form) use it as a min width.
			inputComfortableWidth: 224,

			// Gap scale, named by how related the two things being separated are
			// (tightest → loosest): segments of one control, items that read as a
			// unit (icon + label, a parameter's inputs), independent controls, and
			// whole sections.
			gapGroup: 2,
			gapRelated: 6,
			gapControl: 9,
			gapSection: 18,

			panePadding: 12,
			// Gutter kept between a top-layer pane/modal and the viewport edge
			// when its content would otherwise reach (or overflow) the screen.
			paneMargin: 48,
			scrollbarWidth: 6,

			hoverTransitionDuration: '0.15s',
			activeTransitionDuration: '64ms',
		}
	})

	// Monaco editor theme: pure-palette syntax colors (no accent nudge) plus the
	// app's own background/text/accent. Consumed by InputCode/MonacoEditor.
	const monacoTheme = computed<MonacoThemeData>(() =>
		buildMonacoTheme({
			appearance: colorMode.value,
			background: radix.value.background,
			accent: accentColor.value,
			foreground: radix.value.grayScale[11],
			comment: radix.value.grayScale[9],
			cursor: radix.value.accentScale[8],
			selection: radix.value.accentScale[4],
		})
	)

	// Promote all as CSS variabbles
	let metaThemeColor = document.querySelector('meta[name=theme-color]')

	if (!metaThemeColor) {
		metaThemeColor = document.createElement('meta')
		metaThemeColor.setAttribute('name', 'theme-color')
		document.head.appendChild(metaThemeColor)
	}

	watch(
		theme,
		() => {
			for (const [key, value] of Object.entries(theme.value)) {
				const varName = '--tq-' + Case.kebab(key)

				const cssValue = typeof value === 'number' ? `${value}px` : value

				document.body.style.setProperty(varName, cssValue)
			}

			// Expose the mode for the rare CSS rule that must differ between light
			// and dark beyond what the (already mode-adaptive) tokens give.
			document.body.dataset.colorMode = colorMode.value

			metaThemeColor.setAttribute('content', theme.value.colorBackground)
		},
		{immediate: true}
	)

	return {
		accentColor,
		colorMode,
		backgroundColor,
		grayColor,
		setDefault,
		monacoTheme,
		...toRefs(toReactive(theme)),
	}
})
