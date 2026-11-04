import * as Bndr from 'bndr-js'
import Case from 'case'
import {defineStore} from 'pinia'
import {
	computed,
	markRaw,
	onBeforeUnmount,
	onUnmounted,
	reactive,
	ref,
	shallowRef,
	watch,
} from 'vue'

import {
	type ActionContext,
	type ActionParam,
	argsOf,
	canAsk,
	type Filled,
	fill,
	type Form,
	formOf,
	isComplete,
	tookSelection,
} from '../CommandPalette/holes'
import type {MenuCommand, MenuItem} from '../Menu'
import {keyboardTarget} from '../use/keyboardTarget'

interface ActionItemBase {
	id: string
	shortLabel?: string
	menu?: string
	icon?: string
	/**
	 * Sort key among siblings in the same menu / submenu (ascending). Sparse
	 * values are fine (1, 40, 200); unset items keep their registration order
	 * after the explicitly-ordered ones.
	 */
	order?: number
	/**
	 * What it needs, which what is selected can provide. Without any, it can always run.
	 * With some, `perform` gets one argument for each.
	 */
	params?: readonly ActionParam[]
	perform(...args: any[]): any
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
	order?: number
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
	order?: number
	children: ActionOptions[]
}

// 型定義だけを行い、実際の初期化はクライアントサイドでのみ行う
let keyboard: ReturnType<typeof Bndr.keyboard> | undefined
let gamepad: ReturnType<typeof Bndr.gamepad> | undefined

// クライアントサイドでのみ初期化する関数
const initBndr = () => {
	if (typeof window !== 'undefined' && (!keyboard || !gamepad)) {
		keyboard = Bndr.keyboard(keyboardTarget())
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

// Recursively sort each menu / submenu by its items' `order` (ascending, stable
// so equal/unset keys keep registration order — `order` only ranks siblings),
// and append any registered extras (a separator + the extra items) to the group
// whose id matches.
function buildMenu(
	items: Action[],
	extras: Record<string, MenuCommand[]>,
	command: (action: ActionItem) => MenuCommand
): MenuItem[] {
	const sorted = [...items].sort(
		(a, b) =>
			(a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
	)
	return sorted.map(item => {
		if (!('children' in item)) return command(item)
		const children = buildMenu(item.children, extras, command)
		const ex = extras[item.id]
		if (ex?.length) children.push({separator: true}, ...ex)
		return {...item, children}
	})
}

export const useActionsStore = defineStore('actions', () => {
	const allActions = reactive<Record<string, ActionItem>>({})

	// Registration order, as built up by register(). Exposed (order-sorted, with
	// extras appended) via the `menu` getter.
	const menuRaw = ref<Action[]>([])

	// Dynamic, declarative extras appended (after a separator) to a group's
	// children — e.g. a Recent Projects list. Keyed by group id; replacing a
	// group's array is idempotent, so removals are handled cleanly.
	const menuExtras = ref<Record<string, MenuCommand[]>>({})

	function setMenuExtras(groupId: string, items: MenuCommand[]) {
		menuExtras.value = {...menuExtras.value, [groupId]: items}
	}

	const menu = computed(() =>
		buildMenu(menuRaw.value as Action[], menuExtras.value, action =>
			Object.assign({}, action, {
				label: labelOf(action),
				perform: () => void request(action),
			})
		)
	)

	function register(options: ActionOptions[]) {
		// SSRの場合は何もしない
		if (typeof window === 'undefined') {
			return
		}

		const emitters = new Set<Bndr.Emitter>()

		for (const option of options) {
			registerAction(option, menuRaw.value as Action[])
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
				// A group can be registered from several places; let any of them
				// supply the order (first non-undefined wins).
				group.order ??= option.order
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
				run(action)
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

		await request(action)
	}

	const context = shallowRef<ActionContext | null>(null)

	/** Says what actions are offered in, for as long as the component calling this is there. */
	function provideContext<Type, Value>(provided: ActionContext<Type, Value>) {
		const held = provided as unknown as ActionContext
		context.value = held
		onBeforeUnmount(() => {
			if (context.value === held) context.value = null
		})
	}

	const filled = (action: ActionItem): Filled => fill(action.params, context.value)

	const asks = (action: ActionItem): boolean =>
		canAsk(filled(action), context.value?.types ?? null)

	/** Whether `action` can run now, by what is selected, or by asking for the rest. */
	const canRun = (action: ActionItem): boolean =>
		filled(action).missing.length === 0 || asks(action)

	/** What `action` is called, which says so if it will ask for something first. */
	const labelOf = (action: ActionItem): string =>
		asks(action) ? `${action.label}...` : action.label

	/** Performs `action` with what is selected, unless that leaves it missing something. */
	function run(action: ActionItem): unknown {
		const {args, missing} = filled(action)
		if (missing.length > 0) return
		runBeforePerformHooks(action)
		return action.perform(...args)
	}

	/** The action waiting for what it is missing, which goes on while anything else does. */
	const form = shallowRef<Form<ActionItem> | null>(null)

	/** As `run`, but asks for what is missing, in a form. */
	function request(action: ActionItem): unknown {
		const types = context.value?.types ?? null
		const asked = formOf(action, action.params, filled(action), types)
		if (asked === null) return run(action)
		form.value = asked
	}

	/** Performs what the form is for, if it has all it needs. */
	function submitForm() {
		const current = form.value
		if (current === null || !isComplete(current)) return
		form.value = null
		runBeforePerformHooks(current.action)
		return current.action.perform(...argsOf(current))
	}

	watch(
		() => (form.value === null ? null : context.value?.subject()),
		subject => {
			if (form.value === null || !subject) return
			form.value = tookSelection(form.value, subject, context.value?.types ?? null)
		}
	)

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

	return {
		register,
		perform,
		run,
		request,
		form,
		submitForm,
		context,
		provideContext,
		filled,
		canRun,
		labelOf,
		onBeforePerform,
		allActions,
		menu,
		setMenuExtras,
	}
})
