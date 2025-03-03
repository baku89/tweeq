<script lang="ts" setup>
import {scalar} from 'linearly'
import {computed, shallowRef} from 'vue'

import {GlslCanvas} from '../GlslCanvas'
import {useDrag} from '../useDrag'
import {unsignedMod} from '../util'
import SliderFragmentString from './slider.frag'
import {type Channels, type ColorChannel, colorChannelToIndex} from './types'

interface Props {
	axis: ColorChannel
	channels: Channels
}

const props = defineProps<Props>()

const emit = defineEmits<{
	updateChannels: [Partial<Channels>]
}>()

const $root = shallowRef<null | HTMLElement>(null)

let initialChannel: number
let isRelative = false

const {
	dragging: sliderTweaking,
	left,
	right,
	top,
	bottom,
	xy,
} = useDrag($root, {
	disableClick: true,
	onDragStart(_, event) {
		isRelative = event.target !== $root.value
		initialChannel = props.channels[props.axis]
	},
	onDrag({xy: [x], initial: [ix], right, left, width}) {
		let ch: number

		if (isRelative) {
			const deltaCh = (x - ix) / width
			ch = initialChannel + deltaCh
		} else {
			ch = scalar.invlerp(left, right, x)
		}

		if (props.axis === 'h') {
			ch = unsignedMod(ch, 1)
		} else {
			ch = scalar.clamp(ch, 0, 1)
		}

		emit('updateChannels', {[props.axis]: ch})
	},
})

const tweakingInside = computed(() => {
	return (
		sliderTweaking.value &&
		left.value <= xy.value[0] &&
		right.value >= xy.value[0] &&
		top.value <= xy.value[1] &&
		bottom.value >= xy.value[1]
	)
})

const uniforms = computed(() => {
	const {a, h, s, v} = props.channels
	return {
		hsva: [h, s, v, a],
		axis: colorChannelToIndex(props.axis),
		offset: 0,
	}
})

const circleStyle = computed(() => {
	const t = props.channels[props.axis]
	const {r, g, b} = props.channels

	const background = `rgba(${r * 255}, ${g * 255}, ${b * 255})`

	return {
		left: `${t * 100}%`,
		background,
	}
})
</script>

<template>
	<div
		ref="$root"
		class="InputColorChannelSlider"
		:style="{cursor: tweakingInside ? 'none' : undefined}"
	>
		<GlslCanvas
			class="canvas"
			:fragmentString="SliderFragmentString"
			:uniforms="uniforms"
		/>
		<button
			class="circle"
			:class="{tweaking: sliderTweaking}"
			:style="circleStyle"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputColorChannelSlider
	position relative
	width 100%
	height calc(0.7 * var(--tq-input-height))

.canvas
	position absolute
	width 100%
	height 100%
	border-radius var(--tq-input-border-radius)
	background red
	background-checkerboard()

.circle
	circle()
	z-index 1
</style>
