<template lang="pug">
GlispUI.App
	h1 Glisp UI
	p Glisp UI is a components library that bundles various types of UI for building professional design tool. Originally developed for Glisp.
	SchemeViewer
	InputNumber(:modelValue='200')
</template>

<script lang="ts">
import {defineComponent} from 'vue'

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
})
</script>

<style lang="stylus">
html
	font-size 16px

body
	margin 0
	padding 0
	overscroll-behavior none

.App
	padding 1em
	height 100vh
</style>