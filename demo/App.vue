<template lang="pug">
GlispUI.App
	h1 Glisp UI
	p
		:markdown-it
			Glisp UI is a components library that bundles various types of UI for building professional design tool. Originally developed for [Glisp](https://glisp.app/docs).
	SchemeViewer
	.App__number-wrapper
		p {{number.toString()}}
		InputNumber.number-input(v-model='number')
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue'

import GlispUI from '@/components/GlispUI.vue'
import InputNumber from '@/components/InputNumber.vue'
import SchemeViewer from './SchemeViewer.vue'

export default defineComponent({
	components: {
		GlispUI,
		InputNumber,
		SchemeViewer,
	},
	name: 'App',
	setup() {
		return {number: ref(0)}
	},
})
</script>

<style lang="stylus">
html
	font-size 14px

body
	margin 0
	padding 0
	overscroll-behavior none

.App
	padding 1em
	min-height 100vh
	height 100%

	&__number-wrapper
		display flex
		flex-direction column
		justify-content center
		align-items center
		padding 4em 0
		font-numeric()

		.number-input
			width 10em
</style>