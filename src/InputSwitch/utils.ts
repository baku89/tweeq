import {useEventListener, useFocus} from '@vueuse/core'
import {computed, Ref, toRef, watch} from 'vue'

import {InputCheckboxProps} from '../InputCheckbox/types'
import {useMultiSelectStore} from '../stores/multiSelect'
import {useDrag} from '../use/useDrag'
export function useInputSwitch({
	track,
	input,
	props,
	emit,
}: {
	track: Ref<HTMLElement | null>
	input: Ref<HTMLInputElement | null>
	props: Pick<InputCheckboxProps, 'modelValue'>
	emit: any
}) {
	const tweakThreshold = 3
	let valueOnTweak: boolean | null = null

	const {focused} = useFocus(input)

	const {dragging, initial, xy} = useDrag(track, {
		dragDelaySeconds: 0.2,
		onClick() {
			if (!multi.readyToBeSelected) {
				emit('update:modelValue', !props.modelValue)
				multi.update(value => !value)
			}

			emit('confirm')
			input.value?.focus()
		},
		onDragStart() {
			emit('focus')
			valueOnTweak = props.modelValue
		},
		onDragEnd() {
			emit('confirm')
			input.value?.focus()
		},
	})

	const tweakingValue = computed(() => {
		if (!dragging.value) return null

		const dx = xy.value[0] - initial.value[0]

		if (Math.abs(dx) <= tweakThreshold) {
			return !valueOnTweak
		} else {
			return dx > 0
		}
	})

	watch(tweakingValue, value => {
		if (value === null) return
		multi.update(() => value)
		emit('update:modelValue', value)
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

	useEventListener(input, 'focus', (e: FocusEvent) => {
		// Only emit focus event when the focus is triggered by the keyboard
		if (e.relatedTarget !== null) {
			emit('focus')
		}
	})

	useEventListener(input, 'blur', () => emit('blur'))

	// Multi Select

	const multi = useMultiSelectStore().register({
		type: 'boolean',
		el: track,
		focusing: focused,
		getValue: () => props.modelValue,
		setValue(value) {
			emit('update:modelValue', value)
		},
		confirm() {
			emit('confirm')
		},
	})

	return {
		tweakingValue,
		subfocus: toRef(multi, 'subfocus'),
	}
}
