import * as components from './components'
import {useInputColor} from './InputColor/useInputColor'
import {useActionsStore} from './stores/actions'
import {useAppConfigStore} from './stores/appConfig'
import {useModalStore} from './stores/modal'
import {useThemeStore} from './stores/theme'
import type {ColorMode} from './theme'

interface TweeqOptions {
	colorMode?: ColorMode
	accentColor?: string
	backgroundColor?: string
	grayColor?: string
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
	const modal = useModalStore()

	return {theme, actions, config, modal, ...components}
}
