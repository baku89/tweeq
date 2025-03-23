<script lang="ts" setup>
import {useFocus} from '@vueuse/core'
import {computed, ref, useTemplateRef, watch} from 'vue'

import {useMultiSelectStore} from '../stores/multiSelect'
import {InputEmits} from '../types'
import * as V from '../validator'
import {type InputStringProps} from './types'

const props = withDefaults(defineProps<InputStringProps>(), {
	validator: () => V.identity,
})

const emit = defineEmits<
	Omit<InputEmits<string>, 'focus'> & {focus: [e: FocusEvent]}
>()

const local = ref(props.modelValue)
const display = ref(props.modelValue)
const validateResult = computed(() => props.validator(local.value))
const validLocal = ref(props.modelValue)

watch(
	validateResult,
	result => {
		if (result.value === undefined) return

		validLocal.value = result.value
		emit('update:modelValue', validLocal.value)
	},
	{flush: 'sync'}
)

const $input = useTemplateRef('$input')
const focusing = useFocus($input).focused

const enableExpression = ref(false)
const expressionError = ref<string | undefined>(undefined)

const invalid = computed(
	() =>
		props.invalid ||
		validateResult.value.log.length > 0 ||
		expressionError.value
)

watch(
	() => props.modelValue,
	value => {
		if (focusing.value) return

		local.value = display.value = value
	},
	{immediate: true, flush: 'sync'}
)

function onFocus(e: FocusEvent) {
	multi.capture()
	emit('focus', e)
}

function onKeyDown(e: KeyboardEvent) {
	if (e.metaKey && e.key === '=') {
		e.preventDefault()
		enableExpression.value = true
		display.value = `"${local.value}"`
	}
}

function onInput(e: Event) {
	const newValue = (e.target as HTMLInputElement).value
	display.value = newValue

	if (enableExpression.value) {
		try {
			const fn = eval(`(x, {i}) => {
				const result = (${newValue});
				if (typeof result === 'string') {
					return result
				} else if (typeof result === 'number') {
					return result.toString()
				}
				throw new Error('Value is not a string or number')
			}`)
			local.value = fn(local.value, {i: multi.index})
			expressionError.value = undefined
			multi.update(fn)
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error('[InputString] Error evaluating expression', e)
			expressionError.value = (e as Error).message
			multi.update(x => x)
		}
	} else {
		local.value = newValue
		multi.update(() => newValue)
	}
}

function confirm() {
	display.value = local.value = validLocal.value
	enableExpression.value = false
	expressionError.value = undefined

	emit('confirm')
	multi.confirm()
	multi.capture()
}

function onBlur() {
	confirm()
	emit('blur')
}

function forceFocus() {
	$input.value?.select()
}

defineExpose({
	select: () => {
		$input.value?.select()
	},
})

//------------------------------------------------------------------------------
// Styles

const font = computed(() => {
	if (props.font) return props.font

	if (enableExpression.value) return 'monospace'

	return undefined
})

//------------------------------------------------------------------------------
// Multi Select

const multi = useMultiSelectStore().register({
	type: 'string',
	el: $input,
	focusing,
	getValue: () => local.value,
	setValue(value) {
		local.value = value
	},
	confirm() {
		emit('confirm')
	},
})
</script>

<template>
	<input
		ref="$input"
		class="InputString"
		:class="{subfocus: multi.subfocus}"
		type="text"
		:value="display"
		:theme="theme"
		:font="font"
		:align="align"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="disabled || undefined"
		:invalid="invalid || undefined"
		@click.shift="forceFocus"
		@click.meta="forceFocus"
		@focus="onFocus"
		@blur="onBlur"
		@input="onInput"
		@keydown="onKeyDown"
		@keydown.enter="confirm"
	/>
</template>

<style lang="stylus">
@import '../common.styl'

.InputString
	input-box-style()
	input-element-style()

	&:focus, &.subfocus
		input-box-focus()

	&:disabled
		input-box-disabled()

	&[invalid]
		input-box-invalid()
</style>
