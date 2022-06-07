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
	height var(--input-height)
	border 1px solid transparent
	border-radius var(--input-border-radius)
	background var(--base01)
	color var(--base06)
	cursor col-resize
	input-transition(border-color)
	font-numeric()

	&::selection
		background var(--base03)

	&:hover, &:focus, &:focus-within
		border-color var(--base08)
		color var(--base06)

	&:focus.invalid
		border-color var(--base0B)
		box-shadow 0 0 0 1px var(--base0B)

	&:focus
		box-shadow 0 0 0 1px var(--base08)
</style>