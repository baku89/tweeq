import {
	argbFromHex,
	customColor,
	hexFromArgb,
	themeFromSourceColor,
} from '@material/material-color-utilities'
import {toReactive} from '@vueuse/core'
import {kebab} from 'case'
import {defineStore} from 'pinia'
import {computed, toRefs, watch, watchEffect} from 'vue'

import {type ColorMode, generateThemeColorsRadix, type Theme} from '../theme'
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

	watchEffect(() => {
		if (colorMode.value === 'light') {
			backgroundColor.value = '#ffffff'
		} else {
			backgroundColor.value = '#111111'
		}
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

	const materialTheme = computed(() => {
		return themeFromSourceColor(argbFromHex(accentColor.value))
	})

	const theme = computed<Theme>(() => {
		// Get the theme from a hex color
		const themeColorsRadix = generateThemeColorsRadix({
			appearance: colorMode.value,
			background: backgroundColor.value,
			accent: accentColor.value,
			gray: grayColor.value,
		})

		const dark = colorMode.value === 'dark'

		const colors = materialTheme.value.schemes[dark ? 'dark' : 'light']

		const accent = argbFromHex(accentColor.value)

		const error = customColor(accent, {
			value: 0xff0000,
			name: 'error',
			blend: true,
		})

		const affirmative = customColor(accent, {
			value: 0x4752ff,
			name: 'affirmative',
			blend: true,
		})

		return {
			// Accent
			colorAccent: themeColorsRadix.accentScale[8],
			colorOnAccent: themeColorsRadix.accentContrast,
			colorAccentHover: themeColorsRadix.accentScale[9],

			// Background
			colorBackground: themeColorsRadix.background,
			colorOnBackground: themeColorsRadix.grayScale[11],
			colorGrayOnBackground: themeColorsRadix.grayScale[10],

			// Surface
			colorSurface: `color-mix(in srgb, transparent, ${themeColorsRadix.grayScale[0]} 80%)`,
			colorBorder: themeColorsRadix.grayScaleAlpha[3],
			colorShadow: dark
				? '#000000aa'
				: `color-mix(in srgb, transparent, ${themeColorsRadix.grayScale[11]} 20%)`,

			// Input
			// Background of the input
			colorInput: themeColorsRadix.grayScale[2],
			// Hover color of the input
			colorInputHover: themeColorsRadix.grayScale[4],
			// The color of the bar
			colorInputTintedAccent: themeColorsRadix.accentScale[2],
			// The hover color of the bar
			colorInputTintedAccentHover: themeColorsRadix.accentScale[7],
			// The tip color of the bar (becomes accent color when hovered)
			colorInputVividAccent: themeColorsRadix.accentScale[6],
			// The scale color of the input
			colorInputScale: themeColorsRadix.grayScaleAlpha[2],

			// Selection
			colorSelection: themeColorsRadix.accentScale[10],
			colorOnSelection: themeColorsRadix.background,

			// Secondary Colors
			colorSecondary: toColor(colors.secondary),

			// Semantic Colors: Can be used as same as accent color
			colorError: toColor(dark ? error.light.color : error.dark.color),
			colorRec: toColor(dark ? error.light.color : error.dark.color),
			colorAffirmative: toColor(
				dark ? affirmative.light.color : affirmative.dark.color
			),

			fontCode: "'Geist Mono', monospace",
			fontHeading: 'Geist, sans-serif',
			fontUi: 'Inter, system-ui, sans-serif',
			fontNumeric: 'Inter, system-ui, sans-serif',

			rem: 12,

			paneBorderRadius: 12,

			popupWidth: 300,
			popupPadding: 9,
			popupBorderRadius: 6,

			inputBorderRadius: 4,
			inputHeight: 24,
			inputGap: 9,

			panePadding: 12,
			scrollbarWidth: 6,

			hoverTransitionDuration: '0.15s',
			activeTransitionDuration: '48ms',
		}
	})

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
				const varName = '--tq-' + kebab(key)

				const cssValue = typeof value === 'number' ? `${value}px` : value

				document.body.style.setProperty(varName, cssValue)
			}

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
		...toRefs(toReactive(theme)),
	}
})

function toColor(color: number, opacity?: number) {
	let alpha = ''

	if (opacity !== undefined) {
		alpha = Math.round(opacity * 255)
			.toString(16)
			.padStart(2, '0')
	}

	return `${hexFromArgb(color)}${alpha}`
}
