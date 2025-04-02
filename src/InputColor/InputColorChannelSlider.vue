<script lang="ts" setup>
import {Rect} from '@baku89/pave'
import {scalar} from 'linearly'
import {computed, useTemplateRef} from 'vue'

import {GlslCanvas} from '../GlslCanvas'
import {useDrag} from '../use/useDrag'
import {toPercent} from '../util'
import SliderFragmentString from './slider.frag'
import {type ColorChannel, colorChannelToIndex, type HSVA} from './types'
import {
	getHSVAChannel,
	hsva2hex,
	setHSVAChannel,
	tweakHSVAChannel,
} from './utils'

interface Props {
	modelValue: HSVA
	axis: ColorChannel
}

const props = defineProps<Props>()

const emit = defineEmits<{
	'update:modelValue': [HSVA]
}>()

const $root = useTemplateRef('$root')

let local: HSVA

const {
	dragging: sliderTweaking,
	left,
	right,
	top,
	bottom,
	xy,
} = useDrag($root, {
	dragDelaySeconds: 0,
	onDragStart({xy: [x], left, right}, event) {
		local = props.modelValue

		const isAbsolute = event.target === $root.value

		if (isAbsolute) {
			const value = scalar.invlerp(left, right, x)

			local = setHSVAChannel(local, props.axis, value)
			emit('update:modelValue', local)
		}
	},
	onDrag({xy: [x], initial: [ix], width}) {
		let newLocal = {...local}

		const delta = (x - ix) / width

		newLocal = tweakHSVAChannel(newLocal, props.axis, delta)

		emit('update:modelValue', newLocal)
	},
})

const tweakingInside = computed(() => {
	const bound: Rect = [
		[left.value, top.value],
		[right.value, bottom.value],
	]

	return sliderTweaking.value && Rect.containsPoint(bound, xy.value)
})

const uniforms = computed(() => {
	const {a, h, s, v} = props.modelValue
	return {
		hsva: [h, s, v, a],
		axis: colorChannelToIndex(props.axis),
		offset: 0,
	}
})

const circleStyle = computed(() => {
	const t = getHSVAChannel(props.modelValue, props.axis)

	return {
		left: toPercent(t),
		background: hsva2hex({...props.modelValue, a: 1}),
	}
})
</script>

<template>
	<div
		ref="$root"
		class="TqInputColorChannelSlider"
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

.TqInputColorChannelSlider
	position relative
	width 100%
	height calc(0.7 * var(--tq-input-height))

.canvas
	position absolute
	width 100%
	height 100%
	border-radius var(--tq-radius-input)
	background-checkerboard(transparent)

.circle
	circle()
	z-index 1
</style>
