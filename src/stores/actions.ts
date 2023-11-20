import {Bndr, Emitter} from 'bndr-js'
import {title} from 'case'
import {defineStore} from 'pinia'
import {onBeforeUnmount, onUnmounted, reactive} from 'vue'

interface ActionBase {
	id: string
	shortLabel?: string
	menu?: string
	icon?: string
	perform(): any
}

export interface Action extends ActionBase {
	label: string
	bind?: Bndr
}

export interface ActionOptions extends ActionBase {
	label?: string
	bind?: string | Bndr | (string | Bndr)[]
}

const keyboard = Bndr.keyboard()
const gamepad = Bndr.gamepad()

export const useActionsStore = defineStore('actions', () => {
	const allActions = reactive<Record<string, Action>>({})

	function register(options: ActionOptions[]) {
		const emitters = new Set<Emitter>()

		for (const option of options) {
			if (option.id in options) {
				throw new Error(`Action ${option.id} is already registered`)
			}

			const label = option.label ? option.label : title(option.id)

			let bind: Bndr | undefined

			if (option.bind) {
				const binds = Array.isArray(option.bind) ? option.bind : [option.bind]

				const emitters = binds.map(b => {
					if (typeof b === 'string') {
						if (b.startsWith('gamepad:')) {
							// Gamepad
							const button = b.split(':')[1]
							return gamepad.button(button).down()
						} else {
							// keyboard
							return keyboard.keydown(b, {
								capture: true,
								preventDefault: true,
							})
						}
					}
					return b
				})

				if (emitters.length === 1) {
					bind = emitters[0]
				} else if (emitters.length > 1) {
					bind = Bndr.combine(...emitters)
				}
			}

			const action: Action = {...option, label, bind: bind}

			bind?.on(() => {
				runBeforePerformHooks(action)
				option.perform()
			})

			allActions[option.id] = action
			emitters.add(bind)
		}

		onBeforeUnmount(() => {
			for (const action of options) {
				delete allActions[action.id]
			}
			emitters.forEach(emitter => emitter.dispose())
			emitters.clear()
		})
	}

	function perform(id: string) {
		const action = allActions[id]
		if (!action) {
			throw new Error(`Action ${id} is not registered`)
		}

		runBeforePerformHooks(action)
		action.perform()
	}

	function runBeforePerformHooks(action: Action) {
		for (const hook of onBeforePerformHooks) {
			hook(action)
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const onBeforePerformHooks = new Set<(action: Action) => void>()

	function onBeforePerform(hook: (action: Action) => void) {
		onBeforePerformHooks.add(hook)

		onUnmounted(() => {
			onBeforePerformHooks.delete(hook)
		})
	}

	return {register, perform, onBeforePerform, allActions}
})
