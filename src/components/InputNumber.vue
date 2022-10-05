<template lang="pug">
.InputNumber(ref='root', :class='{tweaking, invalid}', v-bind='$attrs')
	input.input(
		ref='input',
		type='text',
		min='0',
		inputmode='numeric',
		pattern='d\*',
		:value='display',
		:disabled='disabled'
		@focus='onFocus',
		@input='onInput',
		@blur='onBlur'
		@keydown.up.prevent='increment(1)'
		@keydown.down.prevent='increment(-1)'
	)
	.cursor(
		v-if='tweaking'
		:class='{floating: !pointerLocked}'
		:style='cursorStyle')
		IconDec.dec(:class='{active: tweakMode === "value" && tweakDirection < 0}' :size='height')
		IconInc.inc(:class='{active: tweakMode === "value" && tweakDirection > 0}' :size='height')

	.bar(v-if='hasRange')
		.fill(:style='{width: `${width * ((modelValue - min) / (max - min))}px`}')
			.tip

teleport(to='#GlispUI__overlays')
	svg.InputNumber__overlay(v-if='tweaking')
		g(:transform='`translate(${left + width / 2 + scaleOffset}, ${top + height / 2})`')
			g(v-if='tweakMode === "speed"')
				line.scale(v-bind='scaleAttrs(0)')
				line.scale(v-bind='scaleAttrs(1)')
				line.scale(v-bind='scaleAttrs(2)')
</template>

<script lang="ts">
import {useElementBounding, useFocus, useKeyModifier} from '@vueuse/core'
import {useWheel} from '@vueuse/gesture'
import {vec2} from 'gl-matrix'
import {clamp} from 'lodash'
import {computed, defineComponent, ref, watch, watchEffect} from 'vue'
import IconDec from 'vue-material-design-icons/Minus.vue'
import IconInc from 'vue-material-design-icons/Plus.vue'

import {useDrag} from '@/use/useDrag'
import {fit, smoothstep, toFixedWithNoTrailingZeros, unsignedMod} from '@/util'

/**
 * Input for number
 */
export default defineComponent({
	name: 'InputNumber',
	components: {
		IconDec,
		IconInc,
	},
	props: {
		modelValue: {
			type: Number,
			required: true,
		},
		min: {
			type: Number,
			default: Number.MIN_SAFE_INTEGER,
		},
		max: {
			type: Number,
			default: Number.MAX_SAFE_INTEGER,
		},
		clampMin: {
			type: Boolean,
			default: true,
		},
		clampMax: {
			type: Boolean,
			default: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		maxSpeed: {
			type: Number,
			default: 1000,
		},
		minSpeed: {
			type: Number,
			default: 0.0001,
		},
	},
	emits: ['update:modelValue'],
	inheritAttrs: false,
	setup(props, {emit}) {
		const root = ref()
		const input = ref<HTMLInputElement | null>(null)

		const local = ref(props.modelValue)
		const display = ref(props.modelValue.toString())

		const bound = useElementBounding(root)

		const alt = useKeyModifier('Alt')
		const shift = useKeyModifier('Shift')

		const hasRange = computed(() => {
			return (
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

		const speedMultiplierKey = computed(() => {
			return (alt.value ? 0.1 : 1) * (shift.value ? 10 : 1)
		})
		const speedMultiplierGesture = ref(1)
		const speed = computed(() => {
			return speedMultiplierKey.value * speedMultiplierGesture.value
		})

		const getDisplayPrecision = () => {
			const floats = /\.[0-9]*$/.exec(display.value)
			return floats ? floats[0].length - 1 : 0
		}
		const displayPrecision = ref(0)

		const tweakPrecision = computed(() => {
			const prec = Math.max(0, Math.ceil(-Math.log10(speed.value)))
			return Math.max(prec, displayPrecision.value)
		})
		const tweakInitialValue = ref(props.modelValue)

		const tweakDirection = ref(0)
		const pointerSize = ref(0)

		let resetTweakModeTimer = -1
		let tweakMode = ref<null | 'value' | 'speed'>(null)

		const {dragging: tweaking, pointerLocked} = useDrag(root, {
			lockPointer: true,
			disabled: computed(() => props.disabled || useFocus(input).focused.value),
			onClick() {
				input.value?.focus()
			},
			onDragStart(state, event) {
				const isTipDragged = (event.target as Element).classList.contains('tip')
				const insideRange = props.min <= local.value && local.value <= props.max
				if (hasRange.value && insideRange && !isTipDragged) {
					// Absolute mode
					local.value = fit(
						state.xy[0],
						bound.left.value,
						bound.right.value,
						props.min,
						props.max
					)
					emit('update:modelValue', local.value)
				}

				tweakMode.value = null
				tweakInitialValue.value = props.modelValue
				speedMultiplierGesture.value = 1
				displayPrecision.value = getDisplayPrecision()
			},
			onDrag(state, event) {
				const [dx, dy] = state.delta

				const isMouse =
					event.pointerType === 'mouse' || event.pointerType === 'pen'

				tweakDirection.value = dx
				pointerSize.value =
					event.width *
					0.75 *
					smoothstep(
						(event.width * 0.7) / 2,
						(event.width * 0.5) / 2,
						Math.abs(state.xy[1] - (bound.top.value + bound.height.value / 2))
					)

				if (state.pointerLocked) {
					scaleOffset.value = 0
				} else {
					scaleOffset.value =
						state.xy[0] - (bound.x.value + bound.width.value / 2)
				}

				if (!tweakMode.value) {
					if (isMouse) {
						tweakMode.value = Math.abs(dx) >= Math.abs(dy) ? 'value' : 'speed'
					} else {
						tweakMode.value = 'value'
					}
				}

				if (tweakMode.value === 'value') {
					const baseSpeed = hasRange.value
						? (props.max - props.min) / bound.width.value
						: 1

					local.value = props.modelValue + dx * baseSpeed * speed.value
					local.value = clamp(local.value, validMin.value, validMax.value)
					emit('update:modelValue', local.value)
				} else {
					speedMultiplierGesture.value = clamp(
						speedMultiplierGesture.value * Math.pow(0.98, dy),
						props.minSpeed,
						props.maxSpeed
					)
				}

				if (isMouse) {
					clearTimeout(resetTweakModeTimer)
					resetTweakModeTimer = setTimeout(() => (tweakMode.value = null), 250)
				}
			},
			onDragEnd() {
				display.value = toFixedWithNoTrailingZeros(
					props.modelValue,
					tweakPrecision.value
				)
				tweakMode.value = null
				speedMultiplierGesture.value = 1
			},
		})

		useWheel(
			({delta: [, y], event}) => {
				event.preventDefault()

				local.value = props.modelValue + y * speedMultiplierGesture.value
				local.value = clamp(local.value, validMin.value, validMax.value)
				display.value = props.modelValue.toFixed(tweakPrecision.value)

				emit('update:modelValue', local.value)
			},
			{domTarget: root, eventOptions: {passive: false}}
		)

		let hasChanged = false
		let initialDisplay = ''

		const onFocus = (e: FocusEvent) => {
			const el = e.target as HTMLInputElement
			el.select()
			hasChanged = false
			initialDisplay = display.value
		}

		const onInput = (e: Event) => {
			const el = e.target as HTMLInputElement

			display.value = el.value

			let value = parseFloat(el.value)
			if (isNaN(value)) return

			local.value = clamp(value, validMin.value, validMax.value)
			hasChanged = true

			emit('update:modelValue', local.value)
		}

		const increment = (delta: number) => {
			const prec = Math.max(
				getDisplayPrecision(),
				-Math.log10(speedMultiplierKey.value)
			)
			local.value += delta * speedMultiplierKey.value
			local.value = clamp(local.value, validMin.value, validMax.value)
			display.value = toFixedWithNoTrailingZeros(local.value, prec)
			hasChanged = true
			emit('update:modelValue', local.value)
		}

		const onBlur = () => {
			if (hasChanged) {
				display.value = props.modelValue.toString()
			} else {
				// 変な文字を打ったときはhasChanged === falseなので、これでリセットをかける
				display.value = initialDisplay
			}
		}

		watchEffect(() => {
			if (tweaking.value) {
				display.value = props.modelValue.toFixed(tweakPrecision.value)
			}
		})

		const scaleOffset = ref(0)

		const scaleAttrs = (offset: number) => {
			const precision = unsignedMod(
				-Math.log10(speedMultiplierGesture.value) + offset,
				3
			)
			const halfWidth = (bound.width.value + bound.height.value * 20) / 2

			const opacity = smoothstep(1, 2, precision)

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
				opacity: smoothstep(
					bound.width.value * 0.5,
					bound.width.value * 0.6,
					Math.abs(scaleOffset.value)
				),
			}
		})

		// For iPad. Swiping with second finger to change the drag speed
		window.addEventListener('touchstart', (e: TouchEvent) => {
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
				speedMultiplierGesture.value = clamp(
					initialSpeedMultiplierGesture * mul,
					props.minSpeed,
					props.maxSpeed
				)
			}

			function onSecondTouchEnd() {
				if (!e.touches.item(1)) return

				tweakMode.value = 'value'

				window.removeEventListener('touchmove', onSecondTouchMove)
				window.removeEventListener('touchend', onSecondTouchEnd)
			}
		})

		return {
			root,
			input,
			display,
			hasRange,
			onFocus,
			onInput,
			onBlur,
			increment,
			tweaking,
			pointerLocked,
			...bound,
			scaleOffset,
			tweakDirection,
			tweakInitialValue,
			tweakPrecision,
			tweakMode,
			scaleAttrs,
			cursorStyle,
		}
	},
})
</script>

<style lang="stylus">
@import '@/common.styl'

.InputNumber
	position relative
	input('.tweaking')
	font-numeric()
	text-align right
	user-select none
	-webkit-user-select none

	.input
		pointer-events none

		&:focus
			pointer-events auto

	.cursor
		position absolute
		inset 0

		&:not(.floating)
			width auto !important
			opacity 1 !important

		.dec, .inc
			position absolute
			aspect-ratio 1
			height 100%
			text-align center
			font-code()
			color base16('03')
			transition .2s ease color
			transform scale(.75)

		.active
			color base16('accent')

		.dec
			right 100%

		.inc
			left 100%

		&.floating
			inset auto
			top 0
			bottom 0
			left 50%
			margin-left calc(-1px * var(--height))
			input-transition(width, margin-left)

	.bar
		position absolute
		inset 0
		mix-blend-mode lighten
		border-radius var(--input-border-radius)
		overflow hidden

	.fill
		position absolute
		height 100%
		background base16('03')

	.tip
		position absolute
		height 100%
		width 1px
		right -1px

		&:before
			content ''
			position absolute
			display block
			height 100%
			left calc(var(--input-height) / -2)
			right @left

	.tip:hover, &.tweaking .tip
			background base16('accent')

	&__overlay
		position fixed
		overflow visible
		pointer-events none
		inset 0

		.scale
			fill none
			stroke-width 4
			stroke-linecap round
			stroke base16('accent')

		.pointer
			fill base16('accent')
</style>
