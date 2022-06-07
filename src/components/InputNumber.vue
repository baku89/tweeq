<template lang='pug'>
input.InputNumber(
	type='number',
	:value='modelValue',
	:step='step',
	@focus='onFocus',
	@change='onChange'
)
</template>

<script lang="ts">
import {defineComponent} from 'vue'

/**
 * Input for number
 */
export default defineComponent({
	name: 'InputNumber',
	props: {
		modelValue: {
			type: Number,
			required: true,
		},
		step: {
			type: Number,
			default: 0.1,
		},
	},
	emits: ['update:modelValue'],
	setup(_, {emit}) {
		const onChange = (e: InputEvent) => {
			const el = e.target as HTMLInputElement
			const value = parseFloat(el.value)
			emit('update:modelValue', value)
		}

		const onFocus = (e: InputEvent) => {
			const el = e.target as HTMLInputElement
			el.select()
		}

		return {onFocus, onChange}
	},
})
</script>

<style lang="stylus">
@import '@/common.styl'

.InputNumber
	input()
	font-numeric()
</style>