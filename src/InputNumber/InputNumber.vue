<script lang="ts" setup>
import {Icon} from '@iconify/vue'
import {
	useElementBounding,
	useEventListener,
	useFocus,
	useKeyModifier,
	whenever,
} from '@vueuse/core'
import {scalar} from 'linearly'
import {computed, nextTick, ref, StyleValue, watch} from 'vue'

import {useDrag} from '../useDrag'
import {getNumberPresition, toFixed, toPercent, unsignedMod} from '../util'
import {type Props} from './types'

const props = withDefaults(defineProps<Props>(), {
	min: Number.MIN_SAFE_INTEGER,
	max: Number.MAX_SAFE_INTEGER,
	bar: true,
	barOrigin: 0,
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

const root = ref<HTMLElement | null>(null)
const $input = ref<HTMLInputElement | null>(null)
const {left, top, width, height, right} = useElementBounding(root)

const focusing = useFocus($input).focused

const local = ref(props.modelValue)
const display = ref('')

const barVisible = computed(() => {
	return (
		props.bar &&
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

const displayPrecision = ref(0)
const tweakPrecision = computed(() => {
	const prec = Math.max(0, Math.ceil(-Math.log10(speed.value)))
	return Math.max(prec, displayPrecision.value)
})

const pointerSize = ref(0)

let resetTweakModeTimer: ReturnType<typeof setTimeout>
const tweakMode = ref<null | 'value' | 'speed'>(null)

const {dragging: tweaking, pointerLocked} = useDrag(root, {
	lockPointer: computed(() => !(barVisible.value && props.bar)),
	disabled: computed(() => props.disabled || useFocus($input).focused.value),
	onClick() {
		$input.value?.focus()
	},
	onDragStart(state, event) {
		const isTipDragged = (event.target as Element).classList.contains('tip')
		const insideRange =
			props.min <= props.modelValue && props.modelValue <= props.max
		if (barVisible.value && insideRange && !isTipDragged) {
			// Absolute mode
			local.value = scalar.fit(
				state.xy[0],
				left.value,
				right.value,
				props.min,
				props.max
			)
		}

		tweakMode.value = null
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

		if (!state.pointerLocked && !isMouse) {
			scaleOffset.value = state.xy[0] - (left.value + width.value / 2)
		} else {
			scaleOffset.value = 0
		}

		if (!tweakMode.value) {
			if (isMouse) {
				tweakMode.value = Math.abs(dx) >= Math.abs(dy) ? 'value' : 'speed'
			} else {
				tweakMode.value = 'value'
			}
		}

		if (tweakMode.value === 'value') {
			const baseSpeed =
				barVisible.value && props.bar
					? (props.max - props.min) / width.value
					: 1

			local.value += dx * baseSpeed * speed.value

			let newValue = local.value
			if (props.step) {
				newValue = scalar.quantize(newValue, props.step)
			}
			newValue = scalar.clamp(newValue, validMin.value, validMax.value)

			emit('update:modelValue', newValue)
		} else {
			const minSpeed = 10 ** -props.precision
			const maxSpeed = barVisible.value && props.bar ? 1 : 1000

			speedMultiplierGesture.value = scalar.clamp(
				speedMultiplierGesture.value * 0.98 ** dy,
				minSpeed,
				maxSpeed
			)
		}

		if (isMouse) {
			clearTimeout(resetTweakModeTimer)
			resetTweakModeTimer = setTimeout(() => (tweakMode.value = null), 100)
		}
	},
})

//------------------------------------------------------------------------------
// Input Events

function onInput(e: Event) {
	const el = e.target as HTMLInputElement

	display.value = el.value

	let newValue = parseFloat(el.value)
	if (isNaN(newValue)) return

	local.value = newValue

	if (props.step) {
		newValue = scalar.quantize(newValue, props.step ?? 1)
	}
	newValue = scalar.clamp(newValue, validMin.value, validMax.value)

	emit('input', e)
	emit('update:modelValue', newValue)
}

function onIncrementByKey(delta: number) {
	const prec = Math.max(
		getNumberPresition(display.value),
		-Math.log10(speedMultiplierKey.value)
	)

	local.value += delta * speedMultiplierKey.value

	let newValue = local.value
	if (props.step) {
		newValue = scalar.quantize(newValue, props.step)
	}
	newValue = scalar.clamp(newValue, validMin.value, validMax.value)

	display.value = toFixed(local.value, prec)

	emit('update:modelValue', newValue)
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
			tweakPrecision.value,
		] as const,
	([modelValue, tweaking, focusing, tweakPrecision]) => {
		if (focusing) return

		const displayNumber = tweaking
			? modelValue.toFixed(tweakPrecision)
			: toFixed(modelValue, props.precision)

		display.value = props.prefix + displayNumber + props.suffix
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
const scaleOffset = ref(0.0)

const scaleAttrs = (offset: number) => {
	const precision = unsignedMod(
		-Math.log10(speedMultiplierGesture.value) + offset,
		3
	)
	const halfWidth = (width.value + height.value * 20) / 2

	const opacity = scalar.smoothstep(1, 2, precision)

	return {
		x1: -halfWidth,
		x2: halfWidth,
		style: {
			strokeDashoffset: -halfWidth,
			strokeDasharray: `0 ${Math.pow(10, precision)}`,
			opacity,
		},
	}
}

const cursorStyle = computed(() => {
	return {
		transform: `translateX(${scaleOffset.value}px)`,
		width: `${pointerSize.value}px`,
		marginLeft: `${pointerSize.value / -2}px`,
		opacity: scalar.smoothstep(
			width.value * 0.5,
			width.value * 0.6,
			Math.abs(scaleOffset.value)
		),
	}
})

const tipStyle = computed<StyleValue>(() => {
	if (!barVisible.value) return {visibility: 'hidden'}

	const tValue = scalar.invlerp(props.min, props.max, props.modelValue)

	return {
		left: toPercent(tValue),
	}
})

const barStyle = computed<StyleValue>(() => {
	if (!barVisible.value || props.barOrigin === null) {
		return {visibility: 'hidden'}
	}

	const tOrigin = scalar.invlerp(props.min, props.max, props.barOrigin)
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
		ref="root"
		class="InputNumber"
		:class="{tweaking}"
		:horizontal-position="horizontalPosition"
		:vertical-position="verticalPosition"
		:disabled="!!disabled"
		v-bind="$attrs"
	>
		<div class="bar" :style="barStyle" />
		<div class="tip" :style="tipStyle" />

		<input
			ref="$input"
			type="text"
			min="0"
			inputmode="numeric"
			pattern="d*"
			:value="display"
			:invalid="invalid"
			:disabled="disabled"
			@focus="onFocus"
			@input="onInput"
			@keydown.up.prevent="onIncrementByKey(1)"
			@keydown.down.prevent="onIncrementByKey(-1)"
		/>
		<div
			v-if="tweaking"
			class="cursor"
			:class="{floating: !pointerLocked}"
			:style="cursorStyle"
		/>

		<Icon v-if="leftIcon" class="icon left" :icon="leftIcon" />
		<Icon v-if="rightIcon" class="icon right" :icon="rightIcon" />
	</div>
	<teleport to="body">
		<svg v-if="tweaking || true" class="InputNumber__overlay">
			<g
				:transform="`translate(${left + width / 2 + scaleOffset}, ${
					top + height / 2
				})`"
			>
				<g v-if="tweakMode === 'speed'">
					<line class="scale" v-bind="scaleAttrs(0)"></line>
					<line class="scale" v-bind="scaleAttrs(1)"></line>
					<line class="scale" v-bind="scaleAttrs(2)"></line>
				</g>
			</g>
		</svg>
	</teleport>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputNumber
	input-style()

	input
		text-align center
		position relative
		font-numeric()
		pointer-events none
		padding-left 0
		padding-right 0

.bar
	top 0
	position absolute
	height 100%
	hover-transition(background)
	background var(--tq-color-primary-container)

.tip
	position absolute
	height 100%
	width 2px
	background var(--tq-color-tinted-input-active)
	hover-transition(opacity)

	&:before
		content ''
		position absolute
		display block
		height 100%
		left calc(var(--tq-input-height) / -2)
		right @left

	.tweaking &, &:hover
		background var(--tq-color-primary-hover)

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

.InputNumber:hover, .InputNumber:focus-within
	.bar
		background var(--tq-color-tinted-input-active)
</style>

<style lang="stylus">
.InputNumber__overlay
	position fixed
	overflow visible
	pointer-events none
	width 100%
	height: 100%
	inset 0
	z-index 200

	.scale
		fill none
		stroke-width 4
		stroke-linecap round
		stroke var(--tq-color-primary)

	.pointer
		fill var(--tq-color-primary)
</style>
