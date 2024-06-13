import {useInputColor} from './InputColor/useInputColor'
import {useAppConfigStore} from './stores/appConfig'
import {useThemeStore} from './stores/theme'
import {ColorMode} from './theme'

interface TweeqOptions {
	colorMode?: ColorMode
	accentColor?: string
}

export function useTweeq(appId: string, options: TweeqOptions = {}) {
	const appConfig = useAppConfigStore()
	appConfig.appId = appId

	const theme = useThemeStore()

	theme.setDefault(options)

	useInputColor()

	return {appConfig, theme}
}
