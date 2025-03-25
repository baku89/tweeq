<script lang="ts" setup>
import {useFocus} from '@vueuse/core'
import {computed, nextTick, ref, useTemplateRef, watch} from 'vue'

import {InputTextBase} from '../InputTextBase'
import {useMultiSelectStore} from '../stores/multiSelect'
import {InputEmits} from '../types'
import {useValidator} from '../use/useValidator'
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
const {validLocal, validateResult} = useValidator(local, props.validator)

const $input = useTemplateRef('$input')
const focusing = useFocus($input).focused

const expressionEnabled = ref(false)
const expressionError = ref<string | undefined>(undefined)

const invalid = computed(
	() =>
		props.invalid ||
		validateResult.value.log.length > 0 ||
		!!expressionError.value
)

watch(
	() => props.modelValue,
	value => {
		if (value !== validLocal.value) {
			local.value = value
		}
	},
	{flush: 'sync'}
)

watch(
	() => [local.value, focusing.value] as const,
	([local, focusing]) => {
		if (!focusing) {
			display.value = local
		}
	},
	{flush: 'sync'}
)

watch(
	validLocal,
	validLocal => {
		if (validLocal !== undefined && validLocal !== props.modelValue) {
			emit('update:modelValue', validLocal)
		}
	},
	{flush: 'sync'}
)

function onFocus(e: FocusEvent) {
	multi.capture()
	emit('focus', e)
}

function onKeyDown(e: KeyboardEvent) {
	if (e.metaKey && e.key === '=') {
		e.preventDefault()
		enableExpression()
	}
}

let localAtFocus = ''

function enableExpression() {
	expressionEnabled.value = true
	display.value = `"${local.value}"`
	localAtFocus = local.value
}

function onInput(e: Event) {
	const newValue = (e.target as HTMLInputElement).value
	display.value = newValue

	if (expressionEnabled.value) {
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
			local.value = fn(localAtFocus, {i: multi.index})
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
	emit('confirm')
	multi.capture()
	multi.confirm()

	expressionEnabled.value = false
	expressionError.value = undefined

	nextTick(() => {
		display.value = local.value = props.modelValue
	})
}

function onBlur() {
	confirm()
	emit('blur')
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

	if (expressionEnabled.value) return 'monospace'

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
	<InputTextBase
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
