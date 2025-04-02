import {Rect} from '@baku89/pave'
import {
	onKeyStroke,
	reactiveComputed,
	unrefElement,
	useEventListener,
	useMagicKeys,
} from '@vueuse/core'
import {vec2} from 'linearly'
import {defineStore} from 'pinia'
import {
	Component,
	computed,
	onBeforeUnmount,
	reactive,
	type Ref,
	watch,
} from 'vue'

import {HSVA} from '../InputColor/types'
import {nodeContains} from '../util'

export type MultiSelectType = 'number' | 'color' | 'string' | 'boolean'

type MultiSelectValue = number | string | boolean | HSVA

export interface MultiSelectSource {
	type: MultiSelectType
	el: Ref<HTMLElement | Component | null>
	focusing: Readonly<Ref<boolean>>
	speed?: Readonly<Ref<number>>
	getValue: () => MultiSelectValue
	setValue: (value: any) => void
	confirm: () => void
}

interface MultiSelectInput extends MultiSelectSource {
	id: symbol
	capturedValue?: MultiSelectValue
}

export const useMultiSelectStore = defineStore('multiSelect', () => {
	const {meta, shift} = useMagicKeys()

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

		const modifierPressed = meta.value || shift.value

		if (clickedOutside && !clickedPopup && !modifierPressed) {
			defocusAll()
		}
	})

	// Defocus all when pressing Escape
	onKeyStroke('Escape', defocusAll)
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

	// Entry point for multi select for each input component
	function register(source: MultiSelectSource) {
		const id = Symbol()

		const store = reactive({id, ...source})

		const subfocus = computed(
			() => selectedIds.has(id) && !source.focusing.value
		)

		inputs.set(id, store)

		const readyToBeSelected = computed(() => {
			return (
				(meta.value || shift.value) &&
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

					if (!subfocus.value && !meta.value && !shift.value) {
						defocusAll()
					}

					if (!subfocus.value) {
						selectId(id)
					}
				}
			},
			{flush: 'sync'}
		)

		// Automatically remove the input when unmounted
		onBeforeUnmount(() => inputs.delete(id))

		function update(updator: (value: any, context: {i: number}) => any) {
			selectedInputs.value.forEach((input, i) => {
				if (input.id === id || input.type !== source.type) return

				const context = {i}

				const newValue = updator(
					input.capturedValue ?? input.getValue(),
					context
				)

				input.setValue(newValue)
			})
		}

		function confirm() {
			selectedInputs.value.forEach(input => {
				if (input.id === id) return
				input.confirm()
			})
		}

		return reactiveComputed(() => ({
			subfocus,
			index: selectedInputs.value.findIndex(input => input.id === id),
			capture: captureValues,
			readyToBeSelected,
			update,
			confirm,
			multiSelected,
		}))
	}

	function captureValues() {
		selectedInputs.value.forEach(input => {
			input.capturedValue = input.getValue()
		})
	}

	function updateValues(updator: (values: any[]) => MultiSelectValue[]) {
		const values = selectedInputs.value.map(
			input => input.capturedValue ?? input.getValue()
		)

		const updatedValues = updator(values)

		selectedInputs.value.forEach((input, i) => {
			input.setValue(updatedValues[i])
		})
	}

	function confirmValues() {
		selectedInputs.value.forEach(input => {
			input.confirm()
			input.capturedValue = undefined
		})
	}

	return {
		register,
		focusedElement,
		captureValues,
		updateValues,
		confirmValues,
		selectedInputs,
		setPopupEl: (el: HTMLElement) => {
			popupEl = el
		},
	}
})
