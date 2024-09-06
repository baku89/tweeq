<script lang="ts" setup>
import {Icon} from '@iconify/vue'
import {
	useElementBounding,
	useEventListener,
	useFocus,
	useKeyModifier,
	whenever,
} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {computed, nextTick, ref, shallowRef, StyleValue, watch} from 'vue'

import {useDrag} from '../useDrag'
import {
	getNumberPresition,
	precisionOf,
	toFixed,
	toPercent,
	unsignedMod,
} from '../util'
import InputNumberScales from './InputNumberScales.vue'
import {type Props} from './types'

const props = withDefaults(defineProps<Props>(), {
	min: Number.MIN_SAFE_INTEGER,
	max: Number.MAX_SAFE_INTEGER,
	bar: 0,
	clampMin: true,
	clampMax: true,
	precision: 4,
	prefix: '',
	suffix: '',
})

defineOptions({
	inheritAttrs: false,
})

const emit = defineEmits<{
	'update:modelValue': [value: number]
	focus: []
	input: [Event]
	blur: []
}>()

const $root = shallowRef<HTMLElement | null>(null)
const $input = shallowRef<HTMLInputElement | null>(null)
const {left, top, width, height, right} = useElementBounding($root)

const focusing = useFocus($input).focused

const local = ref(props.modelValue)
const display = ref('')

const barVisible = computed(() => {
	return (
		props.bar !== false &&
		props.min !== Number.MIN_SAFE_INTEGER &&
		props.max !== Number.MAX_SAFE_INTEGER
	)
})

const validMin = computed(() =>
	props.clampMin ? props.min : Number.MIN_SAFE_INTEGER
)
const validMax = computed(() =>
	props.clampMax ? props.max : Number.MAX_SAFE_INTEGER
)

const alt = useKeyModifier('Alt')
const shift = useKeyModifier('Shift')
const speedMultiplierKey = computed(() => {
	return (alt.value ? 0.1 : 1) * (shift.value ? 10 : 1)
})
const speedMultiplierGesture = ref(1)
const speed = computed(() => {
	const key = speedMultiplierKey.value
	const gesture = speedMultiplierGesture.value
	const gestureQuantized =
		gesture > 1
			? Math.round(gesture)
			: scalar.quantize(gesture, 10 ** Math.floor(Math.log10(gesture)))

	return key * gestureQuantized
})

// Precision
const displayPrecision = ref(0)

const sliderPrecision = computed(() => {
	if (
		props.min !== Number.MIN_SAFE_INTEGER &&
		props.max !== Number.MAX_SAFE_INTEGER &&
		width.value > 0
	) {
		const stepPerPx = Math.abs(props.max - props.min) / width.value
		return precisionOf(stepPerPx)
	} else {
		return 0
	}
})

const tweakPrecision = computed(() => precisionOf(speed.value))

const precision = computed(() => {
	const precisionByStep = precisionOf(props.step ?? 0)
	if (isFinite(precisionByStep)) {
		return precisionByStep
	} else {
		return Math.max(
			displayPrecision.value,
			sliderPrecision.value,
			tweakPrecision.value
		)
	}
})

const pointerSize = ref(0)

let resetTweakModeTimer: ReturnType<typeof setTimeout>

/** When the value is vec2, it means the origin point to determine the drag mode */
const tweakMode = ref<vec2 | 'value' | 'speed'>(vec2.zero)

const pxPerStep = computed(() => {
	if (
		props.max === undefined ||
		props.min === undefined ||
		props.step === undefined ||
		width.value === 0
	) {
		return 0
	}

	const gap = (props.step / (props.max - props.min)) * width.value

	return gap
})

const minSpeed = computed(() => {
	if (pxPerStep.value > 1) {
		return 1
	} else {
		const prec =
			props.step !== undefined ? precisionOf(props.step) : props.precision
		return 10 ** -prec
	}
})

const maxSpeed = computed(() => {
	return barVisible.value ? 1 : 1000
})

const {dragging: tweaking} = useDrag($root, {
	lockPointer: computed(() => !barVisible.value),
	disabled: computed(() => props.disabled || focusing.value),
	onClick() {
		$input.value?.focus()
	},
	onDragStart(state, event) {
		const isTipDragged = (event.target as Element).classList.contains('tip')
		const insideRange =
			props.min <= props.modelValue && props.modelValue <= props.max

		if (barVisible.value && insideRange && !isTipDragged) {
			// Absolute Mode
			local.value = scalar.fit(
				state.xy[0],
				left.value,
				right.value,
				props.min,
				props.max
			)
		}

		tweakMode.value = state.xy
		speedMultiplierGesture.value = 1
		displayPrecision.value = getNumberPresition(display.value)
	},
	onDrag(state, event) {
		const [dx, dy] = state.delta

		const isMouse = event.pointerType === 'mouse' || event.pointerType === 'pen'

		pointerSize.value =
			event.width *
			0.75 *
			scalar.smoothstep(
				(event.width * 0.7) / 2,
				(event.width * 0.5) / 2,
				Math.abs(state.xy[1] - (top.value + height.value / 2))
			)

		if (typeof tweakMode.value !== 'string') {
			const doDetectMode = isMouse && minSpeed.value !== maxSpeed.value

			if (doDetectMode) {
				const [ox, oy] = vec2.sub(tweakMode.value, state.xy)

				if (Math.abs(ox) >= 2) {
					tweakMode.value = 'value'
				} else if (Math.abs(oy) >= 4) {
					tweakMode.value = 'speed'
				}
			} else {
				tweakMode.value = 'value'
			}
		}

		if (tweakMode.value === 'value') {
			const baseSpeed = barVisible.value
				? (props.max - props.min) / width.value
				: 1

			local.value += dx * baseSpeed * speed.value

			if (!barVisible.value) {
				local.value = scalar.clamp(local.value, validMin.value, validMax.value)
			}
		} else if (tweakMode.value === 'speed') {
			speedMultiplierGesture.value = scalar.clamp(
				speedMultiplierGesture.value * 0.98 ** dy,
				minSpeed.value,
				maxSpeed.value
			)
		}

		if (isMouse) {
			clearTimeout(resetTweakModeTimer)
			resetTweakModeTimer = setTimeout(() => {
				tweakMode.value = state.xy
			}, 200)
		}
	},
	onDragEnd() {
		displayPrecision.value = 0
	},
})

//------------------------------------------------------------------------------
// Emit update:modelValue when the local value is changed

const validatedLocal = computed(() => {
	let value = local.value
	if (props.step) {
		value = scalar.quantize(value, props.step)
	}
	value = scalar.clamp(value, validMin.value, validMax.value)

	return value
})

const isInvalid = computed(() => {
	if (props.invalid) return true

	if (tweaking.value) return false

	// TODO: This is not accurate
	return Math.abs(validatedLocal.value - local.value) > 10e-8
})

watch(validatedLocal, local => {
	if (local !== props.modelValue) {
		emit('update:modelValue', local)
	}
})

//------------------------------------------------------------------------------
// Input Events

function onInput(e: Event) {
	const el = e.target as HTMLInputElement

	const newValue = parseFloat(el.value)
	if (!isNaN(newValue)) {
		local.value = newValue
	}

	display.value = el.value

	emit('input', e)
}

//------------------------------------------------------------------------------
// Hotkeys

function onIncrementByKey(delta: number) {
	if (props.step !== undefined) {
		// If step is defined
		local.value += props.step * delta * Math.max(1, speedMultiplierKey.value)
		local.value = scalar.clamp(local.value, validMin.value, validMax.value)
		display.value = toFixed(local.value, precisionOf(props.step))
	} else {
		let multiplier = speedMultiplierKey.value

		if (validMax.value - validMin.value <= 1) {
			multiplier *= 0.1
		}

		const prec = Math.max(
			getNumberPresition(display.value),
			precisionOf(multiplier)
		)

		local.value += delta * multiplier
		local.value = scalar.clamp(local.value, validMin.value, validMax.value)
		display.value = toFixed(local.value, prec)
	}
}

function onPressEnter(e: Event) {
	const el = e.target as HTMLInputElement

	let newValue = local.value
	if (props.step) {
		newValue = scalar.quantize(newValue, props.step)
	}
	newValue = scalar.clamp(newValue, validMin.value, validMax.value)

	emit('update:modelValue', newValue)

	el.blur()
	nextTick(() => el.focus())
}

//------------------------------------------------------------------------------
// For iPad. Swiping with second finger to change the drag speed

useEventListener('touchstart', (e: TouchEvent) => {
	if (!tweaking.value) return

	const secondTouch = e.touches.item(1)
	if (!secondTouch) return

	const ox = secondTouch.clientX
	const initialSpeedMultiplierGesture = speedMultiplierGesture.value

	const stop = watch(tweaking, () => {
		window.removeEventListener('touchmove', onSecondTouchMove)
		window.removeEventListener('touchend', onSecondTouchEnd)
		stop()
	})

	window.addEventListener('touchmove', onSecondTouchMove)
	window.addEventListener('touchend', onSecondTouchEnd)

	function onSecondTouchMove(e: TouchEvent) {
		const firstTouch = e.touches.item(0)
		const secondTouch = e.touches.item(1)
		if (!firstTouch || !secondTouch) return

		const cx = firstTouch.clientX
		const x = secondTouch.clientX

		tweakMode.value = 'speed'

		const mul = Math.abs((ox - cx) / (x - cx))
		speedMultiplierGesture.value = scalar.clamp(
			initialSpeedMultiplierGesture * mul,
			10 ** -props.precision,
			1000
		)
	}

	function onSecondTouchEnd() {
		if (!e.touches.item(1)) return

		tweakMode.value = 'value'

		window.removeEventListener('touchmove', onSecondTouchMove)
		window.removeEventListener('touchend', onSecondTouchEnd)
	}
})

//------------------------------------------------------------------------------
// Watchers

watch(
	() => [props.modelValue, focusing.value, tweaking.value] as const,
	([value, focusing, tweaking]) => {
		if (!focusing && !tweaking) {
			local.value = value
		}
	}
)

watch(
	() =>
		[
			props.modelValue,
			tweaking.value,
			focusing.value,
			precision.value,
			props.prefix,
			props.suffix,
		] as const,
	([modelValue, tweaking, focusing, precision, prefix, suffix]) => {
		if (focusing) return

		const displayNumber = tweaking
			? modelValue.toFixed(precision)
			: toFixed(modelValue, props.precision)

		display.value = prefix + displayNumber + suffix
	},
	{immediate: true}
)

// Emit events
watch(
	() => [focusing.value, tweaking.value] as const,
	([focusing, tweaking], [prevFocusing, prevTweaking]) => {
		const curt = focusing || tweaking
		const prev = prevFocusing || prevTweaking

		if (curt && !prev) {
			emit('focus')
		} else if (!curt && prev) {
			emit('blur')
		}
	}
)

// Click to select all
whenever(focusing, () => nextTick(() => $input.value?.select()))

//------------------------------------------------------------------------------
// Styles

const scaleAttrs = (offset: number) => {
	const precision = unsignedMod(
		-Math.log10(speedMultiplierGesture.value) + offset,
		3
	)
	const halfWidth = width.value / 2

	const opacity = scalar.smoothstep(1, 2, precision)

	const dashoffset = barVisible.value
		? scalar.invlerp(validMin.value, validMax.value, local.value) * width.value
		: halfWidth

	return {
		x1: -halfWidth,
		x2: halfWidth,
		style: {
			strokeDashoffset: -dashoffset,
			strokeDasharray: `0 ${Math.pow(10, precision)}`,
			opacity,
		},
	}
}

const tipStyle = computed<StyleValue>(() => {
	if (!barVisible.value) return {visibility: 'hidden'}

	const tValue = scalar.invlerp(props.min, props.max, props.modelValue)

	return {
		left: toPercent(tValue),
	}
})

const barStyle = computed<StyleValue>(() => {
	if (!barVisible.value || props.bar === false) {
		return {visibility: 'hidden'}
	}

	const origin = typeof props.bar === 'number' ? props.bar : 0
	const tOrigin = scalar.invlerp(props.min, props.max, origin)
	const tValue = scalar.invlerp(props.min, props.max, props.modelValue)

	const left = Math.min(tOrigin, tValue)
	const right = 1 - Math.max(tOrigin, tValue)

	return {
		left: toPercent(left),
		right: toPercent(right),
	}
})
</script>

<template>
	<div
		ref="$root"
		class="InputNumber"
		:class="{tweaking}"
		:data-tweaking-mode="tweakMode"
		:horizontal-position="horizontalPosition"
		:vertical-position="verticalPosition"
		:disabled="!!disabled"
		v-bind="$attrs"
	>
		<div class="bar" :style="barStyle" />
		<InputNumberScales :min="min" :max="max" :step="step" />
		<div class="tip" :style="tipStyle" />

		<input
			ref="$input"
			class="input"
			type="text"
			inputmode="numeric"
			pattern="d*"
			:value="display"
			:invalid="isInvalid"
			:disabled="disabled"
			@input="onInput"
			@keydown.up.prevent="onIncrementByKey(1)"
			@keydown.down.prevent="onIncrementByKey(-1)"
			@keydown.enter.prevent="onPressEnter"
		/>
		<Icon v-if="leftIcon" class="icon left" :icon="leftIcon" />
		<Icon v-if="rightIcon" class="icon right" :icon="rightIcon" />

		<svg v-if="tweakMode === 'speed'" class="overlay">
			<line class="scale" v-bind="scaleAttrs(0)"></line>
			<line class="scale" v-bind="scaleAttrs(1)"></line>
			<line class="scale" v-bind="scaleAttrs(2)"></line>
		</svg>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputNumber
	input-style()

.input
	text-align center
	position relative
	font-numeric()
	pointer-events none
	padding-left 0
	padding-right 0

	&:focus
		pointer-events auto

.bar, .tip
	position absolute
	height 100%

.bar
	pointer-events none
	background var(--tq-color-input-tinted-accent)
	hover-transition(background)

	.InputNumber:hover &
		background var(--tq-color-input-tinted-accent-hover)


.tip
	width 2px
	margin-left -1px
	background var(--tq-color-input-vivid-accent)
	hover-transition(opacity)

	&:before
		content ''
		position absolute
		display block
		height 100%
		left calc(var(--tq-input-height) / -2)
		right @left

	.tweaking &, &:hover
		background var(--tq-color-accent)

.icon
	width calc(var(--tq-input-height) - 4px)
	height calc(var(--tq-input-height) - 4px)
	color var(--tq-color-gray-on-background)
	opacity .7
	position absolute
	z-index 100
	top 2px
	pointer-events none

	&.left
		left 3px

	&.right
		right 3px

.overlay
	position absolute
	overflow visible
	pointer-events none
	top 50%
	left 50%

	.scale
		fill none
		stroke-width 4
		stroke-linecap round
		stroke var(--tq-color-accent)

	.pointer
		fill var(--tq-color-accent)

	.bar
		background var(--tq-color-input-tinted-accent-hover)

	.tip
		background var(--tq-color-accent)
</style>
