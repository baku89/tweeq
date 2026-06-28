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
	min: 40,
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

// Which pane carries the stored size. In proportional mode it's always `first`
// (a percentage); in fixed mode it's whichever pane `fixed` names (in pixels).
const sizedPane = computed(() => props.fixed ?? 'first')

// Keep px and % under different keys so toggling the mode never reads one as the
// other (a stored 50% becoming 50px, say).
const size = appConfig.ref(
	props.fixed ? `${props.name}.px` : `${props.name}.width`,
	props.size
)

const sizeStyle = computed(() => {
	const cssProp = props.direction === 'horizontal' ? 'width' : 'height'
	const unit = props.fixed ? 'px' : '%'
	return {[cssProp]: `${size.value}${unit}`}
})

const firstStyle = computed(() =>
	sizedPane.value === 'first' ? sizeStyle.value : null
)
const secondStyle = computed(() =>
	sizedPane.value === 'second' ? sizeStyle.value : null
)

// Smallest pixel size the divider can drag the fixed pane down to.
const MIN_PX = 40

onMounted(() => {
	if (!$divider.value) return

	let draggingSize = 0

	Bndr.pointer($divider.value)
		.drag({pointerCapture: true})
		.on(({type, delta}) => {
			if (type === 'down') draggingSize = size.value

			const d = props.direction === 'horizontal' ? delta[0] : delta[1]

			if (props.fixed) {
				// Dragging toward the fixed pane grows it: +delta when it's on the
				// near (first) side of the divider, −delta when it's on the far side.
				const sign = props.fixed === 'first' ? 1 : -1
				draggingSize += sign * d
				size.value = clamp(
					draggingSize,
					MIN_PX,
					Math.max(MIN_PX, viewportSize.value - MIN_PX)
				)
			} else {
				draggingSize += (d / viewportSize.value) * 100
				size.value = clamp(draggingSize, 10, 90)
			}
		})
})
</script>

<template>
	<div
		ref="$root"
		class="TqPaneSplit"
		:class="[direction, {fixed: !!fixed}]"
		:style="{'--pane-min': min + 'px'}"
	>
		<div class="pane" :class="{grow: sizedPane !== 'first'}" :style="firstStyle">
			<div class="wrapper" :class="{scroll: scroll[0]}">
				<slot name="first" />
			</div>
		</div>
		<div ref="$divider" class="divider" />
		<div
			class="pane"
			:class="{grow: sizedPane !== 'second'}"
			:style="secondStyle"
		>
			<div class="wrapper" :class="{scroll: scroll[1]}">
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

.pane
	position relative
	width 100%
	height 100%
	// Kill the default `min-size: auto` so a pane can shrink below its content
	// (otherwise a tall/wide grow pane overflows and clips the sized pane to 0).
	min-width 0
	min-height 0
	// Sized pane: the inline style sets its main-axis size. It holds that size
	// and never grows…
	flex-grow 0
	flex-shrink 0

	// …but in fixed mode it yields once the grow pane would drop below --pane-min,
	// so the filling pane never disappears when the split gets small.
	.fixed > &:not(.grow)
		flex-shrink 1

	// Filling pane: basis 0 + grow takes whatever the sized pane leaves, and
	// keeps at least --pane-min on the main axis so it stays visible.
	&.grow
		flex-grow 1
		flex-shrink 1
		flex-basis 0

	.horizontal > &.grow
		min-width var(--pane-min)

	.vertical > &.grow
		min-height var(--pane-min)

.wrapper
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
