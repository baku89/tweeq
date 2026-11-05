import {Rect} from '@baku89/pave'
import {
	onKeyStroke,
	reactiveComputed,
	unrefElement,
	useEventListener,
} from '@vueuse/core'
import {vec2} from 'linearly'
import {defineStore} from 'pinia'
import {
	type Component,
	computed,
	hasInjectionContext,
	inject,
	type InjectionKey,
	markRaw,
	onBeforeUnmount,
	reactive,
	type Ref,
	watch,
} from 'vue'

import {type HSVA} from '../InputColor/types'
import {useModifierKeys} from '../use/useModifierKeys'
import {nodeContains} from '../util'
import {createMultiEdit} from './multiEdit'

/** `opaque` is what only its host can do anything to, by what it says in `commands`. */
export type MultiSelectType =
	| 'number'
	| 'color'
	| 'string'
	| 'boolean'
	| 'opaque'

type MultiSelectValue = number | string | boolean | HSVA

export interface MultiSelectSource {
	type: MultiSelectType
	el: Ref<HTMLElement | Component | null>
	focusing: Readonly<Ref<boolean>>
	speed?: Readonly<Ref<number>>
	/** What the input stands for, to whoever provides its host. */
	data?: Readonly<Ref<unknown>>
	getValue: () => MultiSelectValue
	setValue: (value: any) => void
	confirm: () => void
}

interface MultiSelectInput extends MultiSelectSource {
	id: symbol
	host: MultiSelectHost | null
}

/** Something that can be done to what is selected, shown in the popup as an icon. */
export interface MultiSelectCommand {
	label: string
	icon: string
	/** Do it, and say why not if it cannot be done. */
	perform?: () => string | void
	children?: {label: string; perform: () => string | void}[]
}

/**
 * What the app around a group of inputs knows about them, which is provided to them
 * with `MULTI_SELECT_HOST`.
 */
export interface MultiSelectHost {
	/** Have all that `write` writes count as one change. */
	batch?: (write: () => void) => void
	/** What can be done to the selection, when all of it belongs to this host. */
	commands?: (
		selected: readonly {type: MultiSelectType; data: unknown}[]
	) => MultiSelectCommand[]
}

export const MULTI_SELECT_HOST: InjectionKey<MultiSelectHost> =
	Symbol('tq-multi-select-host')

export const useMultiSelectStore = defineStore('multiSelect', () => {
	const {meta, shift, control} = useModifierKeys()

	const ctrlOrCommand = computed(() => meta.value || control.value)

	let popupEl: HTMLElement | null

	const inputs = reactive<Map<symbol, MultiSelectInput>>(new Map())

	const selectedIds = reactive<Set<symbol>>(new Set())

	function selectId(id: symbol) {
		selectedIds.delete(id)
		selectedIds.add(id)
	}

	const selectedInputs = computed(() =>
		[...selectedIds.values()].map(id => inputs.get(id)!)
	)

	const focusedElement = computed<HTMLElement | null>(() => {
		const id = [...selectedIds.values()].at(-1)

		if (!id) return null

		const input = inputs.get(id)

		if (!input) return null

		const el = unrefElement(input.el)

		return el ?? null
	})

	// Defocus logics
	function defocusAll() {
		selectedIds.clear()
	}

	// Pressing one of those selected may be to drag them all, or to go on with that one
	// alone, and that is only known once it has been let go of: a press that has hardly
	// moved is a click. Moves are counted up, as a locked pointer stays where it is.
	const CLICK_TRAVEL = 3

	let press: {travel: number; narrowTo: symbol | null} | null = null

	function narrowTo(id: symbol) {
		if (!inputs.has(id)) return
		defocusAll()
		selectId(id)
	}

	const pressOptions = {capture: true, passive: true}

	useEventListener(
		'pointerdown',
		e => {
			if (e.button === 0) press = {travel: 0, narrowTo: null}
		},
		pressOptions
	)
	useEventListener(
		'pointermove',
		e => {
			if (press) press.travel += Math.abs(e.movementX) + Math.abs(e.movementY)
		},
		pressOptions
	)
	useEventListener(
		'pointerup',
		() => {
			if (press?.narrowTo && press.travel <= CLICK_TRAVEL) narrowTo(press.narrowTo)
			press = null
		},
		pressOptions
	)
	useEventListener(
		'pointercancel',
		() => {
			press = null
		},
		pressOptions
	)

	// Defocus all when clicking outside of inputs except for popup
	useEventListener('pointerdown', e => {
		// Ignore non-primary pointer
		if (e.button !== 0) return

		const target = e.target as Node

		const clickedOutside = !selectedInputs.value.some(({el}) => {
			const _el = unrefElement(el)
			return _el && nodeContains(_el, target)
		})

		const clickedPopup = popupEl && nodeContains(popupEl, target)

		const modifierPressed = ctrlOrCommand.value || shift.value

		if (clickedOutside && !clickedPopup && !modifierPressed) {
			defocusAll()
		}
	})

	// Defocus all when pressing Escape, unless that is for a menu or the like to close.
	onKeyStroke('Escape', () => {
		if (document.querySelector('[popover="auto"]:popover-open')) return
		defocusAll()
	})
	onKeyStroke('Tab', defocusAll)

	const multiSelected = computed(() => {
		return selectedInputs.value.length > 1
	})

	function selectInbetween(start: Rect, end: Rect) {
		const startCenter = Rect.center(start)
		const endCenter = Rect.center(end)
		const direction = vec2.sub(endCenter, startCenter)

		const selectionRect = Rect.unite(start, end)

		const inbetweenIds: {id: symbol; order: number}[] = []

		inputs.forEach(({el, id}) => {
			if (!el) return

			const rect = Rect.fromDOMRect(unrefElement(el).getBoundingClientRect())

			if (Rect.intersects(selectionRect, rect)) {
				const center = Rect.center(rect)
				const order = vec2.dot(vec2.sub(center, startCenter), direction)

				inbetweenIds.push({id, order})
			}
		})

		inbetweenIds.sort((a, b) => a.order - b.order)
		inbetweenIds.forEach(({id}) => selectId(id))
	}

	const inputsWithin = (el: Element) =>
		[...inputs.values()].filter(({el: input}) => {
			const inside = unrefElement(input)
			return inside && nodeContains(el, inside)
		})

	/** Whether what is in `el` is all selected, along with something else or not. */
	function allSelectedWithin(el: Element | null | undefined) {
		if (!el || selectedInputs.value.length < 2) return false
		const within = inputsWithin(el)
		return within.length > 0 && within.every(({id}) => selectedIds.has(id))
	}

	/**
	 * Select the inputs in `el`, such as those of what a label is the label of: those
	 * alone, along with what is selected, or along with all from there to the last.
	 * Along with it, those that are all selected already are no longer.
	 */
	function selectWithin(el: Element, how: 'only' | 'along' | 'through') {
		const within = inputsWithin(el)
		if (how === 'only') defocusAll()
		if (how === 'along' && allSelectedWithin(el)) {
			within.forEach(({id}) => selectedIds.delete(id))
			return
		}
		if (how === 'through' && focusedElement.value) {
			// In the order they are in, to go on from each to the next.
			const area = Rect.unite(
				Rect.fromDOMRect(focusedElement.value.getBoundingClientRect()),
				Rect.fromDOMRect(el.getBoundingClientRect())
			)
			;[...inputs.values()]
				.flatMap(({id, el: input}) => {
					const at = unrefElement(input) as HTMLElement | undefined
					const rect = at?.getBoundingClientRect()
					return at && rect && rect.width > 0 && Rect.intersects(area, Rect.fromDOMRect(rect))
						? [{id, at}]
						: []
				})
				.sort((a, b) =>
					a.at.compareDocumentPosition(b.at) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
				)
				.forEach(({id}) => selectId(id))
			return
		}
		within.forEach(({id}) => selectId(id))
	}

	// Through every host among the selected, of which there is usually the one.
	function batch(write: () => void) {
		const hosts = new Set(selectedInputs.value.map(input => input.host))
		;[...hosts]
			.reduce<() => void>(
				(inner, host) => (host?.batch ? () => host.batch!(inner) : inner),
				write
			)()
	}

	const edit = createMultiEdit(() => selectedInputs.value, batch)

	const commands = computed<MultiSelectCommand[]>(() => {
		const selected = selectedInputs.value
		if (selected.length <= 1) return []
		const host = selected[0]?.host
		if (!host?.commands || selected.some(input => input.host !== host)) return []
		return host.commands(selected.map(({type, data}) => ({type, data})))
	})

	// Entry point for multi select for each input component
	function register(source: MultiSelectSource) {
		const id = Symbol()

		const host = hasInjectionContext() ? inject(MULTI_SELECT_HOST, null) : null

		const store = reactive({
			id,
			...source,
			host: host && markRaw(host),
		})

		const subfocus = computed(
			() => selectedIds.has(id) && !source.focusing.value
		)

		inputs.set(id, store)

		const readyToBeSelected = computed(() => {
			return (
				(ctrlOrCommand.value || shift.value) &&
				!selectedInputs.value.some(input => input.id === id)
			)
		})

		watch(
			source.focusing,
			focus => {
				if (focus) {
					// If shift is pressed, select the input inbetween
					// the focused input and the newly focused input
					if (shift.value && focusedElement.value && source.el.value) {
						const lastRect = Rect.fromDOMRect(
							focusedElement.value.getBoundingClientRect()
						)
						const newRect = Rect.fromDOMRect(
							unrefElement(source.el.value).getBoundingClientRect()
						)

						selectInbetween(lastRect, newRect)
					}

					const modified = ctrlOrCommand.value || shift.value

					if (!modified && selectedIds.has(id) && selectedIds.size > 1) {
						if (press) press.narrowTo = id
						else narrowTo(id)
						return
					}

					if (!modified) defocusAll()

					selectId(id)
				}
			},
			{flush: 'sync'}
		)

		// Automatically remove the input when unmounted. It may be selected, as one
		// that has focus is, and nothing can select what is not there.
		onBeforeUnmount(() => {
			inputs.delete(id)
			selectedIds.delete(id)
		})

		// What the input carries along: the others selected of its type. It writes its
		// own value itself, with whatever it does to it, such as rounding.
		const others = () =>
			selectedInputs.value.filter(
				input => input.id !== id && input.type === source.type
			)

		const othersEdit = createMultiEdit(others, batch)

		function apply(updator: (value: any, context: {i: number}) => any) {
			othersEdit.update(values => {
				const targets = others()
				return values.map((value, k) =>
					updator(value, {
						i: selectedInputs.value.findIndex(
							input => input.id === targets[k]?.id
						),
					})
				)
			})
		}

		return reactiveComputed(() => ({
			subfocus,
			index: selectedInputs.value.findIndex(input => input.id === id),
			readyToBeSelected,
			begin: othersEdit.begin,
			apply,
			commit: othersEdit.commit,
			batch,
			multiSelected,
		}))
	}

	return {
		register,
		focusedElement,
		edit,
		commands,
		selectedInputs,
		selectWithin,
		allSelectedWithin,
		setPopupEl: (el: HTMLElement) => {
			popupEl = el
		},
	}
})
