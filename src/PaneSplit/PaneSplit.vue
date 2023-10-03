<script setup lang="ts">
import * as Bndr from 'bndr-js'
import {clamp} from 'lodash'
import {computed, onMounted, ref} from 'vue'

import {useAppStorage} from '../useAppStorage'

interface Props {
	name: string
	direction: 'horizontal' | 'vertical'
	size?: number
}

const props = withDefaults(defineProps<Props>(), {
	size: 50,
})

const appStorage = useAppStorage()

const viewportSize = computed(() => {
	return props.direction === 'horizontal'
		? window.innerWidth
		: window.innerHeight
})

const firstSize = appStorage(`${props.name}.width`, props.size)

const $divider = ref<HTMLElement | null>(null)

const styles = computed(() => {
	const cssProp = props.direction === 'horizontal' ? 'width' : 'height'

	return {
		[cssProp]: `${firstSize.value}%`,
	}
})

onMounted(() => {
	if (!$divider.value) return

	Bndr.pointer($divider.value)
		.drag({
			pointerCapture: true,
			preventDefault: true,
		})
		.on(({delta}) => {
			const d = props.direction === 'horizontal' ? delta[0] : delta[1]

			const size = firstSize.value + (d / viewportSize.value) * 100

			firstSize.value = clamp(size, 10, 90)
		})
})
</script>

<template>
	<div class="PaneSplit" :class="direction">
		<div class="first" :style="styles">
			<slot name="first" />
		</div>
		<div ref="$divider" class="divider" />
		<div class="second">
			<slot name="second" />
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

.first
	flex-grow 0
	flex-shrink 0
.second
	flex-grow 1

.divider
	position relative
	background var(--tq-color-pane-border)
	hover-transition(background)

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
