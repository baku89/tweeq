<script lang="ts" setup>
import {type CubicBezierPoints} from '@vueuse/core'
import {vec2} from 'linearly'
import {computed, ref, useTemplateRef} from 'vue'

import {useDrag} from '../use/useDrag'
import type {InputCubicBezierProps} from './types'
import {type CubicBezierValue} from './util'

const props = defineProps<InputCubicBezierProps>()

const emit = defineEmits<{
	'update:modelValue': [CubicBezierValue]
}>()

const $editor = useTemplateRef('$editor')

useDrag($editor, {
	onDrag({xy, left, right, top, bottom}) {
		if (draggingPoint.value === null) return

		const uv = vec2.invlerp([left, bottom], [right, top], xy)
		const [x, y] = vec2.clamp(uv, [0, 0], [1, 1])

		const newValue: CubicBezierPoints = [...props.modelValue]

		newValue[draggingPoint.value * 2 + 0] = x
		newValue[draggingPoint.value * 2 + 1] = y

		emit('update:modelValue', newValue)
	},
	onDragEnd() {
		draggingPoint.value = null
	},
})

const easingPath = computed(() => {
	const [x1, y1, x2, y2] = props.modelValue
	return `M 0,0 C ${x1},${y1} ${x2},${y2} 1,1`
})

const x1 = computed(() => props.modelValue[0])
const y1 = computed(() => props.modelValue[1])
const x2 = computed(() => props.modelValue[2])
const y2 = computed(() => props.modelValue[3])

const draggingPoint = ref<number | null>(null)
</script>

<template>
	<div class="InputCubicBezierPicker">
		<svg ref="$editor" viewBox="0 0 1 1" class="pad">
			<g>
				<line :x1="0" :y1="0" :x2="x1" :y2="y1" />
				<line :x1="1" :y1="1" :x2="x2" :y2="y2" />
				<path :d="easingPath" />
				<circle :cx="x1" :cy="y1" r=".035" @mousedown="draggingPoint = 0" />
				<circle :cx="x2" :cy="y2" r=".035" @mousedown="draggingPoint = 1" />
			</g>
		</svg>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.pad
	overflow visible
	width 100%

	*
		vector-effect non-scaling-stroke

	g
		transform scaleY(-1)
		transform-origin 50% 50%

	path, line, circle
		fill none
		stroke-linecap round

	path, circle
		stroke-width 2
		stroke var(--tq-color-accent)

	line
		stroke-width 1
		stroke var(--tq-color-accent)

	circle
		fill var(--tq-color-background)
		hover-transition(fill, stroke)

		&:hover
			fill var(--tq-color-accent)
			stroke var(--tq-color-accent)
</style>
