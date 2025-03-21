import {onKeyStroke, useEventListener, useKeyModifier} from '@vueuse/core'
import {defineStore} from 'pinia'
import {
	computed,
	onBeforeUnmount,
	reactive,
	type Ref,
	ref,
	shallowRef,
	toRef,
	watch,
} from 'vue'

import {nodeContains} from '../util'

export type MultiSelectType = 'number' | 'color'

export interface MultiSelectSource {
	type: MultiSelectType
	el: Ref<HTMLElement | null>
	focusing: Readonly<Ref<boolean>>
	getValue: () => number
	setValue: (value: number) => void
	confirm: () => void
}

interface MultiSelectInput extends MultiSelectSource {
	subFocusing: Ref<boolean>
	initialValue?: number
}

export const useMultiSelectStore = defineStore('multi			Select', () => {
	const command = useKeyModifier('Meta')

	let popupEl: HTMLElement | null = null

	const inputs = reactive(new Map<symbol, MultiSelectInput>())

	const selectedInputs = computed(() =>
		[...inputs.values()].filter(input => input.focusing || input.subFocusing)
	)

	const focusCount = computed(() => selectedInputs.value.length)

	const popupVisible = ref(false)
	const focusedElement = shallowRef<HTMLElement | null>(null)

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

	onKeyStroke('Escape', defocusAll)

	function defocusAll() {
		popupVisible.value = false
		focusedElement.value = null
		inputs.forEach(input => {
			input.subFocusing = false
		})
	}

	function register(source: MultiSelectSource) {
		const id = Symbol()

		const store = reactive({...source, subFocusing: false})

		inputs.set(id, store)

		watch(source.focusing, () => {
			if (!source.focusing.value && command.value) {
				store.subFocusing = true
			}

			if (source.focusing.value) {
				if (command.value) {
					popupVisible.value = true
					store.subFocusing = true
					focusedElement.value = source.el.value
				} else {
					defocusAll()
				}
			}
		})

		onBeforeUnmount(() => {
			inputs.delete(id)
		})

		return {subFocusing: toRef(store, 'subFocusing')}
	}

	function captureValues() {
		selectedInputs.value.forEach(input => {
			input.initialValue = input.getValue()
		})
	}

	function updateValues(updator: (values: number[]) => number[]) {
		const values = selectedInputs.value.map(
			input => input.initialValue ?? input.getValue()
		)

		const updatedValues = updator(values)

		selectedInputs.value.forEach((input, i) => {
			input.setValue(updatedValues[i])
		})
	}

	function confirmValues() {
		selectedInputs.value.forEach(input => {
			input.confirm()
			input.initialValue = undefined
		})
	}

	return {
		register,
		popupVisible,
		focusedElement,
		captureValues,
		updateValues,
		confirmValues,
		focusCount,
		setPopupEl: (el: HTMLElement) => {
			popupEl = el
		},
	}
})
