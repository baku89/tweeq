import {useEventListener} from '@vueuse/core'
import {Ref} from 'vue'

import {useDrag} from '../useDrag'

export function useInputSwitch(
	$track: Ref<null | HTMLElement>,
	$input: Ref<null | HTMLInputElement>,
	getValue: () => boolean,
	setValue: (value: boolean) => void
) {
	useDrag($track, {
		onClick() {
			$input.value?.focus()
			setValue(!getValue())
		},
		onDragEnd({initial: [ix], xy: [x]}) {
			const dx = x - ix
			$input.value?.focus()
			setValue(dx > 0)
		},
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
}
