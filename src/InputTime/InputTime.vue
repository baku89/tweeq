<script setup lang="ts">
import {useMagicKeys} from '@vueuse/core'
import {scalar} from 'linearly'
import {
	computed,
	ref,
	useTemplateRef,
	watch,
	watchEffect,
	watchSyncEffect,
} from 'vue'

import {InputTextBase} from '../InputTextBase'
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
// Display

const digits = computed(() => {
	if (context.format === 'frames') {
		return null
	}
	return display.value.split(':').reverse()
})

//------------------------------------------------------------------------------
// Tweak

const $input = useTemplateRef('$input')
const $digits = useTemplateRef('$digits')

const {
	q: doQuantize,
	shift: increaseTweakScale,
	alt: decreaseTweakScale,
} = useMagicKeys()

const tweakScaleByHover = ref<number>(0)
const tweakScaleOffset = computed(() => {
	if (increaseTweakScale.value) return 1
	if (decreaseTweakScale.value) return -1
	return 0
})
const tweakScale = computed(() => {
	return scalar.clamp(tweakScaleByHover.value + tweakScaleOffset.value, 0, 3)
})

const tweakSpeed = computed(() => {
	const scale = tweakScale.value
	const fps = props.frameRate

	if (scale <= 0) return 1 / 4 // frames
	if (scale === 1) return fps / 10 // seconds
	if (scale === 2) return (fps * 60) / 100 // minutes
	return (fps * 60 * 60) / 100 // hours
})

const tweakQuantizeParams = computed<[step: number, offset: number]>(() => {
	const scale = tweakScale.value
	const fps = props.frameRate

	if (!doQuantize.value) return [1, 0]

	if (scale === 0) return [1, 0]
	if (scale === 1) return [fps, model.value % fps]
	if (scale === 2) return [fps * 60, model.value % (fps * 60)]
	return [fps * 60 * 60, model.value % (fps * 60 * 60)]
})

const tweakLocal = ref(0)

useDrag($digits, {
	lockPointer: true,
	onClick(_, e) {
		const target = e.target as HTMLElement
		if (!target.classList.contains('digit')) {
			$input.value!.select()
		} else {
			const digitsInOrder = digits.value!.toReversed()
			const len = digitsInOrder.length
			const i = len - tweakScale.value - 1
			const str = digitsInOrder.slice(0, i).join(':')

			const start = str.length === 0 ? 0 : str.length + 1
			const width = digitsInOrder[i].length

			$input.value!.select(start, start + width)
		}
	},
	onDragStart() {
		tweakLocal.value = model.value
	},
	onDrag({delta: [dx]}) {
		tweakLocal.value += dx * tweakSpeed.value
	},
})

watch(
	doQuantize,
	(curt, prev) => {
		if (!curt && prev) {
			tweakLocal.value = model.value
		}
	},
	{flush: 'sync'}
)

watchSyncEffect(() => {
	model.value = scalar.quantize(tweakLocal.value, ...tweakQuantizeParams.value)
})

watchSyncEffect(() => {
	if (focused.value) emit('focus')
	else emit('blur')
})
</script>

<template>
	<InputTextBase
		ref="$input"
		v-model:focused="focused"
		v-model="display"
		class="TqInputTime"
		:ignoreInput="!focused"
		font="numeric"
		align="center"
		@confirm="confirm"
		@pointerenter="tweakScaleByHover = 0"
		@pointerdown.middle="toggleTimeFormat"
	>
		<template #inactiveContent>
			<div ref="$digits" class="digits">
				<template v-if="digits">
					<template v-for="(digit, i) in digits" :key="i">
						<div
							class="digit"
							:class="{tweak: tweakScale === i}"
							@pointerenter="tweakScaleByHover = i"
						>
							{{ digit }}
						</div>
						<div v-if="i !== digits.length - 1" class="separator">:</div>
					</template>
				</template>
				<div v-else>
					{{ display }}
				</div>
			</div>
		</template>
	</InputTextBase>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.digits
	position absolute
	inset 0
	display flex
	align-items center
	justify-content center
	flex-direction row-reverse

.digit
	padding .1em .2em
	border-radius var(--tq-input-border-radius)

	.TqInputTime:hover &.tweak
		background set-alpha(--tq-color-text-subtle, .3)


.separator
	padding .1em 0
	font-weight bold
	color var(--tq-color-text-subtle)
</style>
