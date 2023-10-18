import {useInputColor} from './InputColor/useInputColor'
import {useAppConfigStore} from './stores/appConfig'
import {ColorMode, useThemeStore} from './stores/theme'

interface TweeqOptions {
	colorMode?: ColorMode
	accentColor?: string
}

export function useTweeq(appId: string, options: TweeqOptions = {}) {
	const appConfig = useAppConfigStore()
	appConfig.appId = appId
	const theme = useThemeStore()

	if (options.accentColor) {
		theme.accentColor = options.accentColor
	}

	if (options.colorMode) {
		theme.colorMode = options.colorMode
	}

	useInputColor()

	return {appConfig, theme}
}
