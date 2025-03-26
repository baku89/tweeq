<script setup lang="ts">
import {Path} from '@baku89/pave'
import {useMagicKeys} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {
	computed,
	nextTick,
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

watchSyncEffect(() => {
	if (focused.value) emit('focus')
	else emit('blur')
})

function confirm() {
	emit('confirm')
	nextTick(() => {
		display.value = print(model.value, context.format)
	})
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

function getDigitLabel(i: number) {
	if (i === 0) return 'F'
	if (i === 1) return 'Secs'
	if (i === 2) return 'Mins'
	return 'Hrs'
}

//------------------------------------------------------------------------------
// Hotkeys

function increment(inc: number) {
	model.value = scalar.clamp(model.value + inc, props.min, props.max)
	confirm()
}

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

const {dragging: tweaking} = useDrag($digits, {
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
		tweakLocal.value = scalar.clamp(
			tweakLocal.value + dx * tweakSpeed.value,
			props.min,
			props.max
		)
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
	const value = scalar.clamp(
		scalar.quantize(tweakLocal.value, ...tweakQuantizeParams.value),
		props.min,
		props.max
	)

	if (tweaking.value) {
		model.value = value
	}
})

//------------------------------------------------------------------------------
// Overlay

function radialLine(t: number, innerRadius: number, outerRadius: number) {
	const deg = t * 360 - 90
	return Path.line(
		vec2.dir(deg, innerRadius, [50, 50]),
		vec2.dir(deg, outerRadius, [50, 50])
	)
}

const frameTick = computed(() => {
	const f = model.value % props.frameRate
	return Path.toD(radialLine(f / props.frameRate, 48, 48))
})

const secondTick = computed(() => {
	const s = Math.floor(model.value / props.frameRate) % 60
	return Path.toD(radialLine(s / 60, -15, 45))
})

const minuteTick = computed(() => {
	const m = Math.floor(model.value / (props.frameRate * 60)) % 60
	return Path.toD(radialLine(m / 60, 0, 40))
})

const hourTick = computed(() => {
	const h = Math.floor(model.value / (props.frameRate * 60 * 60)) % 24

	if (h === 0) return Path.toD(Path.empty)

	return Path.toD(radialLine(h / 12, 0, 20))
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
		@keydown.exact.up.prevent="increment(frameRate)"
		@keydown.exact.down.prevent="increment(-frameRate)"
		@keydown.exact.alt.up.prevent="increment(1)"
		@keydown.exact.alt.down.prevent="increment(-1)"
		@keydown.exact.shift.up.prevent="increment(60 * frameRate)"
		@keydown.exact.shift.down.prevent="increment(-60 * frameRate)"
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
							<div v-if="tweakScale === i" class="digit-label">
								{{ getDigitLabel(i) }}
							</div>
						</div>
						<div v-if="i !== digits.length - 1" class="separator">:</div>
					</template>
				</template>
				<div v-else>
					{{ display }}
				</div>
			</div>
		</template>
		<template #front>
			<Transition>
				<div v-if="tweaking" class="overlay">
					<svg class="overlay-svg" viewBox="0 0 100 100">
						<!-- <circle cx="50" cy="50" r="50" class="bold gray" /> -->
						<path :d="frameTick" class="frame" :tweaking="tweakScale === 0" />
						<path :d="secondTick" class="second" :tweaking="tweakScale === 1" />
						<path :d="minuteTick" class="minute" :tweaking="tweakScale === 2" />
						<path :d="hourTick" class="hour" :tweaking="tweakScale === 3" />
					</svg>
				</div>
			</Transition>
		</template>
	</InputTextBase>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputTime
	position relative
	overflow visible

.digits
	z-index 100
	position absolute
	inset 0
	display flex
	align-items center
	justify-content center
	flex-direction row-reverse

.digit
	position relative
	padding .1em .2em
	border-radius var(--tq-input-border-radius)

	.TqInputTime:hover &.tweak
		background set-alpha(--tq-color-text-subtle, .3)

.digit-label
	position absolute
	z-index 1
	bottom calc(100% + .6em)
	left 50%
	transform translate(-50%, 0)
	tooltip-style()
	background white
	display none
	color var(--tq-color-text-mute)

	.TqInputTime:hover &
		display block

.separator
	padding .1em 0
	font-weight bold
	color var(--tq-color-text-mute)

$size = 360px

.overlay
	input-overlay()
	z-index 0
	position absolute
	pointer-events none
	top 50%
	left 50%
	hover-transition(scale, opacity)
	width $size
	height $size
	translate -50% -50%
	mask radial-gradient(closest-side, transparent 0%, black 50%)


	&.v-enter-from,
	&.v-leave-to
		opacity 0
		scale .5


.overlay-svg
	overflow visible
	width $size !important
	height $size !important

	path, circle
		stroke var(--tq-color-text-subtle)
		vector-effect non-scaling-stroke

	.frame
		stroke-width 10
		stroke var(--tq-color-border)

	.second
		stroke-width 1

	.minute
		stroke-width 3

	.hour
		stroke-width 5

	[tweaking=true]
		stroke var(--tq-color-accent)
</style>
