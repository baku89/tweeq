import {Bndr} from 'bndr-js'
import {title} from 'case'
import {
	inject,
	InjectionKey,
	onBeforeUnmount,
	onUnmounted,
	provide,
	reactive,
} from 'vue'

export interface Action {
	id: string
	label: string
	shortLabel?: string
	menu?: string
	icon?: string
	input?: string | string[]
	perform(): any
}

export interface MinimalAction extends Omit<Action, 'label'> {
	label?: string
}

const Emitters = new Map<string, Bndr.Emitter>()

const ActionsKey: InjectionKey<Record<string, Action>> = Symbol('tqActions')

const keyboard = Bndr.keyboard()

export function provideActions() {
	const allActions = reactive<Record<string, Action>>({})

	provide(ActionsKey, allActions)

	function registerActions(actions: MinimalAction[]) {
		for (const action of actions as Action[]) {
			if (!action.label) {
				action.label = title(action.id)
			}

			if (action.id in actions) {
				throw new Error(`Action ${action.id} is already registered`)
			}

			allActions[action.id] = action

			if (action.input) {
				const inputs = Array.isArray(action.input)
					? action.input
					: [action.input]

				for (const input of inputs) {
					const emitter = keyboard.keydown(input, {
						capture: true,
						preventDefault: true,
					})
					emitter.on(() => {
						runBeforeActionPerformHooks(action)
						action.perform()
					})
				}
			}
		}

		onBeforeUnmount(() => {
			for (const action of actions) {
				delete allActions[action.id]
				Emitters.get(action.id)?.dispose()
			}
		})
	}

	function performAction(id: string) {
		const action = allActions[id]
		if (!action) {
			throw new Error(`Action ${id} is not registered`)
		}

		for (const hook of onBeforeActionPerformHooks) {
			hook(action)
		}

		runBeforeActionPerformHooks(action)
		action.perform()
	}

	function runBeforeActionPerformHooks(action: Action) {
		for (const hook of onBeforeActionPerformHooks) {
			hook(action)
		}
	}

	const onBeforeActionPerformHooks = new Set<(action: Action) => void>()

	function onBeforeActionPerform(hook: (action: Action) => void) {
		onBeforeActionPerformHooks.add(hook)

		onUnmounted(() => {
			onBeforeActionPerformHooks.delete(hook)
		})
	}

	return {registerActions, performAction, onBeforeActionPerform}
}

export function useActions() {
	const actions = inject(ActionsKey)

	if (!actions) {
		throw new Error('actions is not provided')
	}

	return {actions}
}
