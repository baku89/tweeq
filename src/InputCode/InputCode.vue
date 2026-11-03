<script setup lang="ts">
import type {editor} from 'monaco-editor'
import {computed, ref} from 'vue'

import {MonacoEditor} from '../MonacoEditor'
import type {InputCodeProps} from './types'

const LINE_HEIGHT = 18

const props = defineProps<InputCodeProps>()

const emit = defineEmits<{
	'update:modelValue': [string]
	mount: [editor: editor.IStandaloneCodeEditor]
}>()

const contentHeight = ref(LINE_HEIGHT)

const options = computed<editor.IStandaloneEditorConstructionOptions>(() => ({
	automaticLayout: true,
	lineHeight: LINE_HEIGHT,
	padding: {top: 0, bottom: 0},
	scrollbar: {
		vertical: 'auto',
		horizontal: 'hidden',
		useShadows: false,
		verticalScrollbarSize: 2,
		alwaysConsumeMouseWheel: false,
	},
	...props.options,
}))

function onMount(editor: editor.IStandaloneCodeEditor) {
	contentHeight.value = editor.getContentHeight()
	editor.onDidContentSizeChange(e => {
		contentHeight.value = e.contentHeight
	})
	emit('mount', editor)
}
</script>

<template>
	<!-- It fits what is in it, from one line, like the other inputs. -->
	<div
		class="TqInputCode"
		:style="{
			'--line-height': `${LINE_HEIGHT}px`,
			height: `calc(${contentHeight}px + var(--tq-input-height) - ${LINE_HEIGHT}px)`,
		}"
	>
		<MonacoEditor
			class="monaco-editor"
			:modelValue="modelValue"
			:lang="lang"
			:options="options"
			@update:modelValue="$emit('update:modelValue', $event)"
			@mount="onMount"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputCode
	position relative
	border-radius var(--tq-radius-input)
	overflow hidden
	min-height var(--tq-input-height)
	max-height 40vh
	// Fill the host width (Monaco scrolls long lines itself) rather than forcing a
	// fixed minimum that overflows a constrained host like a modal tab.
	min-width 0
	background var(--tq-color-input)

	&:focus-within
		box-shadow 0 0 0 1px var(--tq-color-accent)

.monaco-editor
	position absolute !important
	inset calc((var(--tq-input-height) - var(--line-height)) / 2) .5em
	width auto !important
	height auto !important
</style>
