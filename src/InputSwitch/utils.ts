import {useEventListener} from '@vueuse/core'
import {computed, Ref} from 'vue'

import {useDrag} from '../useDrag'

export function useInputSwitch(
	$track: Ref<null | HTMLElement>,
	$input: Ref<null | HTMLInputElement>,
	getValue: () => boolean,
	setValue: (value: boolean) => void
) {
	const tweakThreshold = 3

	const {dragging, initial, xy} = useDrag($track, {
		onClick() {
			$input.value?.focus()
			setValue(!getValue())
		},
		onDragEnd({initial: [ix], xy: [x]}) {
			const dx = x - ix

			$input.value?.focus()

			if (Math.abs(dx) <= tweakThreshold) {
				setValue(!getValue())
			} else {
				setValue(dx > 0)
			}
		},
	})

	const tweakingValue = computed(() => {
		if (!dragging.value) return null

		const dx = xy.value[0] - initial.value[0]

		if (Math.abs(dx) <= tweakThreshold) {
			return !getValue()
		} else {
			return dx > 0
		}
	})

	useEventListener($input, 'keydown', (e: KeyboardEvent) => {
		const key = e.key.toLowerCase()

		if (key === ' ') {
			update(!getValue())
		} else if (key === 't' || key === '1' || key === 'y' || key === 'p') {
			update(true)
		} else if (key === 'f' || key === '0' || key === 'n' || key === 'm') {
			update(false)
		}

		function update(value: boolean) {
			e.preventDefault()
			setValue(value)
		}
	})

	useEventListener($input, 'input', () => {
		const value = $input.value!.checked
		setValue(value)
	})

	return {tweakingValue}
}
