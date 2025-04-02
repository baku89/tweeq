import {
	argbFromHex,
	customColor,
	hexFromArgb,
	themeFromSourceColor,
} from '@material/material-color-utilities'
import {toReactive} from '@vueuse/core'
import Case from 'case'
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
		const radixColors = generateThemeColorsRadix({
			appearance: colorMode.value,
			background: backgroundColor.value,
			accent: accentColor.value,
			gray: grayColor.value,
		})

		const dark = colorMode.value === 'dark'

		const materialColors = materialTheme.value.schemes[dark ? 'dark' : 'light']

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

			// Selection
			colorSelection: radixColors.accentScale[10],
			colorOnSelection: radixColors.background,

			// Secondary Colors
			colorSecondary: toColor(materialColors.secondary),

			// Semantic Colors: Can be used as same as accent color
			colorError: toColor(dark ? error.dark.color : error.light.color),
			colorErrorSoft: toColor(
				dark ? error.dark.color : error.light.colorContainer
			),

			colorRec: toColor(dark ? error.dark.color : error.light.color),
			colorAffirmative: toColor(
				dark ? affirmative.dark.color : affirmative.light.color
			),

			fontCode: "'Geist Mono', monospace",
			fontHeading: 'Geist, sans-serif',
			fontUi: 'system-ui, sans-serif',
			fontNumeric: 'Geist, system-ui, sans-serif',

			rem: 12,

			radiusInput: 4,
			radiusPopup: 6,
			radiusPane: 12,

			popupWidth: 240,
			popupPadding: 9,

			iconSize: 18,
			inputHeight: 24,
			inputGap: 9,

			panePadding: 12,
			scrollbarWidth: 6,

			hoverTransitionDuration: '0.15s',
			activeTransitionDuration: '64ms',
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
				const varName = '--tq-' + Case.kebab(key)

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
