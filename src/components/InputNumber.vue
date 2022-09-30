<template lang="pug">
.InputNumber(ref='root', :class='{tweaking}', v-bind='$attrs')
	input.InputNumber__input(
		ref='input',
		type='text',
		inputmode='numeric',
		pattern='[0-9]*',
		:value='display',
		@focus='onFocus',
		@input='onInput',
		@blur='onBlur'
	)
	.InputNumber__chevrons(v-if='tweakMode === "value"')
		ChevronLeft.dec(:class='{active: tweakDirection < 0}' :size='height')
		ChevronRight.inc(:class='{active: tweakDirection > 0}' :size='height')

teleport(to='#GlispUI__overlays')
	svg.InputNumber__overlay(v-if='tweaking')
		g(v-if='tweakMode === "speed"',
			:transform='`translate(${left - overlayExpansion}, ${top + height / 2})`')
			line.scale(v-bind='scaleAttrs(0)')
			line.scale(v-bind='scaleAttrs(1)')
			line.scale(v-bind='scaleAttrs(2)')
</template>

<script lang="ts">
import ChevronLeft from 'vue-material-design-icons/ChevronLeft.vue'
import ChevronRight from 'vue-material-design-icons/ChevronRight.vue'
import {computed, defineComponent, ref, watchEffect} from 'vue'
import {useDrag} from '@/use/useDrag'
import {useElementBounding, useKeyModifier} from '@vueuse/core'
import {useWheel} from '@vueuse/gesture'
import {toFixedWithNoTrailingZeros, unsignedMod, smoothstep} from '@/util'

/**
 * Input for number
 */
export default defineComponent({
	name: 'InputNumber',
	components: {
		ChevronLeft,
		ChevronRight,
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

		let tweakTimer = -1
		let tweakMode = ref<null | 'value' | 'speed'>(null)
		let speedDeltaY = 0

		const {dragging: tweaking} = useDrag(root, {
			lockPointer: true,
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
			onDrag(state) {
				const [dx, dy] = state.delta

				const isMouse = state.event.pointerType === 'mouse'

				tweakDirection.value = dx

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

				if (isMouse) {
					clearTimeout(tweakTimer)
					tweakTimer = setTimeout(() => (tweakMode.value = null), 250)
				}
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

		const overlayExpansion = computed(() => bound.height.value * 10)

		const scaleAttrs = (offset: number) => {
			const precision = unsignedMod(-Math.log10(speed.value) + offset, 3)

			const opacity = smoothstep(1, 2, precision)

			return {
				x2: bound.width.value + overlayExpansion.value * 2,
				style: {
					strokeDashoffset: -(overlayExpansion.value + bound.width.value / 2),
					strokeDasharray: `0 ${Math.pow(10, precision)}`,
					opacity,
				},
			}
		}

		return {
			root,
			input,
			display,
			onFocus,
			onInput,
			onBlur,
			tweaking,
			...bound,
			overlayExpansion,
			speed,
			tweakDirection,
			tweakInitialValue,
			tweakPrecision,
			tweakMode,
			scaleAttrs,
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

	&__chevrons
		position absolute
		inset 0

		.dec, .inc
			position absolute
			aspect-ratio 1
			height 100%
			text-align center
			font-code()
			color base16('02')
			input-transition(color)

		.active
			color base16('accent')

		.dec
			right 100%

		.inc
			left 100%

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
</style>
