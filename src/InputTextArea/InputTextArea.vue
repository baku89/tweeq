<script lang="ts" setup>
import {useTemplateRef} from 'vue'

import type {InputFont, InputProps} from '../types'

interface InputTextAreaProps extends InputProps {
	font?: InputFont
	/** Shown while the input is empty. */
	placeholder?: string
}

defineOptions({inheritAttrs: false})

defineProps<InputTextAreaProps>()

const model = defineModel<string>({required: true})

const $input = useTemplateRef('$input')

defineExpose({
	focus: () => $input.value?.focus(),
	select: () => $input.value?.select(),
	blur: () => $input.value?.blur(),
})
</script>

<template>
	<!-- It grows with what is in it, one line of an input's height at least. -->
	<textarea
		ref="$input"
		v-bind="$attrs"
		class="TqInputTextArea"
		:class="{invalid}"
		:font="font"
		:value="model"
		:placeholder="placeholder"
		:disabled="disabled || undefined"
		rows="1"
		autocapitalize="off"
		autocomplete="off"
		spellcheck="false"
		@input="model = ($event.target as HTMLTextAreaElement).value"
	/>
</template>

<style scoped>
.TqInputTextArea {
	display: block;
	width: 100%;
	min-height: var(--tq-input-height);
	max-height: 40vh;
	padding: calc((var(--tq-input-height) - 1lh) / 2) 0.5em;
	field-sizing: content;
	resize: none;
	border-radius: var(--tq-radius-input);
	background: var(--tq-color-input);
	color: var(--tq-color-text);
	transition: background var(--tq-hover-transition-duration);
}
.TqInputTextArea::placeholder {
	color: var(--tq-color-text-mute);
}
.TqInputTextArea:hover {
	background: var(--tq-color-input-hover);
}
.TqInputTextArea:focus {
	outline: none;
	box-shadow: 0 0 0 1px var(--tq-color-accent);
}
.TqInputTextArea:disabled {
	background: transparent;
	color: var(--tq-color-text-mute);
	box-shadow: inset 0 0 0 1px var(--tq-color-border);
}
.TqInputTextArea.invalid {
	color: var(--tq-color-error);
}
.TqInputTextArea[font='monospace'] {
	font-family: var(--tq-font-code);
}
</style>
