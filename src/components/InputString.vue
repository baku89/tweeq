<template lang="pug">
.InputString(:class='{invalid}')
	input.InputString__input(
		type='text'
		:value='modelValue'
		:disabled='disabled'
		@focus='onFocus'
	@input='onInput')
</template>

<script lang="ts">
import _ from 'lodash'
import {defineComponent} from 'vue'

export default defineComponent({
	name: 'InputString',
	props: {
		modelValue: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		invalid: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, {emit}) {
		function onFocus(e: Event) {
			;(e.target as HTMLInputElement).select()
		}

		function onInput(e: Event) {
			const newValue = (e.target as HTMLInputElement).value
			emit('update:modelValue', newValue)
		}

		return {onFocus, onInput}
	},
})
</script>

<style lang="stylus">
	@import '@/common.styl'

.InputString
	input()
</style>
