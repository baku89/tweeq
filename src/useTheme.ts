import {
	applyTheme,
	argbFromHex,
	hexFromArgb,
	themeFromSourceColor,
} from '@material/material-color-utilities'
import {useColorMode} from '@vueuse/core'
import {kebab} from 'case'
import {
	computed,
	inject,
	InjectionKey,
	provide,
	readonly,
	Ref,
	ref,
	watch,
} from 'vue'

export type ColorMode = 'light' | 'dark' | 'auto'

export type CSSNumber = number

export interface Theme {
	// Colors
	colorMode: 'light' | 'dark'
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

	hoverTransitionDuration: string
}

const ThemeKey: InjectionKey<Readonly<Ref<Theme>>> = Symbol('tqTheme')

export function provideTheme(
	accentColor: Ref<string>,
	colorMode: Ref<ColorMode>
): Ref<Theme> {
	const browserColorMode = useColorMode()

	const computedColorMode = computed<'light' | 'dark'>(() => {
		if (colorMode.value === 'auto') {
			return browserColorMode.value === 'dark' ? 'dark' : 'light'
		} else {
			return colorMode.value
		}
	})

	const theme = ref<Theme>(null as any)

	watch(
		[accentColor, computedColorMode],
		([accentColor, colorMode]) => {
			// Get the theme from a hex color
			const materialTheme = themeFromSourceColor(argbFromHex(accentColor))

			const dark = colorMode === 'dark'

			const palettes = materialTheme.palettes
			const colors = dark
				? materialTheme.schemes.dark
				: materialTheme.schemes.light

			theme.value = {
				colorMode,
				colorPrimary: toColor(
					dark ? palettes.primary.tone(40) : colors.primary
				),
				colorOnPrimary: toColor(
					dark ? palettes.primary.tone(90) : colors.onPrimary
				),
				colorPrimaryContainer: toColor(
					dark ? palettes.primary.tone(20) : colors.primaryContainer
				),
				colorOnPrimaryContainer: toColor(colors.onPrimaryContainer),
				colorBackground: dark ? '#1a1a1a' : '#ffffff',
				colorOnBackground: toColor(colors.onBackground),
				colorGrayOnBackground: toColor(
					dark ? palettes.neutral.tone(60) : palettes.neutral.tone(40)
				),
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

				fontCode: "'Fira Code', monospace",
				fontHeading: 'Inter, sans-serif',
				fontUi: 'Inter, system-ui, sans-serif',
				fontNumeric: 'Inter, system-ui, sans-serif',

				paneBorderRadius: 20,

				popupWidth: 300,
				popupPadding: 9,
				popupBorderRadius: 6,

				inputBorderRadius: 8,
				inputHeight: 24,
				inputGap: 9,

				panePadding: 12,

				hoverTransitionDuration: '0.15s',
			}

			// Promote all as CSS variabbles
			for (const [key, value] of Object.entries(theme.value)) {
				const varName = '--tq-' + kebab(key)

				const cssValue = typeof value === 'number' ? `${value}px` : value

				document.body.style.setProperty(varName, cssValue)
			}

			// Apply the theme to the body by updating custom properties for material tokens
			applyTheme(materialTheme, {target: document.body, dark})
		},
		{immediate: true}
	)

	const readonlyTheme = readonly(theme)

	provide(ThemeKey, readonlyTheme)

	return readonlyTheme
}

// function

function toColor(color: number, opacity?: number) {
	let alpha = ''

	if (opacity !== undefined) {
		alpha = Math.round(opacity * 255)
			.toString(16)
			.padStart(2, '0')
	}

	return `${hexFromArgb(color)}${alpha}`
}

export function useTheme() {
	const theme = inject(ThemeKey)

	if (!theme) {
		throw new Error('theme is not provided')
	}

	return theme
}
