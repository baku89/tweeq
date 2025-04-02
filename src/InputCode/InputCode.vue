<script setup lang="ts">
import {MonacoEditor} from '../MonacoEditor'
import type {InputCodeProps} from './types'

defineProps<InputCodeProps>()

defineEmits<{
	'update:modelValue': [string]
}>()
</script>

<template>
	<div class="TqInputCode">
		<MonacoEditor
			class="monaco-editor"
			:modelValue="modelValue"
			:lang="lang"
			@update:modelValue="$emit('update:modelValue', $event)"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputCode
	position relative
	border-radius var(--tq-radius-input)
	overflow hidden
	min-height calc(var(--tq-input-height) * 20)
	min-width 45em
	background var(--tq-color-input)

.monaco-editor
	position absolute
	inset calc(var(--tq-input-height) * .25)
</style>
