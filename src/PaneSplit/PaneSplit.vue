<script setup lang="ts">
import {useElementSize} from '@vueuse/core'
import * as Bndr from 'bndr-js'
import {clamp} from 'lodash-es'
import {computed, onMounted, useTemplateRef} from 'vue'

import {useAppConfigStore} from '../stores/appConfig'
import {PaneSplitProps} from './types'

const props = withDefaults(defineProps<PaneSplitProps>(), {
	size: 50,
	scroll: () => [true, true],
})

const appConfig = useAppConfigStore()

const $root = useTemplateRef('$root')
const $divider = useTemplateRef('$divider')

const rootSize = useElementSize($root)

const viewportSize = computed(() => {
	return props.direction === 'horizontal'
		? rootSize.width.value
		: rootSize.height.value
})

const width = appConfig.ref(`${props.name}.width`, props.size)

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
		.on(({type, delta}) => {
			if (type === 'down') draggingSize = width.value

			const d = props.direction === 'horizontal' ? delta[0] : delta[1]

			draggingSize += (d / viewportSize.value) * 100

			width.value = clamp(draggingSize, 10, 90)
		})
})
</script>

<template>
	<div ref="$root" class="TqPaneSplit" :class="direction">
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

.TqPaneSplit
	position relative
	display flex
	width 100%
	height 100%

	&.vertical
		flex-direction column

.first, .second
	width 100%
	height 100%
	position relative

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
	background var(--tq-color-border)
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
		background var(--tq-color-accent)

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
			background-image linear-gradient(to left, var(--tq-color-accent),  var(--tq-color-accent))
			background-size 5px 100%

		.vertical > &
			top -8px
			bottom -8px
			background-image linear-gradient(to bottom, var(--tq-color-accent),  var(--tq-color-accent))
			background-size 100% 5px

	&:hover:before
		opacity 1
</style>
../stores/useAppStorage
