import {onKeyStroke, useEventListener, useKeyModifier} from '@vueuse/core'
import {defineStore} from 'pinia'
import {readonly, type Ref, ref, shallowRef, watch} from 'vue'

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

	const store = new Map<symbol, MultiSelectStore>()

	const popupVisible = ref(false)
	const focusedElement = shallowRef<HTMLElement | null>(null)

	useEventListener('pointerdown', e => {
		// Ignore non-primary pointer
		if (e.button !== 0) return

		const clickedOutside = ![...store.values()].some(({el}) => {
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
		store.forEach(({subFocusing}) => {
			subFocusing.value = false
		})
	}

	function register(source: MultiSelectSource) {
		const id = Symbol()
		const subFocusing = ref(false)

		store.set(id, {...source, subFocusing})

		watch(source.focusing, () => {
			if (!source.focusing.value && command.value) {
				subFocusing.value = true
			}

			if (source.focusing.value && command.value) {
				popupVisible.value = true
				subFocusing.value = true
				focusedElement.value = source.el.value
			}
		})

		function unregister() {
			store.delete(id)
		}

		return {subFocusing, unregister}
	}

	function captureValues() {
		for (const record of store.values()) {
			if (record.focusing.value || record.subFocusing.value) {
				const initialValue = record.getValue()
				record.initialValue = initialValue
			}
		}
	}

	function updateValues(updator: (value: number) => number) {
		for (const r of store.values()) {
			if (r.focusing.value || r.subFocusing.value) {
				r.setValue(updator(r.initialValue ?? r.getValue()))
			}
		}
	}

	function conformValues() {
		for (const r of store.values()) {
			if (r.focusing.value || r.subFocusing.value) {
				r.conform()
			}
		}
	}

	return {
		register,
		popupVisible: readonly(popupVisible),
		focusedElement: readonly(focusedElement),
		captureValues,
		updateValues,
		conformValues,
		setPopupEl: (el: HTMLElement) => {
			popupEl = el
		},
	}
})
