<script setup lang="ts">
import {
	computed,
	ref,
	useTemplateRef,
	watch,
	watchEffect,
	watchSyncEffect,
} from 'vue'

import {InputString} from '../InputString'
import {InputEmits} from '../types'
import {useDrag} from '../use/useDrag'
import {InputTimeProps, TimeFormat} from './types'
import {formatTimecode, parseTimecode, useInputTimeContext} from './utils'

const model = defineModel<number>({required: true})

const props = withDefaults(defineProps<InputTimeProps>(), {
	frameRate: 24,
	min: -Infinity,
	max: Infinity,
})

const emit = defineEmits<InputEmits>()

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
	() => [model.value, context.format, focused.value] as const,
	([model, format, focused]) => {
		if (focused) return
		display.value = print(model, format)
	},
	{immediate: true, flush: 'sync'}
)

const parseResult = computed(() => parse(display.value, props.frameRate))
const validLocal = ref<number>()

watchEffect(() => {
	if (parseResult.value !== null) {
		validLocal.value = parseResult.value
		if (focused.value) {
			model.value = validLocal.value
		}
	}
})

function confirm() {
	display.value = print(model.value, context.format)
	emit('confirm')
}

function toggleTimeFormat() {
	context.format = context.format === 'frames' ? 'timecode' : 'frames'
	display.value = print(model.value, context.format)
}

//------------------------------------------------------------------------------
// Tweak

const $input = useTemplateRef('$input')

useDrag($input, {
	onClick() {
		$input.value?.select()
	},
	onDragStart() {},
	onDrag({delta: [dx]}) {
		model.value += dx
	},
})

watchSyncEffect(() => {
	if (focused.value) emit('focus')
	else emit('blur')
})

function ignorePointerdownUnlessFocusing(event: PointerEvent) {
	if (!focused.value) {
		event.preventDefault()
	}
}
</script>

<template>
	<InputString
		ref="$input"
		class="TqInputTime"
		:modelValue="display"
		font="numeric"
		align="center"
		@update:modelValue="display = $event"
		@focus="focused = true"
		@blur="focused = false"
		@confirm="confirm"
		@click.middle="toggleTimeFormat"
		@pointerdown="ignorePointerdownUnlessFocusing"
	/>
</template>

<style lang="stylus" scoped>

.TqInputTime
	cursor: col-resize

	&:focus
		cursor inherit
</style>
