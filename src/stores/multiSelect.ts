import {onKeyStroke, useEventListener, useKeyModifier} from '@vueuse/core'
import {defineStore} from 'pinia'
import {type Ref, ref, shallowRef, watch} from 'vue'

interface MultiSelectSource {
	el: Ref<HTMLElement | null>
	focusing: Ref<boolean>
	getValue: () => number
	setValue: (value: number) => void
	conform: () => void
}

interface MultiSelectStore extends MultiSelectSource {
	subFocusing: Ref<boolean>
	initialValue?: number
}

export const useMultiSelectStore = defineStore('multiSelect', () => {
	const command = useKeyModifier('Meta')

	let popupEl: HTMLElement | null = null

	const selectStores = new Map<symbol, MultiSelectStore>()
	const focusCount = ref(0)

	const popupVisible = ref(false)
	const focusedElement = shallowRef<HTMLElement | null>(null)

	useEventListener('pointerdown', e => {
		// Ignore non-primary pointer
		if (e.button !== 0) return

		const clickedOutside = ![...selectStores.values()].some(({el}) => {
			if (!el.value) return false
			return e.target === el.value || el.value.contains(e.target as Node)
		})

		const clickedPopup =
			popupEl === e.target || popupEl?.contains(e.target as Node)

		if (clickedOutside && !clickedPopup) {
			defocusAll()
		}
	})

	onKeyStroke('Escape', defocusAll)

	function defocusAll() {
		popupVisible.value = false
		focusedElement.value = null
		selectStores.forEach(({subFocusing}) => {
			subFocusing.value = false
		})
	}

	function register(source: MultiSelectSource) {
		const id = Symbol()
		const subFocusing = ref(false)

		selectStores.set(id, {...source, subFocusing})

		watch(source.focusing, () => {
			if (!source.focusing.value && command.value) {
				subFocusing.value = true
			}

			if (source.focusing.value) {
				if (command.value) {
					popupVisible.value = true
					subFocusing.value = true
					focusedElement.value = source.el.value
				} else {
					defocusAll()
				}
			}

			updateFocusCount()
		})

		function unregister() {
			selectStores.delete(id)
		}

		return {subFocusing, unregister}
	}

	function captureValues() {
		for (const record of selectStores.values()) {
			if (record.focusing.value || record.subFocusing.value) {
				const initialValue = record.getValue()
				record.initialValue = initialValue
			}
		}
	}

	function updateFocusCount() {
		focusCount.value = [...selectStores.values()].filter(
			({focusing, subFocusing}) => focusing.value || subFocusing.value
		).length
	}

	function updateValues(updator: (values: number[]) => number[]) {
		const values = []
		const ids = []
		for (const [id, r] of selectStores.entries()) {
			if (r.focusing.value || r.subFocusing.value) {
				ids.push(id)
				values.push(r.initialValue ?? r.getValue())
			}
		}

		const updatedValues = updator(values)
		for (let i = 0; i < ids.length; i++) {
			const id = ids[i]
			const value = updatedValues[i]
			const r = selectStores.get(id)
			if (r) {
				r.setValue(value)
			}
		}
	}

	function conformValues() {
		for (const r of selectStores.values()) {
			if (r.focusing.value || r.subFocusing.value) {
				r.conform()
			}
		}
	}

	return {
		register,
		popupVisible,
		focusedElement,
		captureValues,
		updateValues,
		conformValues,
		focusCount,
		setPopupEl: (el: HTMLElement) => {
			popupEl = el
		},
	}
})
