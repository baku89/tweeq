import {Rect} from '@baku89/pave'
import {
	onKeyStroke,
	reactiveComputed,
	useEventListener,
	useMagicKeys,
} from '@vueuse/core'
import {defineStore} from 'pinia'
import {
	computed,
	onBeforeUnmount,
	reactive,
	type Ref,
	shallowRef,
	watch,
} from 'vue'

import {nodeContains} from '../util'

export type MultiSelectType = 'number' | 'color' | 'string' | 'boolean'

type MultiSelectValue = number | string | boolean

export interface MultiSelectSource {
	type: MultiSelectType
	el: Ref<HTMLElement | null>
	focusing: Readonly<Ref<boolean>>
	getValue: () => MultiSelectValue
	setValue: (value: any) => void
	confirm: () => void
}

interface MultiSelectInput extends MultiSelectSource {
	id: symbol
	subfocus: Ref<boolean>
	capturedValue?: MultiSelectValue
}

export const useMultiSelectStore = defineStore('multiSelect', () => {
	const {meta, shift} = useMagicKeys()

	let popupEl: HTMLElement | null

	const inputs = reactive<MultiSelectInput[]>([])

	const selectedInputs = computed(() =>
		inputs.filter(input => input.focusing || input.subfocus)
	)

	const focusedElement = shallowRef<HTMLElement | null>(null)

	// Defocus logics
	function defocusAll() {
		focusedElement.value = null
		inputs.forEach(input => {
			input.subfocus = false
		})
	}

	// Defocus all when clicking outside of inputs except for popup
	useEventListener('pointerdown', e => {
		// Ignore non-primary pointer
		if (e.button !== 0) return

		const target = e.target as Node

		const clickedOutside = ![...inputs.values()].some(({el}) => {
			return el && nodeContains(el, target)
		})

		const clickedPopup = popupEl && nodeContains(popupEl, target)

		if (clickedOutside && !clickedPopup) {
			defocusAll()
		}
	})

	// Defocus all when pressing Escape
	onKeyStroke('Escape', defocusAll)

	const multiSelected = computed(() => {
		return selectedInputs.value.length > 1
	})

	// Entry point for multi select for each input component
	function register(source: MultiSelectSource) {
		const id = Symbol()

		const store = reactive({id, ...source, subfocus: false})

		inputs.push(store)

		const readyToBeSelected = computed(() => {
			return (
				(meta.value || shift.value) &&
				!selectedInputs.value.some(input => input.id === id)
			)
		})

		watch(
			source.focusing,
			focus => {
				if (meta.value || shift.value) {
					store.subfocus = true
				}

				if (focus) {
					// If shift is pressed, select the input inbetween
					// the focused input and the newly focused input
					if (shift.value && focusedElement.value && source.el.value) {
						const lastRect = Rect.fromDOMRect(
							focusedElement.value.getBoundingClientRect()
						)
						const newRect = Rect.fromDOMRect(
							source.el.value.getBoundingClientRect()
						)

						const selectionRect = Rect.unite(lastRect, newRect)

						inputs.forEach(input => {
							if (!input.el) return

							const rect = Rect.fromDOMRect(input.el.getBoundingClientRect())

							if (Rect.intersects(selectionRect, rect)) {
								input.subfocus = true
							}
						})
					}

					if (!meta.value && !shift.value) {
						defocusAll()
					}

					focusedElement.value = source.el.value
				}
			},
			{flush: 'sync'}
		)

		// Automatically remove the input when unmounted
		onBeforeUnmount(() => {
			inputs.splice(
				inputs.findIndex(input => input.id === id),
				1
			)
		})

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
			subfocus: store.subfocus,
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
