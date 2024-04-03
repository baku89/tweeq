<script setup lang="ts">
import MonacoEditor from '../MonacoEditor'
import {InputCodeProps} from './types'

defineProps<InputCodeProps>()

defineEmits<{
	'update:modelValue': [string]
}>()
</script>

<template>
	<div class="InputCode">
		<MonacoEditor
			class="monaco-editor"
			:modelValue="modelValue"
			:lang="lang"
			@update:modelValue="$emit('update:modelValue', $event)"
		/>
	</div>
</template>

<style lang="stylus" scoped>

.InputCode
	position relative
	background blue
	min-height calc(var(--tq-input-height) * 20)
	min-width 45em


.monaco-editor
	position absolute
	inset 0
</style>
