<script setup lang="ts">
import {Path} from '@baku89/pave'
import {useMagicKeys} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {range} from 'lodash-es'
import {
	computed,
	nextTick,
	ref,
	useTemplateRef,
	watch,
	watchSyncEffect,
} from 'vue'

import {InputTextBase} from '../InputTextBase'
import {useMultiSelectStore} from '../stores/multiSelect'
import {Tooltip} from '../Tooltip'
import {InputEmits} from '../types'
import {useDrag} from '../use/useDrag'
import {ValidateResult} from '../validator'
import {InputTimeProps, TimeFormat} from './types'
import {
	formatTimecode,
	replaceTimecodeWithFrames,
	useInputTimeContext,
} from './utils'

const model = defineModel<number>({required: true})

const props = withDefaults(defineProps<InputTimeProps>(), {
	frameRate: 24,
	min: -Infinity,
	max: Infinity,
})

const emit = defineEmits<InputEmits>()

const context = useInputTimeContext()

const focused = ref(false)

const $input = useTemplateRef('$input')

//------------------------------------------------------------------------------
// Tweak

const {
	q: doSnap,
	shift: increaseTweakScale,
	alt: decreaseTweakScale,
	h: forceHourTweak,
	m: forceMinuteTweak,
	s: forceSecondTweak,
	t: forceFrameTweak,
} = useMagicKeys()

const tweakScaleByHover = ref<number>(0)
const tweakScaleOffset = computed(() => {
	if (increaseTweakScale.value) return 1
	if (decreaseTweakScale.value) return -1
	return 0
})
const tweakScale = computed(() => {
	if (forceFrameTweak.value) return 0
	if (forceSecondTweak.value) return 1
	if (forceMinuteTweak.value) return 2
	if (forceHourTweak.value) return 3

	return scalar.clamp(tweakScaleByHover.value + tweakScaleOffset.value, 0, 3)
})

const tweakSpeed = computed(() => {
	const scale = tweakScale.value
	const fps = props.frameRate

	if (scale <= 0) return 1 / 4 // frames
	if (scale === 1) return fps / 10 // seconds
	if (scale === 2) return (fps * 60) / 10 // minutes
	return (fps * 60 * 60) / 100 // hours
})

const tweakSnapParams = computed<[step: number, offset: number]>(() => {
	const scale = tweakScale.value
	const fps = props.frameRate

	if (!doSnap.value) return [1, 0]

	if (scale === 0) return [1, 0]
	if (scale === 1) return [fps, model.value % fps]
	if (scale === 2) return [fps * 60, model.value % (fps * 60)]
	return [fps * 60 * 60, model.value % (fps * 60 * 60)]
})

const tweakLocal = ref(0)
let tweakAccumlated = 0

const {dragging: tweaking} = useDrag($input, {
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
		tweakAccumlated = 0
		multi.capture()
		emit('focus')
	},
	onDrag({delta: [dx]}) {
		tweakLocal.value = scalar.clamp(
			tweakLocal.value + dx * tweakSpeed.value,
			props.min,
			props.max
		)
		tweakAccumlated += dx
		multi.update(x => x + tweakAccumlated)
	},
	onDragEnd() {
		emit('confirm')
		multi.confirm()
		emit('blur')
	},
})

watch(
	doSnap,
	(curt, prev) => {
		if (!curt && prev) {
			tweakLocal.value = model.value
		}
	},
	{flush: 'sync'}
)

watchSyncEffect(() => {
	const value = scalar.clamp(
		scalar.quantize(tweakLocal.value, ...tweakSnapParams.value),
		props.min,
		props.max
	)

	if (tweaking.value) {
		model.value = value
	}
})

//------------------------------------------------------------------------------
// Multi Select

const multi = useMultiSelectStore().register({
	type: 'number',
	el: $input,
	focusing: computed(() => focused.value || tweaking.value),
	getValue: () => model.value,
	setValue(value) {
		model.value = scalar.clamp(value, props.min, props.max)
	},
	confirm() {
		emit('confirm')
	},
})

//------------------------------------------------------------------------------
// State management

function print(model: number, format: TimeFormat) {
	if (format === 'frames') {
		return model + 'F'
	}

	return formatTimecode(model, props.frameRate)
}

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

let localAtFocus = 0

type Parser = (
	x: number,
	context: {i: number; fps: number}
) => ValidateResult<number>

const parse = computed<Parser>(() => {
	const code = replaceTimecodeWithFrames(display.value, props.frameRate)

	try {
		const fn = eval(`(x, {i, fps}) => {
			try {
				const value = (${code})
				if (typeof value === 'number') {
					return {value, log: []}
				} else {
					return {value, log: ['Value is not a number']}
				}
			} catch (e) {
				return {log: [e.message]}
			}
		}`)
		return fn
	} catch (e) {
		return () => ({value: undefined, log: [(e as Error).message]})
	}
})

const parseResult = computed(() =>
	parse.value(localAtFocus, {i: multi.index, fps: props.frameRate})
)

const validLocal = ref<number>()

watchSyncEffect(() => {
	if (parseResult.value.value === undefined) return

	validLocal.value = parseResult.value.value

	if (focused.value) {
		model.value = validLocal.value
	}
})

watchSyncEffect(() => {
	if (focused.value) {
		localAtFocus = model.value
		emit('focus')
	} else {
		emit('blur')
	}
})

watchSyncEffect(() => {
	const _parse = parse.value
	if (!tweaking.value && !focused.value) return

	multi.update((x, ctx) => {
		const result = _parse(x, {...ctx, fps: props.frameRate})
		return result.value === undefined ? x : result.value
	})
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
// Overlay

function radialLine(t: number, innerRadius: number, outerRadius: number) {
	const deg = t * 360 - 90
	return Path.line(
		vec2.dir(deg, innerRadius, [50, 50]),
		vec2.dir(deg, outerRadius, [50, 50])
	)
}

const meters = computed(() => {
	const scale = tweakScale.value
	const fps = props.frameRate

	let angles
	if (scale === 0) {
		angles = range(0, 1, 1 / fps)
	} else {
		angles = range(0, 1, 1 / 12)
	}

	const lines = angles.map(a => radialLine(a, 48, 49))

	return Path.toD(Path.merge(lines))
})

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
		:active="multi.subfocus"
		font="numeric"
		leftIcon="mdi-clock"
		align="center"
		@confirm="confirm"
		@pointerenter="tweakScaleByHover = 0"
		@click.right.stop.prevent="toggleTimeFormat"
		@keydown.exact.up.prevent="increment(frameRate)"
		@keydown.exact.down.prevent="increment(-frameRate)"
		@keydown.exact.alt.up.prevent="increment(1)"
		@keydown.exact.alt.down.prevent="increment(-1)"
		@keydown.exact.shift.up.prevent="increment(60 * frameRate)"
		@keydown.exact.shift.down.prevent="increment(-60 * frameRate)"
	>
		<template #inactiveContent>
			<div class="digits">
				<template v-if="digits">
					<template v-for="(digit, i) in digits" :key="i">
						<div
							class="digit"
							:class="{tweak: tweakScale === i}"
							@pointerenter="tweakScaleByHover = i"
						>
							{{ digit }}
							<Tooltip v-if="tweakScale === i" class="digit-label">
								<label>{{ getDigitLabel(i) }}</label>
							</Tooltip>
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
						<path :d="meters" class="meters" />
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
	border-radius var(--tq-radius-input)

	.TqInputTime:hover &.tweak
		background set-alpha(--tq-color-text-subtle, .3)

.digit-label
	position absolute
	z-index 1
	bottom calc(100% + .6em)
	left 50%
	transform translate(-50%, 0)
	display none

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
