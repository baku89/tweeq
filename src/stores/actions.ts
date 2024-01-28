import * as Bndr from 'bndr-js'
import {title} from 'case'
import {defineStore} from 'pinia'
import {onBeforeUnmount, onUnmounted, reactive, ref} from 'vue'

interface ActionItemBase {
	id: string
	shortLabel?: string
	menu?: string
	icon?: string
	perform(): any
}

export interface ActionItem extends ActionItemBase {
	label: string
	bind?: Bndr.Emitter
}

export type Action = ActionItem | ActionGroup

export interface ActionGroup {
	icon?: string
	id: string
	label: string
	children: Action[]
}

type BindDescriptor = string | Bndr.Emitter | (string | Bndr.Emitter)[]

type ActionOptions = ActionItemOptions | ActionGroupOptions

export interface ActionItemOptions extends ActionItemBase {
	label?: string
	bind?: BindDescriptor
}

interface ActionGroupOptions {
	icon?: string
	id: string
	label?: string
	children: ActionOptions[]
}

const keyboard = Bndr.keyboard()
const gamepad = Bndr.gamepad()

function bindDescriptorToEmitter(
	descriptor: BindDescriptor
): Bndr.Emitter | undefined {
	const binds = Array.isArray(descriptor) ? descriptor : [descriptor]

	const emitters = binds.map(b => {
		if (typeof b === 'string') {
			if (b.startsWith('gamepad:')) {
				// Gamepad
				const button = b.split(':')[1]
				return gamepad.button(button as Bndr.ButtonName).down()
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
		return emitters[0]
	} else if (emitters.length > 1) {
		return Bndr.combine(...emitters)
	}
}

export const useActionsStore = defineStore('actions', () => {
	const allActions = reactive<Record<string, ActionItem>>({})

	const menu = ref<Action[]>([])

	function register(options: ActionOptions[]) {
		const emitters = new Set<Bndr.Emitter>()

		for (const option of options) {
			registerAction(option, menu.value as Action[])
		}

		onBeforeUnmount(() => {
			for (const action of options) {
				delete allActions[action.id]
			}
			emitters.forEach(emitter => emitter.dispose())
			emitters.clear()
		})

		function registerAction(option: ActionOptions, parent: Action[]) {
			if ('perform' in option) {
				registerItem(option, parent)
			} else {
				registerGroup(option, parent)
			}
		}

		function registerGroup(option: ActionGroupOptions, parent: Action[]) {
			const label = option.label ? option.label : title(option.id)

			let group: ActionGroup

			const existingAction = parent.find(a => a.id === option.id)

			if (existingAction) {
				if ('perform' in existingAction) {
					throw new Error(`Existing item with id=${option.id} is not a group`)
				}
				group = existingAction

				if (!group.icon && option.icon) {
					group.icon = option.icon
				}
			} else {
				group = {...option, label, children: []}
				parent.push(group)
			}

			option.children.forEach(child => registerAction(child, group.children))
		}

		function registerItem(option: ActionItemOptions, parent: Action[]) {
			if (option.id in allActions) {
				throw new Error(`Action ${option.id} is already registered`)
			}

			const label = option.label ? option.label : title(option.id)
			const bind = option.bind
				? bindDescriptorToEmitter(option.bind)
				: undefined

			const action: ActionItem = {...option, label, bind}

			bind?.on(() => {
				runBeforePerformHooks(action)
				option.perform()
			})

			allActions[option.id] = action
			if (bind) {
				emitters.add(bind)
			}

			parent.push(action)
		}
	}

	function perform(id: string) {
		const action = allActions[id]
		if (!action) {
			throw new Error(`Action ${id} is not registered`)
		}

		runBeforePerformHooks(action)
		action.perform()
	}

	function runBeforePerformHooks(action: ActionItem) {
		for (const hook of onBeforePerformHooks) {
			hook(action)
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const onBeforePerformHooks = new Set<(action: ActionItem) => void>()

	function onBeforePerform(hook: (action: ActionItem) => void) {
		onBeforePerformHooks.add(hook)

		onUnmounted(() => {
			onBeforePerformHooks.delete(hook)
		})
	}

	return {register, perform, onBeforePerform, allActions, menu}
})
