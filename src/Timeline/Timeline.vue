<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import {Bndr} from 'bndr-js'
import {scalar} from 'linearly'
import {clamp} from 'lodash'
import {computed, ref, watch, watchEffect} from 'vue'

import {useBndr} from '../useBndr'
import {toPercent} from '../util'

interface Props {
	visibleRegion?: {left: number; width: number}
	visibleArea?: {left: number; width: number}
}

const props = defineProps<Props>()

defineSlots<{
	default: void
	scrollbarRight: void
}>()

watch(
	() => props.visibleRegion,
	region => {
		if (region !== undefined) {
			if (region.left < scroll.value) {
				setScroll(region.left)
			} else if (
				region.left + region.width >
				scroll.value + containerWidth.value
			) {
				setScroll(region.left + region.width - containerWidth.value)
			}
		}
	},
	{flush: 'pre'}
)

const emit = defineEmits<{
	zoomHorizontal: [factor: number]
	'update:visibleArea': [area: {left: number; width: number}]
}>()

const $root = ref<null | HTMLElement>(null)
const {width: containerWidth} = useElementSize($root)

const $content = ref<null | HTMLElement>(null)
const {width: contentWidth} = useElementSize($content)

const $knob = ref<null | HTMLElement>(null)

const $scrollbar = ref<null | HTMLElement>(null)
const {width: scrollbarWidth} = useElementSize($scrollbar)

const scrollMax = computed(() => {
	return contentWidth.value - containerWidth.value
})

const scroll = ref(0)
function setScroll(value: number) {
	scroll.value = clamp(value, 0, scrollMax.value)
}

watchEffect(() => {
	setScroll(scroll.value)
})

useBndr($root, $root => {
	const pointer = Bndr.pointer($root)
	const pointerScroll = pointer.scroll()

	// const center = pointer.position({coordinate: 'offset'}).map(([x]) => x)

	const altPressed = Bndr.keyboard().pressed('alt')

	pointerScroll.on(([x]) => {
		setScroll(scroll.value + x)
	})

	pointerScroll.while(altPressed, false).on(([, y]) => {
		const s = 1.003
		emit('zoomHorizontal', s ** y)
	})
})

useBndr($knob, $bar => {
	const pointer = Bndr.pointer($bar)

	pointer.drag({pointerCapture: true}).on(d => {
		const dx = d.delta[0] / scrollbarWidth.value
		const w = containerWidth.value / contentWidth.value

		setScroll(scroll.value + (dx / (1 - w)) * scrollMax.value)
	})
})

const contentStyles = computed(() => {
	return {
		transform: `translateX(${-scroll.value}px)`,
	}
})

const barStyles = computed(() => {
	const width = containerWidth.value / contentWidth.value
	const left = scalar.fit(scroll.value, 0, scrollMax.value, 0, 1 - width)

	return {
		width: toPercent(Math.min(width, 1)),
		left: toPercent(left),
	}
})

watchEffect(() => {
	const left = scroll.value
	const width = containerWidth.value
	emit('update:visibleArea', {left, width})
})
</script>

<template>
	<div class="TqTimeline">
		<div ref="$root" class="content-wrapper">
			<div ref="$content" class="content" :style="contentStyles">
				<slot />
			</div>
		</div>
		<div class="scrollbar-wrapper">
			<div ref="$scrollbar" class="scrollbar">
				<div ref="$knob" class="knob" :style="barStyles" />
			</div>
			<div class="scrollbar-right">
				<slot name="scrollbarRight" />
			</div>
		</div>
	</div>
</template>

<style scoped lang="stylus">
@import '../common.styl'

.TqTimeline
	--tq-input-height 20px
	--tq-input-border-radius 10px

	position relative
	display grid
	grid-template-rows 1fr var(--tq-input-height) 3px
	overflow hidden

.content-wrapper
	width 100%
	position relative
	overflow hidden

.content
	position relative
	width min-content
	height 100%
	overflow hidden

.scrollbar-wrapper
	display grid
	grid-template-columns 1fr min-content
	gap 9px


.scrollbar
	position relative

.knob
	position absolute
	top 2px
	width 20%
	height 100%
	border-radius 9999px
	background 'color-mix(in srgb, var(--tq-color-on-background) 20%, transparent)' % ''
	opacity .4
	hover-transition(opacity)

	&:hover
		opacity 1

.scrollbar-right
	height 100%
</style>
