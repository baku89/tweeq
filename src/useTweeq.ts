import {useInputColor} from './InputColor/useInputColor'
import {useAppConfigStore} from './stores/appConfig'
import {ColorMode, provideTheme} from './useTheme'

interface TweeqOptions {
	colorMode?: ColorMode
	accentColor?: string
}

export function useTweeq(appId: string, options: TweeqOptions = {}) {
	const appConfig = useAppConfigStore()
	appConfig.appId = appId

	const accentColor = appConfig.ref(
		'accentColor',
		options.accentColor || '#0000ff'
	)

	const colorMode = appConfig.ref('colorMode', options.colorMode || 'auto')

	const theme = provideTheme(accentColor, colorMode)

	useInputColor()

	return {appConfig, theme}
}
