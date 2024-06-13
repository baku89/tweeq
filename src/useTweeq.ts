import components from './components'
import {useInputColor} from './InputColor/useInputColor'
import {useActionsStore} from './stores/actions'
import {useAppConfigStore} from './stores/appConfig'
import {useThemeStore} from './stores/theme'
import {ColorMode} from './theme'

interface TweeqOptions {
	colorMode?: ColorMode
	accentColor?: string
}

export function initTweeq(appId: string, options: TweeqOptions = {}) {
	const appConfig = useAppConfigStore()
	appConfig.appId = appId

	const theme = useThemeStore()
	theme.setDefault(options)

	useInputColor()
}

export function useTweeq() {
	const theme = useThemeStore()
	const actions = useActionsStore()
	const config = useAppConfigStore()

	return {theme, actions, config, ...components}
}
