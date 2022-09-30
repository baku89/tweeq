<template lang="pug">
.InputNumber(ref='root', :class='{tweaking}', v-bind='$attrs')
	input.InputNumber__input(
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
	)
	.InputNumber__cursor(
		v-if='tweaking'
		:class='{floating: !pointerLocked}'
		:style='cursorStyle')
		IconDec.dec(:class='{active: tweakMode === "value" && tweakDirection < 0}' :size='height')
		IconInc.inc(:class='{active: tweakMode === "value" && tweakDirection > 0}' :size='height')

teleport(to='#GlispUI__overlays')
	svg.InputNumber__overlay(v-if='tweaking')
		g(:transform='`translate(${left + width / 2 + scaleOffset}, ${top + height / 2})`')
			g(v-if='tweakMode === "speed"')
				line.scale(v-bind='scaleAttrs(0)')
				line.scale(v-bind='scaleAttrs(1)')
				line.scale(v-bind='scaleAttrs(2)')
</template>

<script lang="ts">
import IconDec from 'vue-material-design-icons/Minus.vue'
import IconInc from 'vue-material-design-icons/Plus.vue'
import {computed, defineComponent, ref, watch, watchEffect} from 'vue'
import {useDrag} from '@/use/useDrag'
import {useElementBounding, useFocus, useKeyModifier} from '@vueuse/core'
import {useWheel} from '@vueuse/gesture'
import {toFixedWithNoTrailingZeros, unsignedMod, smoothstep} from '@/util'

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
		step: {
			type: Number,
			default: 0.1,
		},
		disabled: {
			type: Boolean,
			default: false,
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

		const speedMultiplierKey = computed(() => {
			return (alt.value ? 0.1 : 1) * (shift.value ? 10 : 1)
		})
		const speedMultiplierDrag = ref(1)
		const speed = computed(
			() => speedMultiplierKey.value * speedMultiplierDrag.value
		)

		const displayPrecision = ref(0)

		const tweakPrecision = computed(() => {
			const tweakPrecision = Math.max(0, Math.ceil(-Math.log10(speed.value)))
			return Math.max(tweakPrecision, displayPrecision.value)
		})
		const tweakInitialValue = ref(props.modelValue)

		const tweakDirection = ref(0)
		const pointerSize = ref(0)

		let resetTweakModeTimer = -1
		let tweakMode = ref<null | 'value' | 'speed'>(null)
		let speedDeltaY = 0

		const {dragging: tweaking, pointerLocked} = useDrag(root, {
			lockPointer: true,
			disabled: computed(() => props.disabled || useFocus(input).focused.value),
			onClick() {
				input.value?.focus()
			},
			onDragStart() {
				tweakInitialValue.value = props.modelValue
				speedMultiplierDrag.value = 1

				const floats = /\.[0-9]*$/.exec(display.value)
				displayPrecision.value = floats ? floats[0].length - 1 : 0

				speedDeltaY = 0
				tweakMode.value = null
			},
			onDrag(state, event) {
				const [dx, dy] = state.delta

				const isMouse = event.pointerType === 'mouse'

				tweakDirection.value = dx
				pointerSize.value =
					event.width *
					0.75 *
					smoothstep(
						(event.width * 1.5) / 2,
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
					local.value = props.modelValue + dx * speed.value
					emit('update:modelValue', local.value)
				} else {
					speedDeltaY += dy
					speedMultiplierDrag.value = Math.pow(0.98, speedDeltaY)
				}

				clearTimeout(resetTweakModeTimer)
				resetTweakModeTimer = setTimeout(() => (tweakMode.value = null), 250)
			},
			onDragEnd() {
				display.value = toFixedWithNoTrailingZeros(
					props.modelValue,
					tweakPrecision.value
				)
				tweakMode.value = null
			},
		})

		useWheel(
			({delta: [, y], event}) => {
				event.preventDefault()

				local.value = props.modelValue + y * speed.value
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

			local.value = value
			hasChanged = true

			emit('update:modelValue', local.value)
		}

		const onBlur = () => {
			if (hasChanged) {
				display.value = props.modelValue.toString()
			} else {
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
			const precision = unsignedMod(-Math.log10(speed.value) + offset, 3)
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
			const initialSpeedMultiplierDrag = speedMultiplierDrag.value

			const stop = watch(tweaking, () => {
				window.removeEventListener('touchmove', onSecondTouchMove)
				window.removeEventListener('touchend', onSecondTouchEnd)
				stop()
			})

			window.addEventListener('touchmove', onSecondTouchMove)
			window.addEventListener('touchend', onSecondTouchEnd)

			clearTimeout(resetTweakModeTimer)

			function onSecondTouchMove(e: TouchEvent) {
				const firstTouch = e.touches.item(0)
				const secondTouch = e.touches.item(1)
				if (!firstTouch || !secondTouch) return

				const cx = firstTouch.clientX
				const x = secondTouch.clientX

				tweakMode.value = 'speed'

				const mul = Math.abs((ox - cx) / (x - cx))
				speedMultiplierDrag.value = initialSpeedMultiplierDrag * mul
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
			onFocus,
			onInput,
			onBlur,
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

	&__input
		pointer-events none

		&:focus
			pointer-events auto

	&__cursor
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
