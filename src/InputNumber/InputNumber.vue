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

import {Icon} from '../Icon'
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

function onReset() {
	if (props.default !== undefined) {
		model.value = props.default
		emit('confirm')
	}
}

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

// Unranged drag sensitivity, in pixels of movement per `step`. Fixed so the feel
// is independent of the step's magnitude (otherwise a step of 0.1 scrubs hyper-
// fine and a step of 100 sluggishly). Smaller than InputDrum's DRAG_STEP_PX (40):
// a number field is unbounded and traversed in larger sweeps, with the y-axis
// acceleration and Alt (0.1×) / Shift (snap) modifiers covering big/fine moves.
const PX_PER_STEP = 20

let deltaAccumulated = 0

let dirAverage: vec2 = vec2.unitX
let offsetWeight = 1

// Whether the value currently sits within [min, max]. Out of range there's no
// in-bar handle to grab, so the over-range strips take over as the scrub grip.
const insideRange = computed(
	() => props.min <= model.value && model.value <= props.max
)

// True when a drag began while the field was already focused (text editing).
// Such a drag scrubs the value via a grab zone but must NOT steal text focus,
// so we skip the focus/blur bracketing the unfocused path uses.
let dragStartedFocused = false

const {dragging: tweaking} = useDrag($input, {
	lockPointer: computed(() => !barVisible.value),
	disabled: computed(() => props.disabled),
	// While focused, only the grab affordances (.scrub) start a drag; pressing the
	// text area falls through to the <input> to place a caret / edit. `closest` so
	// a press on a child (e.g. the grip's hint icon / its inner SVG) still counts.
	shouldDrag(event) {
		if (!focused.value) return true
		return !!(event.target as Element | null)?.closest('.scrub')
	},
	onClick() {
		$input.value?.select()
	},
	onDragStart(state, event) {
		const grabbed = !!(event.target as Element).closest('.scrub')
		dragStartedFocused = focused.value

		if (barVisible.value && insideRange.value && !grabbed) {
			// Absolute Mode — jump to the pressed position. Only reachable while
			// unfocused; focused presses on the bar go to the text input instead.
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
		speedMultiplierGesture.value = 1

		if (!dragStartedFocused) emit('focus')
		multi.capture()
	},
	onDrag(state) {
		const [dx, dy] = state.delta

		// Decide the weight for sensitivity/delta by the direction of the drag
		dirAverage = vec2.normalize(
			vec2.lerp(dirAverage, vec2.abs(state.delta), 0.1)
		)

		offsetWeight = scalar.smoothstep(
			0.4,
			0.6,
			Math.abs(vec2.dot([1, 0], dirAverage))
		)

		// Inc/dec value by x-axis. Ranged: map the bar's full width to [min, max].
		// Unranged: set sensitivity directly — a fixed PX_PER_STEP pixels per step
		// when stepped (so it doesn't track the step's magnitude), else continuous
		// at 1 unit/px.
		const baseSpeed = barVisible.value
			? (props.max - props.min) / width.value
			: props.step
				? props.step / PX_PER_STEP
				: 1

		const delta = dx * baseSpeed * speed.value * offsetWeight

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

		// Adjustment sensitivity by y-axis
		speedMultiplierGesture.value = scalar.clamp(
			scalar.lerp(
				speedMultiplierGesture.value * 0.98 ** dy,
				speedMultiplierGesture.value,
				offsetWeight
			),
			minSpeed.value,
			maxSpeed.value
		)

		snapEnabled.value = snapKey.value
	},
	onDragEnd() {
		confirm()

		if (dragStartedFocused) {
			// Stay in text-edit mode; re-select so typing replaces the value the
			// scrub just produced.
			nextTick(() => $input.value?.select())
		} else {
			emit('blur')
		}
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
	() => [model.value, focused.value, print.value, tweaking.value] as const,
	([model, focused, print, tweaking], prev) => {
		// While focused, keep the user's typed text — unless an active scrub (via a
		// grab zone) is driving the value, in which case mirror it live.
		if (focused && prev?.[1] && !tweaking) return

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

// The tweak overlay's scale dots visualise the (continuous) drag sensitivity.
// They're pointless for a value that's both stepped and clamped — it only moves
// between a fixed set of discrete stops, so hide them while tweaking (the step
// grid + bar already show the granularity).
const showTweakScale = computed(() => {
	const stepped = !!props.step
	const clamped =
		props.clampMin &&
		props.clampMax &&
		props.min !== Number.MIN_SAFE_INTEGER &&
		props.max !== Number.MAX_SAFE_INTEGER
	return !(stepped && clamped)
})

const scaleAttrs = (offset: number) => {
	const base = 10

	const precision = scalar.mod(
		-Math.log(speedMultiplierGesture.value) / Math.log(base) + offset,
		3
	)

	const opacity = Math.pow(scalar.smoothstep(1, 2, precision), 0.5)

	const halfWidth = width.value / 2

	const dashoffset = barVisible.value
		? scalar.efit(model.value, props.min, props.max, 0, width.value)
		: halfWidth - model.value / speedMultiplierGesture.value

	return {
		x1: -halfWidth,
		x2: halfWidth,
		style: {
			'--offset-weight': offsetWeight,
			'--gesture-precision': precision,
			strokeDashoffset: -dashoffset,
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

// Horizontal position of the in-range grab zones, pinned to the handle. The
// zone's left edge is clamped so the full width stays inside the field — at min
// / max the handle sits flush with an edge, and a centred zone would be half
// clipped away (and ungrabbable). Clamping keeps the whole grip on-screen with
// the handle at its edge.
const zoneStyle = computed<StyleValue>(() => {
	const tValue = scalar.clamp(
		scalar.invlerp(props.min, props.max, model.value),
		0,
		1
	)
	return {
		left:
			`clamp(0px,` +
			` calc((100% - 1px) * ${tValue} - var(--tq-input-height) / 2),` +
			` calc(100% - var(--tq-input-height)))`,
	}
})

const rangeSide = computed(() => (model.value < props.min ? 'below' : 'above'))

// At min / max the handle is flush with an edge, where the thin top/bottom
// strips get eaten by the corner radius — and there's no centred text to protect
// out there anyway. So use a single full-height grab zone at the edges.
const handleAtEdge = computed(
	() =>
		insideRange.value && (model.value <= props.min || model.value >= props.max)
)

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
		:default="props.default"
		@focus="onFocus"
		@blur="onBlur"
		@input="onInput"
		@keydown="onKeydown"
		@keydown.up.prevent="onIncrementByKey(1)"
		@keydown.down.prevent="onIncrementByKey(-1)"
		@keydown.enter.prevent="confirm"
		@reset="onReset"
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

			<svg v-if="tweaking && showTweakScale" class="overlay">
				<line class="scale" v-bind="scaleAttrs(0)"></line>
				<line class="scale" v-bind="scaleAttrs(1)"></line>
				<line class="scale" v-bind="scaleAttrs(2)"></line>
			</svg>

			<div class="handle scrub" :style="handleStyles" />
		</template>

		<!-- Grab affordances live above the <input> (the back slot is below it) so
			they can take the pointer while the field is focused for text editing.
			Ranged: transparent grab zones over the handle (top/bottom strips leaving
			a centre text gap; full-height at min/max; full-width when out of range).
			Unranged: no bar to grab, so the left-icon area becomes a horizontal
			scrub grip — falling back to a faint hint icon when there's no leftIcon. -->
		<template #front>
			<template v-if="barVisible">
				<template v-if="insideRange">
					<div
						v-if="handleAtEdge"
						class="scrub-zone scrub edge"
						:style="zoneStyle"
					/>
					<template v-else>
						<div class="scrub-zone scrub top" :style="zoneStyle" />
						<div class="scrub-zone scrub bottom" :style="zoneStyle" />
					</template>
				</template>
				<template v-else>
					<div class="scrub-zone scrub wide top" :class="rangeSide" />
					<div class="scrub-zone scrub wide bottom" :class="rangeSide" />
				</template>
			</template>
			<div v-else class="scrub grip">
				<Icon v-if="!leftIcon" class="grip-hint" icon="mdi:arrow-left-right" />
			</div>
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

	// Not while disabled — the bar shouldn't light up on hover then.
	.TqInputNumber:hover:not(:has(:disabled)) &
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

	// Focused: the grab zone (not the handle) takes the hover, so mirror the
	// unfocused hover by thickening the handle when a tip zone is hovered. (The
	// opacity is already 1 from the :hover rule above, since hovering a zone means
	// the field is hovered.)
	.TqInputNumber:focus-within:has(.scrub-zone:not(.wide):hover) &
		width 3px
		margin-left -1px

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

	// Focused: the front grab zones own the pointer; the handle is just the mark.
	.TqInputNumber:focus-within &
		pointer-events none

// Transparent hit areas above the <input>. Pinned to the handle's x (in range)
// or spanning the width (out of range), split top/bottom so the centre stays
// clickable as text. Only interactive while the field is focused — otherwise the
// back-slot handle/bar drive dragging exactly as before.
.scrub-zone
	position absolute
	// zoneStyle sets `left` to the (clamped) zone edge; no centring transform.
	width var(--tq-input-height)
	pointer-events none

	&.top
		top 0

	&.bottom
		bottom 0

	&.top, &.bottom
		height 'max((var(--tq-input-height) - 1em) / 2, 4px)' % ()

	// At an edge: one full-height grip (the corner radius would gut thin strips).
	&.edge
		top 0
		bottom 0

	&.wide
		left 0
		right 0
		width auto

	.TqInputNumber:focus-within &
		pointer-events auto
		cursor ew-resize

// Unranged: a horizontal scrub grip over the left-icon area. Inert until the
// field is focused (unfocused, the whole field already drags); then it takes the
// pointer so a focused press here scrubs while the text stays editable.
.grip
	position absolute
	left 0
	top 0
	bottom 0
	width var(--tq-input-height)
	display flex
	align-items center
	justify-content center
	pointer-events none

	.TqInputNumber:focus-within &
		pointer-events auto
		cursor ew-resize

// Faint hint shown only while focused when there's no leftIcon to grab.
.grip-hint
	color var(--tq-color-text-mute)
	transform scale(0.7)
	opacity 0

	.TqInputNumber:focus-within &
		opacity .5

.overlay
	position absolute
	overflow visible
	pointer-events none
	top 50%
	left 50%

	.scale
		--offset-weight 1
		--gesture-precision 0
		fill none
		stroke 'color-mix(in srgb, var(--tq-color-accent), var(--tq-color-text-subtle) calc(var(--offset-weight) * 100%))' % ()
		stroke-linecap round
		stroke-width calc(4px + var(--offset-weight) * -1px)
		stroke-dasharray 0 calc(pow(10, var(--gesture-precision)))
		hover-transition(stroke-width)

	.pointer
		fill var(--tq-color-accent)

	.bar
		background var(--tq-color-input-tinted-accent-hover)

	.handle
		background var(--tq-color-accent)
</style>
