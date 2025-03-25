<script setup lang="ts">
import {computed, ref, watch, watchEffect} from 'vue'

import {InputString} from '../InputString'
import {InputEmits} from '../types'
import {InputTimeProps, TimeFormat} from './types'
import {formatTimecode, parseTimecode, useInputTimeContext} from './utils'

const props = withDefaults(defineProps<InputTimeProps>(), {
	frameRate: 24,
})

const emit = defineEmits<InputEmits<number>>()

const context = useInputTimeContext()

const focused = ref(false)

function print(model: number, format: TimeFormat) {
	if (format === 'frames') {
		return model + 'F'
	}

	return formatTimecode(model, props.frameRate)
}

const parse = parseTimecode

const display = ref('')

// Model -> Display
watch(
	() => [props.modelValue, context.format, focused.value] as const,
	([module, format, focused]) => {
		if (focused) return
		display.value = print(module, format)
	},
	{immediate: true, flush: 'sync'}
)

const parseResult = computed(() => parse(display.value, props.frameRate))
const validLocal = ref<number>()

watchEffect(() => {
	if (parseResult.value !== null) {
		validLocal.value = parseResult.value
		console.log('set validLocal', validLocal.value)
		if (focused.value) {
			emit('update:modelValue', validLocal.value)
		}
	}
})

function confirm() {
	if (!validLocal.value) return
	display.value = print(validLocal.value, context.format)
	emit('confirm')
}

watchEffect(() => {
	if (focused.value) emit('focus')
	else emit('blur')
})
</script>

<template>
	<InputString
		:modelValue="display"
		font="numeric"
		@update:modelValue="display = $event"
		@focus="focused = true"
		@blur="focused = false"
		@confirm="confirm"
	/>
</template>
