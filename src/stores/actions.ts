import * as Bndr from 'bndr-js'
import Case from 'case'
import {defineStore} from 'pinia'
import {markRaw, onBeforeUnmount, onUnmounted, reactive, ref} from 'vue'

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

export type ActionOptions = ActionItemOptions | ActionGroupOptions

export interface ActionItemOptions extends ActionItemBase {
	label?: string
	bind?: BindDescriptor
}

export interface ActionGroupOptions {
	icon?: string
	id: string
	label?: string
	children: ActionOptions[]
}

// 型定義だけを行い、実際の初期化はクライアントサイドでのみ行う
let keyboard: ReturnType<typeof Bndr.keyboard> | undefined
let gamepad: ReturnType<typeof Bndr.gamepad> | undefined

// クライアントサイドでのみ初期化する関数
const initBndr = () => {
	if (typeof window !== 'undefined' && (!keyboard || !gamepad)) {
		keyboard = Bndr.keyboard()
		gamepad = Bndr.gamepad()
	}
}

function bindDescriptorToEmitter(
	descriptor: BindDescriptor
): Bndr.Emitter | undefined {
	// SSRの場合は早期リターン
	if (typeof window === 'undefined') {
		return undefined
	}

	// 必要なら初期化
	initBndr()

	const binds = Array.isArray(descriptor) ? descriptor : [descriptor]

	const emitters = binds.map(b => {
		if (typeof b === 'string') {
			if (b.startsWith('gamepad:')) {
				// Gamepad
				const button = b.split(':')[1]
				return gamepad!.button(button as Bndr.ButtonName).down()
			} else {
				const repeat = b.endsWith('?repeat')
				b = b.replace(/\?.+$/, '')

				// keyboard
				return keyboard!.hotkey(b, {
					capture: true,
					preventDefault: true,
					repeat,
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
		// SSRの場合は何もしない
		if (typeof window === 'undefined') {
			return
		}

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
			const label = option.label ? option.label : Case.title(option.id)

			let group: ActionGroup

			const existingAction = parent.find(a => a.id === option.id)

			if (existingAction) {
				if ('perform' in existingAction) {
					throw new Error(`Existing item with id=${option.id} is not a group`)
				}
				group = existingAction

				group.icon ??= option.icon
				group.label ??= label
			} else {
				group = {...option, label, children: []}
				parent.push(group)
			}

			option.children.forEach(child => registerAction(child, group.children))
		}

		function registerItem(option: ActionItemOptions, parent: Action[]) {
			if (option.id in allActions) {
				const existingAction = allActions[option.id]
				existingAction.bind?.dispose()
			}

			const label = option.label ? option.label : Case.title(option.id)
			const bind = option.bind
				? bindDescriptorToEmitter(option.bind)
				: undefined

			const action: ActionItem = markRaw({...option, label, bind})

			bind?.on(() => {
				runBeforePerformHooks(action)
				option.perform()
			})

			allActions[option.id] = action

			if (bind) {
				emitters.add(bind)
			}

			const index = parent.findIndex(a => a.id === option.id)
			if (index !== -1) {
				parent[index] = action
			} else {
				parent.push(action)
			}
		}
	}

	async function perform(id: string): Promise<void> {
		// SSRの場合は何もしない
		if (typeof window === 'undefined') {
			return
		}

		const action = allActions[id]
		if (!action) {
			throw new Error(`Action ${id} is not registered`)
		}

		runBeforePerformHooks(action)
		await action.perform()
	}

	function runBeforePerformHooks(action: ActionItem) {
		for (const hook of onBeforePerformHooks) {
			hook(action)
		}
	}

	const onBeforePerformHooks = new Set<(action: ActionItem) => void>()

	function onBeforePerform(hook: (action: ActionItem) => void) {
		onBeforePerformHooks.add(hook)

		onUnmounted(() => {
			onBeforePerformHooks.delete(hook)
		})
	}

	return {register, perform, onBeforePerform, allActions, menu}
})
