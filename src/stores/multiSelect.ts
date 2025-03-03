import {onKeyStroke, useEventListener, useKeyModifier} from '@vueuse/core'
import {defineStore} from 'pinia'
import {type Ref, ref, watch} from 'vue'

interface MultiSelectSource {
	el: Ref<HTMLElement | null>
	focusing: Ref<boolean>
	getValue: () => number
	setValue: (value: number) => void
}

interface MultiSelectStore extends MultiSelectSource {
	subFocusing: Ref<boolean>
}

export const useMultiSelectStore = defineStore('multiSelect', () => {
	const command = useKeyModifier('Meta')

	let popupEl: HTMLElement | null = null

	const store = new Map<symbol, MultiSelectStore>()

	const popupVisible = ref(false)

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
		store.forEach(({subFocusing}) => {
			subFocusing.value = false
		})
	}

	function register({el, focusing, getValue, setValue}: MultiSelectSource) {
		const id = Symbol()
		const subFocusing = ref(false)

		store.set(id, {el, focusing, subFocusing, getValue, setValue})

		watch(focusing, () => {
			if (!focusing.value && command.value) {
				subFocusing.value = true
			}

			if (focusing.value && command.value) {
				popupVisible.value = true
				subFocusing.value = true
			}
		})

		function unregister() {
			store.delete(id)
		}

		return {subFocusing, unregister}
	}

	function update(updator: (value: number) => number) {
		for (const {focusing, subFocusing, setValue, getValue} of store.values()) {
			if (focusing.value || subFocusing.value) {
				setValue(updator(getValue()))
			}
		}
	}

	return {
		register,
		popupVisible,
		update,
		setPopupEl: (el: HTMLElement) => {
			if (popupEl) {
				throw new Error('Popup element already set')
			}

			popupEl = el
		},
	}
})
