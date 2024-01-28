<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {scalar} from 'linearly'
import {clamp} from 'lodash'
import {computed, ref, watch} from 'vue'

import {useBndr} from '../useBndr'
import {toPercent} from '../util'

interface Props {
	scroll: number
}

const props = defineProps<Props>()

defineSlots<{
	default: void
	fixed: void
	scrollbarRight: void
}>()

const emit = defineEmits<{
	'update:scroll': [number]
	zoom: [{origin: number; zoomDelta: number}]
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

watch(
	() => [props.scroll, scrollMax.value] as const,
	([scroll, scrollMax]) => {
		const clamped = clamp(scroll, 0, scrollMax)
		if (clamped !== props.scroll) {
			emit('update:scroll', clamped)
		}
	},
	{flush: 'sync'}
)

function scrollTo(value: number) {
	const left = clamp(value, 0, scrollMax.value)
	emit('update:scroll', left)
}
function scrollBy(value: number) {
	scrollTo(props.scroll + value)
}

useBndr($root, $root => {
	const pointer = Bndr.pointer($root)
	const pointerScroll = pointer.scroll()

	const center = pointer.position({coordinate: 'offset'}).map(([x]) => x)

	const altPressed = Bndr.keyboard().pressed('alt')

	pointerScroll.on(([x, y]) => {
		if (altPressed.value) {
			let origin = props.scroll + (center.value ?? 0)
			const zoomDelta = 1.003 ** y
			origin = clamp(origin, 0, scrollMax.value * zoomDelta)
			emit('zoom', {origin, zoomDelta})
		} else {
			scrollBy(x)
		}
	})
})

useBndr($knob, $bar => {
	const pointer = Bndr.pointer($bar)

	pointer.drag({pointerCapture: true}).on(d => {
		const dx = d.delta[0] / scrollbarWidth.value
		const w = containerWidth.value / contentWidth.value

		scrollBy((dx / (1 - w)) * scrollMax.value)
	})
})

const contentStyles = computed(() => {
	return {
		transform: `translateX(${-props.scroll}px)`,
	}
})

const barStyles = computed(() => {
	const width = containerWidth.value / contentWidth.value
	const left = scalar.fit(props.scroll, 0, scrollMax.value, 0, 1 - width)

	return {
		width: toPercent(Math.min(width, 1)),
		left: toPercent(left),
	}
})

watch(
	() => containerWidth.value,
	() => {
		if (props.scroll > scrollMax.value) {
			scrollTo(scrollMax.value)
		}
	}
)

function showRegion({left, width}: {left: number; width: number}) {
	if (left < props.scroll) {
		scrollTo(left)
	} else if (left + width > props.scroll + containerWidth.value) {
		scrollTo(left + width - containerWidth.value)
	}
}

defineExpose({
	showRegion,
	containerWidth,
})
</script>

<template>
	<div class="TqTimeline">
		<div ref="$root" class="content-wrapper">
			<div ref="$content" class="content" :style="contentStyles">
				<slot />
			</div>
			<div class="fixed-wrapper">
				<slot name="fixed" />
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

.fixed-wrapper
	position absolute
	inset 0
	pointer-events none

	& > :deep(*)
		pointer-events auto

.scrollbar-right
	height 100%
</style>
