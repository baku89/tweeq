import {Bndr} from 'bndr-js'
import {title} from 'case'
import {defineStore} from 'pinia'
import {onBeforeUnmount, onUnmounted, reactive} from 'vue'

export interface Action {
	id: string
	label: string
	shortLabel?: string
	menu?: string
	icon?: string
	input?: string | Bndr | (string | Bndr)[]
	perform(): any
}

export interface MinimalAction extends Omit<Action, 'label'> {
	label?: string
}

const Emitters = new Map<string, Bndr.Emitter[]>()

const keyboard = Bndr.keyboard()
const gamepad = Bndr.gamepad()

export const useActionsStore = defineStore('actions', () => {
	const allActions = reactive<Record<string, Action>>({})

	function register(actions: MinimalAction[]) {
		for (const action of actions as Action[]) {
			if (!action.label) {
				action.label = title(action.id)
			}

			if (action.id in actions) {
				throw new Error(`Action ${action.id} is already registered`)
			}

			allActions[action.id] = action

			if (action.input) {
				const performAction = () => {
					runBeforePerformHooks(action)
					action.perform()
				}

				const inputs = Array.isArray(action.input)
					? action.input
					: [action.input]

				for (const input of inputs) {
					let emitter: Bndr.Emitter

					if (typeof input === 'string') {
						if (input.startsWith('gamepad:')) {
							// Gamepad
							const button = input.split(':')[1]
							emitter = gamepad.button(button).down()
						} else {
							// keyboard
							emitter = keyboard.keydown(input, {
								capture: true,
								preventDefault: true,
							})
						}
					} else {
						emitter = input
					}
					emitter.on(performAction)
					Emitters.set(action.id, emitter)
				}
			}
		}

		onBeforeUnmount(() => {
			for (const action of actions) {
				delete allActions[action.id]
				Emitters.get(action.id)?.forEach(e => e.dispose())
			}
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
