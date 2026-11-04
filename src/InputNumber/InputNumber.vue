<script lang="ts" setup>
import {computed} from 'vue'

import {displayedRange} from './display'
import InputNumberBase from './InputNumberBase.vue'
import {type InputNumberProps} from './types'

/**
 * A number, which can be shown as something other than what it is. Everything goes to the field
 * in terms of what it shows, which is all that it knows about.
 */
const model = defineModel<number>({required: true})

// As the field has them, as what can be a boolean and is not given would otherwise be false.
const props = withDefaults(defineProps<InputNumberProps>(), {
	bar: 0,
	clampMin: true,
	clampMax: true,
})

const forwarded = computed(() => {
	const {display, ...rest} = props
	if (!display) return rest
	const {min, max, step, default: initial} = rest
	return {
		...rest,
		...displayedRange(
			{
				...(min === undefined ? {} : {min}),
				...(max === undefined ? {} : {max}),
				...(step === undefined ? {} : {step}),
				...(initial === undefined ? {} : {default: initial}),
			},
			display
		),
	}
})

const shown = computed({
	get: () => (props.display ? props.display.to(model.value) : model.value),
	set: value => {
		model.value = props.display ? props.display.from(value) : value
	},
})
</script>

<template>
	<InputNumberBase v-bind="forwarded" v-model="shown" />
</template>
