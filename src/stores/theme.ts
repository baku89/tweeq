import {
	argbFromHex,
	customColor,
	hexFromArgb,
	themeFromSourceColor,
} from '@material/material-color-utilities'
import {toReactive} from '@vueuse/core'
import {kebab} from 'case'
import {defineStore} from 'pinia'
import {computed, toRefs, watch} from 'vue'

import {ColorMode, generateThemeColorsRadix, Theme} from '../theme'
import {useAppConfigStore} from './appConfig'

export const useThemeStore = defineStore('theme', () => {
	const appConfig = useAppConfigStore()

	const accentColor = appConfig.ref('theme.accentColor', '#D03E54')
	const colorMode = appConfig.ref<ColorMode>('theme.colorMode', 'light')

	const materialTheme = computed(() => {
		return themeFromSourceColor(argbFromHex(accentColor.value))
	})

	const theme = computed<Theme>(() => {
		// Get the theme from a hex color
		const themeColorsRadix = generateThemeColorsRadix({
			appearance: colorMode.value,
			background: colorMode.value === 'light' ? '#ffffff' : '#111111',
			accent: accentColor.value,
			gray: '#8B8D98',
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
			colorBorder: themeColorsRadix.grayScaleAlpha[5],
			colorShadow: dark ? '#000000' : themeColorsRadix.grayScale[11],

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

			fontCode: "'Fira Code', monospace",
			fontHeading: 'Inter, sans-serif',
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
		}
	})

	watch(
		theme,
		() => {
			// Promote all as CSS variabbles
			for (const [key, value] of Object.entries(theme.value)) {
				const varName = '--tq-' + kebab(key)

				const cssValue = typeof value === 'number' ? `${value}px` : value

				document.documentElement.style.setProperty(varName, cssValue)
				// if (++i === 2) {
				// 	break
				// }
			}
		},
		{immediate: true}
	)

	return {
		accentColor,
		colorMode: colorMode,
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
