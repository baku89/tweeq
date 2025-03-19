import {useEventListener} from '@vueuse/core'
import {computed, Ref} from 'vue'

import {InputCheckboxProps} from '../InputCheckbox/types'
import {useDrag} from '../useDrag'
export function useInputSwitch({
	track,
	input,
	props,
	emit,
}: {
	track: Ref<null | HTMLElement>
	input: Ref<null | HTMLInputElement>
	props: Pick<InputCheckboxProps, 'modelValue'>
	emit: any
}) {
	const tweakThreshold = 3

	const {dragging, initial, xy} = useDrag(track, {
		onClick() {
			emit('update:modelValue', !props.modelValue)
			emit('confirm')
			input.value?.focus()
		},
		onDragEnd({initial: [ix], xy: [x]}) {
			const dx = x - ix

			if (Math.abs(dx) <= tweakThreshold) {
				emit('update:modelValue', !props.modelValue)
			} else {
				emit('update:modelValue', dx > 0)
			}
			emit('confirm')
			input.value?.focus()
		},
	})

	const tweakingValue = computed(() => {
		if (!dragging.value) return null

		const dx = xy.value[0] - initial.value[0]

		if (Math.abs(dx) <= tweakThreshold) {
			return !props.modelValue
		} else {
			return dx > 0
		}
	})

	useEventListener(input, 'keydown', (e: KeyboardEvent) => {
		const key = e.key.toLowerCase()

		if (key === ' ') {
			update(!props.modelValue)
		} else if (key === 't' || key === '1' || key === 'y' || key === 'p') {
			update(true)
		} else if (key === 'f' || key === '0' || key === 'n' || key === 'm') {
			update(false)
		}

		function update(value: boolean) {
			e.preventDefault()
			emit('update:modelValue', value)
			emit('confirm')
		}
	})

	useEventListener(input, 'input', () => {
		const value = input.value!.checked
		emit('update:modelValue', value)
		emit('confirm')
	})

	useEventListener(input, 'focus', e => emit('focus', e))

	useEventListener(input, 'blur', e => emit('blur', e))

	return {tweakingValue}
}
