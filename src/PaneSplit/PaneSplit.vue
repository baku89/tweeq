<script setup lang="ts">
import {Bndr} from 'bndr-js'
import {clamp} from 'lodash'
import {computed, onMounted, ref} from 'vue'

import {useAppConfigStore} from '../stores/appConfig'

interface Props {
	name: string
	direction: 'horizontal' | 'vertical'
	size?: number
	scroll?: [boolean, boolean]
}

const props = withDefaults(defineProps<Props>(), {
	size: 50,
	scroll: () => [true, true],
})

const appConfig = useAppConfigStore()

const viewportSize = computed(() => {
	return props.direction === 'horizontal'
		? window.innerWidth
		: window.innerHeight
})

const width = appConfig.ref(`${props.name}.width`, props.size)

const $divider = ref<HTMLElement | null>(null)

const styles = computed(() => {
	const cssProp = props.direction === 'horizontal' ? 'width' : 'height'

	return {
		[cssProp]: `${width.value}%`,
	}
})

onMounted(() => {
	if (!$divider.value) return

	let draggingSize = 0

	Bndr.pointer($divider.value)
		.drag({pointerCapture: true})
		.on(({justStarted, delta}) => {
			if (justStarted) draggingSize = width.value

			const d = props.direction === 'horizontal' ? delta[0] : delta[1]

			draggingSize += (d / viewportSize.value) * 100

			width.value = clamp(draggingSize, 10, 90)
		})
})
</script>

<template>
	<div class="PaneSplit" :class="direction">
		<div class="first" :style="styles">
			<div class="first-wrapper" :class="{scroll: scroll[0]}">
				<slot name="first" />
			</div>
		</div>
		<div ref="$divider" class="divider" />
		<div class="second-wrapper" :class="{scroll: scroll[1]}">
			<div class="second">
				<slot name="second" />
			</div>
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.PaneSplit
	position relative
	display flex
	width 100%
	height 100%

	&.vertical
		flex-direction column

.first, .second
	width 100%
	height 100%

.first
	flex-grow 0
	flex-shrink 0
.second
	flex-grow 1

.first-wrapper, .second-wrapper
	width 100%
	height 100%
	overflow hidden

	&.scroll
		overflow-y scroll

.divider
	position relative
	background var(--tq-color-surface-border)
	hover-transition(background)
	z-index 10

	.horizontal > &
		cursor col-resize
		width 1px
		height 100%

	.vertical > &
		cursor row-resize
		width 100%
		height 1px

	&:hover
		background var(--tq-color-primary)

	&:before
		content ''
		position absolute
		inset 0
		opacity 0
		background-position 50% 50%
		background-repeat no-repeat
		hover-transition(opacity)

		.horizontal > &
			left -8px
			right -8px
			background-image linear-gradient(to left, var(--tq-color-primary),  var(--tq-color-primary))
			background-size 5px 100%

		.vertical > &
			top -8px
			bottom -8px
			background-image linear-gradient(to bottom, var(--tq-color-primary),  var(--tq-color-primary))
			background-size 100% 5px

	&:hover:before
		opacity 1
</style>
../stores/useAppStorage
