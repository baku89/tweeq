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
	input?: Bndr
}

export interface ActionOptions extends ActionBase {
	label?: string
	input?: string | Bndr | (string | Bndr)[]
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

			let input: Bndr | undefined

			if (option.input) {
				const inputs = Array.isArray(option.input)
					? option.input
					: [option.input]

				const emitters = inputs.map(input => {
					if (typeof input === 'string') {
						if (input.startsWith('gamepad:')) {
							// Gamepad
							const button = input.split(':')[1]
							return gamepad.button(button).down()
						} else {
							// keyboard
							return keyboard.keydown(input, {
								capture: true,
								preventDefault: true,
							})
						}
					}
					return input
				})

				if (emitters.length === 1) {
					input = emitters[0]
				} else if (emitters.length > 1) {
					input = Bndr.combine(...emitters)
				}
			}

			const action: Action = {...option, label, input}

			console.log(action)

			input?.on(() => {
				runBeforePerformHooks(action)
				option.perform()
			})

			allActions[option.id] = action
			emitters.add(input)
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

	const onBeforePerformHooks = new Set<(action: Action) => void>()

	function onBeforePerform(hook: (action: Action) => void) {
		onBeforePerformHooks.add(hook)

		onUnmounted(() => {
			onBeforePerformHooks.delete(hook)
		})
	}

	return {register, perform, onBeforePerform, allActions}
})
