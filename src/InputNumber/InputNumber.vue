<script lang="ts" setup>
import {
	unrefElement,
	useElementBounding,
	useMagicKeys,
	whenever,
} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {
	Component,
	computed,
	nextTick,
	ref,
	type StyleValue,
	unref,
	useTemplateRef,
	watch,
	watchSyncEffect,
} from 'vue'

import {InputTextBase} from '../InputTextBase'
import {useMultiSelectStore} from '../stores/multiSelect'
import {InputEmits} from '../types'
import {useDrag} from '../use/useDrag'
import {useValidator} from '../use/useValidator'
import {getNumberPresition, precisionOf, toFixed, toPercent} from '../util'
import * as V from '../validator'
import InputNumberScales from './InputNumberScales.vue'
import {type InputNumberProps} from './types'

const model = defineModel<number>({required: true})

const props = withDefaults(defineProps<InputNumberProps>(), {
	min: Number.MIN_SAFE_INTEGER,
	max: Number.MAX_SAFE_INTEGER,
	bar: 0,
	snap: 10,
	clampMin: true,
	clampMax: true,
	precision: 4,
	prefix: '',
	suffix: '',
})

const emit = defineEmits<InputEmits>()

const $input = useTemplateRef('$input')
const $inputEl = computed(() => unrefElement($input.value as Component))
const {left, width, right} = useElementBounding($inputEl)

const focused = ref(false)
const expressionEnabled = ref(false)
const expressionError = ref<string | undefined>(undefined)

const local = ref(model.value)
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

const {alt: lessSpeedKey, shift: moreSpeedKey, q: snapKey} = useMagicKeys()
const speedMultiplierKey = computed(() => {
	return (lessSpeedKey.value ? 0.1 : 1) * (moreSpeedKey.value ? props.snap : 1)
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
	tweaking.value ? precisionOf(speed.value) : null
)

const precision = computed(() => {
	if (stepPrecision.value !== null) return stepPrecision.value

	if (tweakPrecision.value !== null) {
		return Math.max(
			displayPrecision.value,
			sliderPrecision.value,
			tweakPrecision.value
		)
	}

	return Math.min(
		props.precision,
		Math.max(displayPrecision.value, sliderPrecision.value)
	)
})

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

const {dragging: tweaking} = useDrag($input, {
	lockPointer: computed(() => !barVisible.value),
	disabled: computed(() => props.disabled || focused.value),
	onClick() {
		$input.value?.select()
	},
	onDragStart(state, event) {
		const handleDragged = (event.target as Element).classList.contains('handle')
		const insideRange = props.min <= model.value && model.value <= props.max

		if (barVisible.value && insideRange && !handleDragged) {
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
	onDrag(state) {
		const [dx, dy] = state.delta

		if (typeof tweakMode.value !== 'string') {
			const doDetectMode = minSpeed.value !== maxSpeed.value

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

			let newLocal = local.value + delta

			if (!barVisible.value) {
				if (props.min !== Number.MIN_SAFE_INTEGER) {
					newLocal = scalar.max(newLocal, props.min)
				}
				if (props.max !== Number.MAX_SAFE_INTEGER) {
					newLocal = scalar.min(newLocal, props.max)
				}
			}
			local.value = newLocal

			deltaAccumulated += delta
			multi.update(v => v + deltaAccumulated)
		} else if (tweakMode.value === 'speed') {
			speedMultiplierGesture.value = scalar.clamp(
				speedMultiplierGesture.value * 0.98 ** dy,
				minSpeed.value,
				maxSpeed.value
			)
		}

		clearTimeout(resetTweakModeTimer)
		resetTweakModeTimer = setTimeout(() => {
			tweakMode.value = state.xy
		}, 60)

		snapEnabled.value = snapKey.value
	},
	onDragEnd() {
		confirm()
		emit('blur')
	},
})

//------------------------------------------------------------------------------
// Emit update:modelValue when the local value is changed

const snapEnabled = ref(false)

whenever(snapKey, () => {
	snapEnabled.value = tweaking.value
})

const validate = computed(() =>
	V.compose(
		V.clamp(validMin.value, validMax.value),
		V.quantize(props.step ?? 0),
		V.quantize(snapEnabled.value ? props.snap : 0)
	)
)

const {validateResult, validLocal} = useValidator(local, validate)

const invalid = computed(() => {
	if (props.invalid) return true
	if (tweaking.value) return false

	return validateResult.value.log.length > 0 || !!expressionError.value
})

function confirm() {
	emit('confirm')
	multi.confirm()
	multi.capture()

	expressionEnabled.value = false
	expressionError.value = undefined

	nextTick(() => {
		local.value = model.value
		display.value = print.value(model.value)
	})
}

//------------------------------------------------------------------------------
// Input Events

let localAtFocus = 0

function onFocus() {
	multi.capture()
	emit('focus')
}

function enableExpression() {
	localAtFocus = local.value
	expressionEnabled.value = true
}

function onKeydown(e: KeyboardEvent) {
	if (e.metaKey && e.key === '=') {
		e.preventDefault()
		enableExpression()
	}
}

function onInput(e: Event) {
	const value = (e.target as HTMLInputElement).value
	display.value = value

	if (!/^[0-9.]*$/.test(value)) {
		enableExpression()
	}

	try {
		const fn = eval(`(x, {i}) => {
			const result = (${value})
			if (typeof result === 'number') {
				return result
			}
			throw new Error('Value is not a number')
		}`)
		local.value = fn(localAtFocus, {i: multi.index})
		expressionError.value = undefined
		multi.update(fn)
	} catch (e) {
		expressionError.value = (e as Error).message
	}
}

function onBlur() {
	confirm()
	emit('blur')
}

const print = computed(() => {
	const _tweaking = tweaking.value
	const _precision = precision.value

	return (local: number) => {
		return _tweaking ? local.toFixed(_precision) : toFixed(local, _precision)
	}
})

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

	nextTick(() => {
		display.value = print.value(model.value)
	})
}

//------------------------------------------------------------------------------
// Watchers

// When the model value is changed from outside, update the local value
watch(
	model,
	model => {
		if (model !== validLocal.value) {
			local.value = model
		}
	},
	{immediate: true, flush: 'sync'}
)
// When the model value is changed from outside while the input is not focused,
// update the display value properly
watch(
	() => [model.value, focused.value, print.value] as const,
	([model, focused, print], prev) => {
		// If the input has been focused, don't update the display value
		if (focused && prev?.[1]) return

		display.value = print(model)
	},
	{immediate: true, flush: 'sync'}
)

let emittedModel: number | undefined

watchSyncEffect(() => {
	if (
		validLocal.value !== undefined &&
		validLocal.value !== model.value &&
		validLocal.value !== emittedModel
	) {
		emittedModel = validLocal.value
		model.value = emittedModel
	}
})

// Click to select all
whenever(focused, () => nextTick(() => $input.value?.select()))

//------------------------------------------------------------------------------
// Multi Select

const multi = useMultiSelectStore().register({
	type: 'number',
	el: $input,
	focusing: computed(() => focused.value || tweaking.value),
	speed: computed(() => {
		if (!barVisible.value) return 1
		return (props.max - props.min) / width.value
	}),
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

	if (model.value < props.min) return {'below-range': true}
	if (model.value > props.max) return {'above-range': true}
	return {}
})

const scaleAttrs = (offset: number) => {
	const precision = scalar.mod(
		-Math.log10(speedMultiplierGesture.value) + offset,
		3
	)

	const halfWidth = width.value / 2

	const opacityForBar = barVisible.value
		? scalar.smoothstep(1, 0.1, speedMultiplierGesture.value)
		: 1

	const opacity = scalar.smoothstep(1, 2, precision) * opacityForBar

	const dashoffset = barVisible.value
		? scalar.fit(model.value, props.min, props.max, 0, width.value)
		: halfWidth - model.value / speedMultiplierGesture.value

	return {
		x1: -halfWidth,
		x2: halfWidth,
		style: {
			strokeDashoffset: -dashoffset,
			strokeDasharray: `0 ${10 ** precision}`,
			opacity,
		},
	}
}

const handleStyles = computed<StyleValue>(() => {
	if (!barVisible.value) return {visibility: 'hidden'}

	const tValue = scalar.invlerp(props.min, props.max, model.value)

	return {
		left: `calc((100% - 1px) * ${tValue})`,
	}
})

const barStyle = computed<StyleValue>(() => {
	if (!barVisible.value || props.bar === false) {
		return {visibility: 'hidden'}
	}

	const origin = typeof props.bar === 'number' ? props.bar : 0
	const tOrigin = scalar.invlerp(props.min, props.max, origin)
	const tValue = scalar.invlerp(props.min, props.max, model.value)

	const left = Math.min(tOrigin, tValue)
	const right = 1 - Math.max(tOrigin, tValue)

	return {
		left: toPercent(left),
		right: toPercent(right),
	}
})
</script>

<template>
	<InputTextBase
		ref="$input"
		v-model:focused="focused"
		class="TqInputNumber"
		:class="{...valueRangeStateClasses, tweaking}"
		:ignoreInput="!focused"
		:modelValue="display"
		:active="multi.subfocus"
		:font="expressionEnabled ? 'monospace' : 'numeric'"
		align="center"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:disabled="disabled"
		:invalid="invalid"
		:leftIcon="leftIcon"
		:rightIcon="rightIcon"
		@focus="onFocus"
		@blur="onBlur"
		@input="onInput"
		@keydown="onKeydown"
		@keydown.up.prevent="onIncrementByKey(1)"
		@keydown.down.prevent="onIncrementByKey(-1)"
		@keydown.enter.prevent="confirm"
	>
		<template #inactiveContent>
			<div class="display-at-inactive">
				<span v-if="prefix" class="prefix">{{ prefix }}</span>
				{{ display }}
				<span v-if="suffix" class="suffix">{{ suffix }}</span>
			</div>
		</template>
		<template #back>
			<div class="bar" :style="barStyle" />
			<InputNumberScales :min="min" :max="max" :step="step" />

			<svg
				v-if="tweaking"
				class="overlay"
				:class="{value: tweakMode === 'value', speed: tweakMode === 'speed'}"
			>
				<line class="scale" v-bind="scaleAttrs(0)"></line>
				<line class="scale" v-bind="scaleAttrs(1)"></line>
				<line class="scale" v-bind="scaleAttrs(2)"></line>
			</svg>

			<div class="handle" :style="handleStyles" />
		</template>
	</InputTextBase>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputNumber
	position relative
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

	&:has(:disabled) .bar
			background var(--tq-color-input)

.display-at-inactive
	pointer-events none
	position absolute
	inset 0
	display flex
	align-items center
	justify-content center

	.prefix, .suffix
		color var(--tq-color-text-mute)

	.prefix
		margin-right .1em

	.suffix
		margin-left .1em

.bar, .handle
	position absolute
	height 100%

.bar
	pointer-events none
	background var(--tq-color-accent-soft)
	hover-transition(background)

	.TqInputNumber:hover &
		background var(--tq-color-accent-soft-hover)

.handle
	width 1px
	background var(--tq-color-accent)
	opacity .3

	&:hover,
	.TqInputNumber.tweaking &
		width 3px
		margin-left -1px

	.TqInputNumber:hover &,
	.TqInputNumber.tweaking &
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

.overlay
	position absolute
	overflow visible
	pointer-events none
	top 50%
	left 50%

	.scale
		fill none
		stroke-width 2
		stroke-linecap round
		stroke var(--tq-color-text-subtle)
		hover-transition(stroke-width)

	&.value .scale
		stroke-width 3
		stroke set-alpha(--tq-color-accent, .7)

	&.speed .scale
		stroke-width 4
		stroke var(--tq-color-accent)

	.pointer
		fill var(--tq-color-accent)

	.bar
		background var(--tq-color-input-tinted-accent-hover)

	.handle
		background var(--tq-color-accent)
</style>
