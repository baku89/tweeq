<template lang='pug'>
.InputNumber(ref='root', :class='{tweaking}', v-bind='$attrs')
	input.InputNumber__input(
		ref='input',
		:value='display',
		@focus='onFocus',
		@input='onInput',
		@blur='onBlur'
	)
	.InputNumber__chevrons(v-if='tweaking')
		.dec(:class='{active: modelValue < tweakOrigin}') &lt;
		.inc(:class='{active: tweakOrigin < modelValue}') &gt;

teleport(to='#GlispUI__overlays')
	svg.InputNumber__overlay(v-if='tweaking')
		defs
			linearGradient#gradient
				stop(offset='0%', stop-color='white', stop-opacity='0')
				stop(offset='10%', stop-color='white', stop-opacity='1')
				stop(offset='90%', stop-color='white', stop-opacity='1')
				stop(offset='100%', stop-color='white', stop-opacity='0')
			mask#mask
				rect(
					:x='left - 300',
					:y='top',
					:width='width + 600',
					:height='height',
					fill='url(#gradient)'
				)
		line.dashed(
			:x1='left - 300',
			:y1='top + height / 2',
			:x2='right + 300',
			:y2='top + height / 2',
			:style='{strokeDashoffset, strokeDasharray: `0.01 ${100 / speed}`}'
		)
		line.zero(
			:x1='left - 300',
			:y1='top + height / 2',
			:x2='right + 300',
			:y2='top + height / 2',
			:style='{strokeDashoffset: strokeDashoffset - tweakOrigin * (1 / speed)}'
		)
</template>

<script lang="ts">
import {computed, defineComponent, ref, watchEffect} from 'vue'
import {useDrag} from '@/use/useDrag'
import {useElementBounding, useKeyModifier} from '@vueuse/core'

/**
 * Input for number
 */
export default defineComponent({
	name: 'InputNumber',
	props: {
		modelValue: {
			type: Number,
			required: true,
		},
		displayPrecision: {
			type: Number,
			default: 4,
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

		const strokeDashoffset = computed(() => {
			const gap = 1 / speed.value
			const centerX = 300 + bound.width.value / 2
			return -(centerX - props.modelValue * gap)
		})

		const tweakOrigin = ref(props.modelValue)

		let tweakTimer = -1
		let tweakMode: null | 'value' | 'speed' = null
		let speedDeltaY = 0

		const {dragging: tweaking, xy} = useDrag(root, {
			lockPointer: true,
			onClick() {
				input.value?.focus()
			},
			onDragStart() {
				tweakOrigin.value = props.modelValue

				const floats = /\.[0-9]*$/.exec(display.value)
				displayPrecision.value = floats ? floats[0].length - 1 : 0

				speedDeltaY = 0
				tweakMode = null
			},
			onDrag(state) {
				const [dx, dy] = state.delta

				if (!tweakMode) {
					tweakMode = Math.abs(dx) >= Math.abs(dy) ? 'value' : 'speed'
				}

				if (tweakMode === 'value') {
					const value = props.modelValue + dx * speed.value
					emit('update:modelValue', value)
				} else {
					speedDeltaY += dy
					speedMultiplierDrag.value = Math.pow(0.98, speedDeltaY)
				}

				clearTimeout(tweakTimer)
				tweakTimer = setTimeout(() => (tweakMode = null), 250)
			},
			onDragEnd() {
				display.value = props.modelValue
					.toFixed(tweakPrecision.value)
					.replace(/\.?[0]*$/, '')
			},
		})

		let hasChanged = false
		let initialDisplay = ''

		const onFocus = (e: InputEvent) => {
			const el = e.target as HTMLInputElement
			el.select()
			hasChanged = false
			initialDisplay = display.value
		}

		const onInput = (e: InputEvent) => {
			const el = e.target as HTMLInputElement

			display.value = el.value

			let value = parseFloat(el.value)
			if (isNaN(value)) return

			hasChanged = true

			emit('update:modelValue', value)
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

		return {
			root,
			input,
			display,
			onFocus,
			onInput,
			onBlur,
			tweaking,
			xy,
			...bound,
			speed,
			strokeDashoffset,
			tweakOrigin,
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

	&__input
		pointer-events none

		&:focus
			pointer-events auto

	&__chevrons
		position absolute
		inset 0

		*
			position absolute
			width var(--input-width)
			height 100%
			text-align center
			font-code()
			color base16('03', 0.5)
			input-transition()

		.active
			color base16('accent')
			font-weight bold

		.dec
			right 100%

		.inc
			left 100%

	&__overlay
		position fixed
		overflow visible
		pointer-events none
		inset 0

		.dashed
			fill none
			stroke base16('03')
			stroke-width 4
			stroke-linecap round
			stroke-dasharray 0.1 99.9

		.zero
			fill none
			stroke base16('accent')
			stroke-width 8
			stroke-linecap round
			stroke-dasharray 0.1 10000

.material-symbols-outlined
	font-variation-settings 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 48
</style>