import {
	applyTheme,
	argbFromHex,
	customColor,
	hexFromArgb,
	themeFromSourceColor,
} from '@material/material-color-utilities'
import {toReactive, useColorMode} from '@vueuse/core'
import {kebab} from 'case'
import {defineStore} from 'pinia'
import {computed, toRefs, watch} from 'vue'

import {useAppConfigStore} from '..'

export type ColorMode = 'light' | 'dark' | 'auto'

export type CSSNumber = number

export interface Theme {
	// Colors
	colorPrimary: string
	colorOnPrimary: string
	colorPrimaryContainer: string
	colorOnPrimaryContainer: string
	colorBackground: string
	colorOnBackground: string
	colorGrayOnBackground: string
	colorSurface: string
	colorSurfaceBorder: string
	colorInverseSurface: string
	colorInverseOnSurface: string
	colorInversePrimary: string
	colorShadow: string
	colorInput: string
	colorInputHover: string
	colorPrimaryHover: string
	colorOnInput: string
	colorTintedInput: string
	colorTintedInputActive: string
	colorError: string
	colorOnError: string
	colorErrorContainer: string
	colorOnErrorContainer: string

	// Semantic Colors
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
}

export const useThemeStore = defineStore('theme', () => {
	const appConfig = useAppConfigStore()

	const browserColorMode = useColorMode()

	const accentColor = appConfig.ref('theme.accentColor', '#0000ff')
	const savedColorMode = appConfig.ref<ColorMode>('theme.colorMode', 'auto')

	const colorMode = computed<'light' | 'dark'>(() => {
		if (savedColorMode.value === 'auto') {
			return browserColorMode.value === 'dark' ? 'dark' : 'light'
		} else {
			return savedColorMode.value
		}
	})

	const materialTheme = computed(() => {
		return themeFromSourceColor(argbFromHex(accentColor.value))
	})

	watch(materialTheme, () => {
		const dark = colorMode.value === 'dark'

		// Apply the theme to the body by updating custom properties for material tokens
		applyTheme(materialTheme.value, {target: document.body, dark})
	})

	const theme = computed<Theme>(() => {
		// Get the theme from a hex color

		const dark = colorMode.value === 'dark'

		const palettes = materialTheme.value.palettes
		const colors = materialTheme.value.schemes[dark ? 'dark' : 'light']

		const accent = argbFromHex(accentColor.value)

		const affirmative = customColor(accent, {
			value: 0x4752ff,
			name: 'affirmative',
			blend: true,
		})

		return {
			colorPrimary: toColor(dark ? palettes.primary.tone(40) : colors.primary),
			colorOnPrimary: toColor(
				dark ? palettes.primary.tone(90) : colors.onPrimary
			),
			colorPrimaryContainer: toColor(
				dark ? palettes.primary.tone(20) : colors.primaryContainer
			),
			colorOnPrimaryContainer: toColor(colors.onPrimaryContainer),
			colorBackground: dark ? '#1a1a1a' : '#ffffff',
			colorOnBackground: toColor(colors.onBackground),
			colorGrayOnBackground: toColor(palettes.neutral.tone(dark ? 60 : 70)),
			colorSurface: toColor(dark ? 0x1a1a1a : 0xffffff, 0.95),
			colorSurfaceBorder: toColor(colors.onBackground, 0.12),
			colorInverseSurface: toColor(colors.inverseSurface, 0.9),
			colorInverseOnSurface: toColor(colors.inverseOnSurface),
			colorInversePrimary: toColor(colors.inversePrimary),
			colorShadow: toColor(colors.shadow),
			colorInput: toColor(palettes.neutral.tone(dark ? 15 : 97)),
			colorInputHover: toColor(palettes.neutralVariant.tone(dark ? 30 : 95)),
			colorPrimaryHover: toColor(palettes.primary.tone(dark ? 55 : 45)),
			colorTintedInput: toColor(colors.primaryContainer),
			colorTintedInputActive: toColor(colors.inversePrimary),
			colorOnInput: toColor(colors.onBackground),
			colorError: toColor(colors.error),
			colorOnError: toColor(colors.onError),
			colorErrorContainer: toColor(colors.errorContainer),
			colorOnErrorContainer: toColor(colors.onErrorContainer),

			// Semantic Colors
			colorAffirmative: toColor(
				dark ? affirmative.dark.color : affirmative.light.color
			),

			fontCode: "'Fira Code', monospace",
			fontHeading: 'Inter, sans-serif',
			fontUi: 'Inter, system-ui, sans-serif',
			fontNumeric: 'Inter, system-ui, sans-serif',

			rem: 12,

			paneBorderRadius: 20,

			popupWidth: 300,
			popupPadding: 9,
			popupBorderRadius: 6,

			inputBorderRadius: 8,
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
		colorMode: savedColorMode,
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
