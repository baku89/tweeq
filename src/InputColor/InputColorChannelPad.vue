<script lang="ts" setup>
import {scalar, vec2} from 'linearly'
import {computed, shallowRef} from 'vue'

import {GlslCanvas} from '../GlslCanvas'
import {useDrag} from '../useDrag'
import {unsignedMod} from '../util'
import FragmentString from './pad.frag'
import {type Channels, type ColorChannel, colorChannelToIndex} from './types'

interface Props {
	axes: [ColorChannel, ColorChannel]
	channels: Channels
}

const props = defineProps<Props>()

const emit = defineEmits<{
	updateChannels: [Partial<Channels>]
}>()

const $root = shallowRef<HTMLElement>()

let initialChannels: vec2
let isRelative = false

const {
	dragging: sliderTweaking,
	left,
	top,
	right,
	bottom,
	xy,
} = useDrag($root, {
	disableClick: true,
	onDragStart(_, event) {
		isRelative = event.target !== $root.value
		initialChannels = [
			props.channels[props.axes[0]],
			props.channels[props.axes[1]],
		]
	},
	onDrag({xy, initial, right, left, bottom, top, width, height}) {
		let chs: vec2.Mutable

		if (isRelative) {
			const deltaChs = vec2.div(vec2.sub(xy, initial), [width, -height])
			chs = [...vec2.add(initialChannels, deltaChs)]
		} else {
			chs = [...vec2.invlerp([left, bottom], [right, top], xy)]
		}

		for (let i = 0; i < 2; i++) {
			if (props.axes[i] === 'h') {
				chs[i] = unsignedMod(chs[i], 1)
			} else {
				chs[i] = scalar.clamp(chs[i], 0, 1)
			}
		}

		const newChannel: Partial<Channels> = {
			[props.axes[0]]: chs[0],
			[props.axes[1]]: chs[1],
		}

		emit('updateChannels', newChannel)
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
	const {h, s, v, a} = props.channels
	return {
		hsva: [h, s, v, a],
		axes: props.axes.map(colorChannelToIndex),
	}
})

const circleStyle = computed(() => {
	const x = props.channels[props.axes[0]]
	const y = props.channels[props.axes[1]]
	const {r, g, b} = props.channels

	const background = `rgba(${r * 255}, ${g * 255}, ${b * 255})`

	return {
		left: `${x * 100}%`,
		bottom: `${y * 100}%`,
		background,
	}
})
</script>

<template>
	<div
		ref="$root"
		class="InputColorChannelPad"
		:style="{cursor: tweakingInside ? 'none' : undefined}"
	>
		<GlslCanvas
			class="canvas"
			:fragmentString="FragmentString"
			:uniforms="uniforms"
		/>
		<div
			class="circle"
			:class="{tweaking: sliderTweaking}"
			:style="circleStyle"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputColorChannelPad
	position relative
	width 100%
	aspect-ratio 1

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
