<script lang="ts" setup>
import {
	useElementBounding,
	useEventListener,
	useFocus,
	useMagicKeys,
	whenever,
} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {
	computed,
	nextTick,
	ref,
	type StyleValue,
	unref,
	useTemplateRef,
	watch,
	watchSyncEffect,
} from 'vue'

import {Icon} from '../Icon'
import {useMultiSelectStore} from '../stores/multiSelect'
import {InputEmits} from '../types'
import {useValidator} from '../use/useValidator'
import {useDrag} from '../useDrag'
import {
	getNumberPresition,
	precisionOf,
	toFixed,
	toPercent,
	unsignedMod,
} from '../util'
import * as V from '../validator'
import InputNumberScales from './InputNumberScales.vue'
import {type InputNumberProps} from './types'

const props = withDefaults(defineProps<InputNumberProps>(), {
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

const emit = defineEmits<InputEmits<number>>()

const $root = useTemplateRef('$root')
const $input = useTemplateRef('$input')
const {left, top, width, height, right} = useElementBounding($root)

const focusing = useFocus($input).focused
const enableExpression = ref(false)
const expressionError = ref<string | undefined>(undefined)

const local = ref(props.modelValue)
const display = ref('')

const barVisible = computed(() => {
	return (
		props.bar !== false &&
		props.min !== Number.MIN_SAFE_INTEGER &&
		props.max !== Number.MAX_SAFE_INTEGER &&
		width.value > 0
	)
})

const validMin = computed(() =>
	props.clampMin ? props.min : Number.MIN_SAFE_INTEGER
)
const validMax = computed(() =>
	props.clampMax ? props.max : Number.MAX_SAFE_INTEGER
)

const {alt, shift} = useMagicKeys()
const speedMultiplierKey = computed(() => {
	return (alt.value ? 0.1 : 1) * (shift.value ? 10 : 1)
})
const speedMultiplierGesture = ref(1)
const speed = computed(() => {
	return speedMultiplierKey.value * speedMultiplierGesture.value
})

// Precision
const stepPrecision = computed(() => {
	return props.step ? precisionOf(props.step) : null
})

const displayPrecision = computed(() => {
	return getNumberPresition(display.value)
})

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

const tweakPrecision = computed(() =>
	tweaking.value ? precisionOf(speed.value) : 0
)

const precision = computed(() => {
	return (
		stepPrecision.value ??
		Math.max(
			props.precision,
			displayPrecision.value,
			sliderPrecision.value,
			tweakPrecision.value
		)
	)
})

const pointerSize = ref(0)

let resetTweakModeTimer: ReturnType<typeof setTimeout>

/** When the value is vec2, it means the origin point to determine the drag mode */
const tweakMode = ref<vec2 | 'value' | 'speed'>(vec2.zero)

const minSpeed = computed(() => {
	let prec = props.precision

	if (props.step && barVisible.value) {
		const stepCount = (props.max - props.min) / props.step
		const pxPerStep = width.value / stepCount

		prec = precisionOf(pxPerStep)
	}

	return 10 ** -prec
})

const maxSpeed = computed(() => {
	return barVisible.value ? 1 : 1000
})

let deltaAccumulated = 0

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

			multi.update(() => local.value)
		}

		deltaAccumulated = 0
		tweakMode.value = state.xy
		speedMultiplierGesture.value = 1

		emit('focus')
		multi.capture()
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

			const delta = dx * baseSpeed * speed.value

			local.value += delta
			deltaAccumulated += delta
			multi.update(v => v + deltaAccumulated)
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
		confirm()
		emit('blur')
	},
})

//------------------------------------------------------------------------------
// Emit update:modelValue when the local value is changed

const validate = computed(() =>
	V.compose(
		V.clamp(validMin.value, validMax.value),
		V.quantize(props.step ?? 0)
	)
)

const {validateResult, validLocal} = useValidator(local, validate)

watchSyncEffect(() => {
	if (validLocal.value !== undefined && validLocal.value !== props.modelValue) {
		emit('update:modelValue', validLocal.value)
	}
})

const invalid = computed(() => {
	if (props.invalid) return true
	if (tweaking.value) return false

	return validateResult.value.log.length > 0 || expressionError.value
})

function confirm() {
	if (validLocal.value === undefined) return

	local.value = validLocal.value
	display.value = toFixed(local.value, precision.value)
	enableExpression.value = false
	expressionError.value = undefined

	emit('confirm')
	multi.confirm()
}

//------------------------------------------------------------------------------
// Input Events

function onFocus() {
	multi.capture()
	emit('focus')
}

function onInput(e: Event) {
	const value = (e.target as HTMLInputElement).value
	display.value = value

	if (!/^[0-9.]*$/.test(value)) {
		enableExpression.value = true
	}

	try {
		const fn = eval(`(x, {i}) => {
			const result = (${value})
			if (typeof result === 'number') {
				return result
			}
			throw new Error('Value is not a number')
		}`)
		local.value = fn(local.value, {i: multi.index})
		multi.update(fn)
	} catch (e) {
		expressionError.value = (e as Error).message
	}
}

function onBlur() {
	confirm()
	emit('blur')
}

//------------------------------------------------------------------------------
// Hotkeys

function onIncrementByKey(delta: number) {
	if (props.step) {
		// If step is defined
		local.value += props.step * delta * Math.max(1, speedMultiplierKey.value)
	} else {
		let multiplier = speedMultiplierKey.value

		if (validMax.value - validMin.value <= 1) {
			multiplier *= 0.1
		}

		local.value += delta * multiplier
		local.value = scalar.clamp(local.value, validMin.value, validMax.value)
	}
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

// When the model value is changed from outside, update the local value
watch(
	() => props.modelValue,
	value => {
		if (value !== validLocal.value) {
			local.value = value
		}
	},
	{immediate: true, flush: 'sync'}
)
// When the model value is changed from outside while the input is not focused,
// update the display value properly
watch(
	() =>
		[
			props.modelValue,
			tweaking.value,
			focusing.value,
			precision.value,
		] as const,
	([model, tweaking, focusing, precision]) => {
		if (focusing) return

		display.value = tweaking
			? model.toFixed(precision)
			: toFixed(model, precision)
	},
	{immediate: true, flush: 'sync'}
)

// Click to select all
whenever(focusing, () => nextTick(() => $input.value?.select()))

//------------------------------------------------------------------------------
// Multi Select

const multi = useMultiSelectStore().register({
	type: 'number',
	el: $root,
	focusing: computed(() => focusing.value || tweaking.value),
	getValue: () => local.value,
	setValue(value) {
		const result = unref(validate)(value)
		if (result.value === undefined) return false

		local.value = result.value
	},
	confirm() {
		emit('confirm')
	},
})

//------------------------------------------------------------------------------
// Styles

const valueRangeStateClasses = computed(() => {
	if (!barVisible.value) return {}

	if (props.modelValue < props.min) return {'below-range': true}
	if (props.modelValue > props.max) return {'above-range': true}
	return {}
})

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
		:class="{...valueRangeStateClasses, tweaking}"
		:data-tweaking-mode="tweakMode"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		v-bind="$attrs"
	>
		<div class="bar" :style="barStyle" />
		<InputNumberScales :min="min" :max="max" :step="step" />
		<div class="tip" :style="tipStyle" />

		<input
			ref="$input"
			class="input"
			:class="{focus: tweaking || multi.subfocus}"
			type="text"
			inputmode="numeric"
			pattern="d*"
			:value="focusing ? display : prefix + display + suffix"
			:font="enableExpression ? 'monospace' : undefined"
			:invalid="invalid || undefined"
			:disabled="disabled || undefined"
			@input="onInput"
			@focus="onFocus"
			@blur="onBlur"
			@keydown.up.prevent="onIncrementByKey(1)"
			@keydown.down.prevent="onIncrementByKey(-1)"
			@keydown.enter.prevent="confirm"
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
	input-box-style()

	$arrow-size = 4px

	&:before
		content ''
		position absolute
		display block
		width 0
		height 0
		border-top $arrow-size solid transparent
		border-bottom $arrow-size solid transparent
		top 50%
		margin-top -1 * $arrow-size
		pointer-events none
		z-index 100
		opacity 0

	&.below-range:before
		left 0
		border-right $arrow-size solid var(--tq-color-accent)
		opacity .3

	&.above-range:before
		right 0
		border-left $arrow-size solid var(--tq-color-accent)
		opacity .3

	&.tweaking.below-range:before, &.tweaking.above-range:before
		opacity 1

	&:has(input:disabled)
		input-box-disabled()

		.bar
			background var(--tq-color-input)


	&:has(input[invalid])
		input-box-invalid()

	&:has(input:focus),
	&:has(input.focus)
		input-box-focus()

.input
	input-element-style()
	font-numeric()
	text-align center

	&[font=monospace]
		font-family var(--tq-font-code)

	&:not(:focus)
		pointer-events none

.bar, .tip
	position absolute
	height 100%

.bar
	pointer-events none
	background var(--tq-color-accent-soft)
	hover-transition(background)

	.InputNumber:hover &
		background var(--tq-color-accent-soft-hover)

.tip
	width 1px
	background var(--tq-color-accent)
	opacity .3

	&:hover,
	.InputNumber.tweaking &
		width 3px
		margin-left -1px

	.InputNumber:hover &,
	.InputNumber.tweaking &
		opacity 1

	.below-range &,
	.above-range &
		pointer-events none

	&:before
		content ''
		position absolute
		display block
		height 100%
		left calc(var(--tq-input-height) / -2)
		right @left


.icon
	width calc(var(--tq-input-height) - 6px)
	height calc(var(--tq-input-height) - 6px)
	margin 3px
	color var(--tq-color-text-mute)
	transform scale(0.8)
	opacity .7
	position absolute
	z-index 100
	pointer-events none
	top 0

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
