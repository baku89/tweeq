<script setup lang="ts">
import {useElementBounding} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {scalar, vec2} from 'linearly'
import {clamp} from 'lodash-es'
import {computed, shallowRef, useTemplateRef, watch} from 'vue'

import {useBndr} from '../use/useBndr'
import {toPercent} from '../util'
import type {TimelineProps} from './types'

const props = withDefaults(defineProps<TimelineProps>(), {
	frameWidth: 60,
	frameWidthRange: () => [10, 100],
})

defineSlots<{
	default(props: {
		range: vec2
		visibleFrameRange: vec2
		rangeStyle: (range: vec2 | number) => any
		offsetStyle: (offset: number) => any
	}): void
	scrollbarRight: void
}>()

const range = shallowRef<vec2>(props.frameRange ?? [0, 1])

const visibleFrameRange = computed<vec2>(() => {
	const [startFrame, endFrame] = props.frameRange
	const [start, end] = range.value
	return [
		Math.max(Math.floor(start), startFrame),
		Math.min(Math.ceil(end), endFrame),
	]
})

const emit = defineEmits<{
	'update:frameWidth': [number]
}>()

const $root = useTemplateRef('$root')
const {width: containerWidth} = useElementBounding($root)

useBndr($root, $root => {
	const pointer = Bndr.pointer($root)
	const pointerScroll = pointer.scroll()

	const center = pointer.position({coordinate: 'offset'}).map(([x]) => x)

	const altPressed = Bndr.keyboard().pressed('option')

	pointerScroll.on(([x, y]) => {
		if (altPressed.value) {
			// Zoom in/out
			let zoomDelta = 1.003 ** y

			const newFrameWidth = clamp(
				props.frameWidth * zoomDelta,
				...props.frameWidthRange
			)

			zoomDelta = newFrameWidth / props.frameWidth

			const [start, end] = range.value

			const origin = scalar.fit(
				center.value ?? 0,
				0,
				containerWidth.value,
				start,
				end
			)

			emit('update:frameWidth', newFrameWidth)

			// Scales the range around the center point
			range.value = [
				origin - (origin - start) / zoomDelta,
				origin + (end - origin) / zoomDelta,
			]
		} else {
			const delta = x / props.frameWidth
			range.value = vec2.add(range.value, [delta, delta])
		}
	})
})

const barStyles = computed(() => {
	const width =
		(range.value[1] - range.value[0]) /
		(props.frameRange[1] - props.frameRange[0])

	const left = scalar.invlerp(
		props.frameRange[0],
		props.frameRange[1],
		range.value[0]
	)

	return {
		width: toPercent(Math.min(width, 1)),
		left: toPercent(left),
	}
})

watch(
	() => [containerWidth.value, props.frameWidth] as const,
	([w, ppu]) => {
		const [start] = range.value

		range.value = [start, start + w / ppu]
	}
)

function showRange(showRange: vec2 | number) {
	const [min, max] =
		typeof showRange === 'number' ? [showRange, showRange + 1] : showRange

	const duration = range.value[1] - range.value[0]

	if (min < range.value[0] && range.value[1] < max) {
		// 両方はみ出している場合、そのまま設定

		range.value = [min, max]
	} else if (min < range.value[0]) {
		// 左がはみ出している場合、左を基準にする

		range.value = [min, min + duration]
	} else if (range.value[1] < max) {
		// 右がはみ出している場合、右を基準にする

		range.value = [max - duration, max]
	}
}

defineExpose({
	showRange,
})

function toOffset(frame: number) {
	return (frame - range.value[0]) * props.frameWidth
}

function rangeStyle(range: number | vec2) {
	const [start, end] = typeof range === 'number' ? [range, range + 1] : range

	const x = toOffset(start)
	const width = (end - start + 1) * props.frameWidth

	return {
		transform: `translateX(${x}px)`,
		width: `${width}px`,
	}
}

function offsetStyle(offset: number) {
	const x = toOffset(offset)

	return {
		transform: `translateX(${x}px)`,
	}
}
</script>

<template>
	<div class="TqTimeline">
		<div class="container">
			<div ref="$root" class="fixed">
				<slot
					:range="range"
					:visibleFrameRange="visibleFrameRange"
					:rangeStyle="rangeStyle"
					:offsetStyle="offsetStyle"
				/>
			</div>
		</div>
		<div ref="$scrollbar" class="scrollbar">
			<div ref="$knob" class="knob" :style="barStyles" />
		</div>
	</div>
</template>

<style scoped lang="stylus">
@import '../common.styl'

.TqTimeline
	position relative
	display grid
	grid-template-rows 1fr var(--tq-scrollbar-width) 2px
	overflow hidden

.container
	position relative
	overflow hidden
	width 100%
	height 100%


.fixed
	position absolute
	inset 0


.scrollbar
	position relative

.knob
	position absolute
	height 100%
	border-radius 9999px
	background 'color-mix(in srgb, var(--tq-color-text) 20%, transparent)' % ''
</style>
