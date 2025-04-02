<script setup lang="ts">
import {useMagicKeys, useRafFn} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {computed, ref, useTemplateRef} from 'vue'

import {Icon} from '../Icon'
import {InputPositionProps} from '../InputPosition'
import {Tooltip} from '../Tooltip'
import {InputEmits} from '../types'
import {useDrag} from '../use/useDrag'
import {precisionOf} from '../util'

const model = defineModel<vec2>({required: true})

const props = withDefaults(
	defineProps<InputPositionProps & {showOverlayLabel?: boolean}>(),
	{
		showOverlayLabel: true,
	}
)
const emit = defineEmits<InputEmits>()

const $button = useTemplateRef('$button')

const {shift, alt, x, y} = useMagicKeys()

const min = computed(() => decompose(props.min))
const max = computed(() => decompose(props.max))

const speed = computed(() => {
	if (shift.value) return 5
	if (alt.value) return 0.1
	return 1
})

const gridScale = computed(() => {
	if (shift.value) return 0.5
	if (alt.value) return 4
	return 2
})

const gridScaleAnimated = ref(1)
useRafFn(() => {
	gridScaleAnimated.value = scalar.lerp(
		gridScaleAnimated.value,
		gridScale.value,
		0.4
	)
})

const precision = computed(() => {
	return precisionOf(speed.value)
})

const overlayLabelValues = computed(() => {
	const xd = model.value[0].toFixed(precision.value)
	const yd = model.value[1].toFixed(precision.value)

	return [xd, yd]
})

const {dragging: tweaking} = useDrag($button, {
	lockPointer: true,
	dragDelaySeconds: 0,
	onDragStart() {
		emit('focus')
	},
	onDrag({delta}) {
		const modelDelta = vec2.scale(delta, speed.value) as vec2.Mutable

		if (x.value) {
			modelDelta[1] = 0
		}

		if (y.value) {
			modelDelta[0] = 0
		}

		model.value = vec2.clamp(
			vec2.add(model.value, modelDelta),
			min.value ?? [-Infinity, -Infinity],
			max.value ?? [Infinity, Infinity]
		)
	},
	onDragEnd() {
		emit('confirm')
		emit('blur')
	},
})

const overlayStyles = computed(() => {
	const center: vec2 = [150, 150]
	const scale = gridScaleAnimated.value

	const size = 10 * scale
	const offset = vec2.add(center, vec2.scale(model.value, -scale))

	return {
		backgroundSize: `${size}px ${size}px`,
		backgroundPosition: `${offset[0] - 1}px ${offset[1] - 1}px`,
	}
})

const zeroStyle = computed(() => {
	const center: vec2 = [150, 150]
	const scale = gridScaleAnimated.value

	const start = vec2.add(
		center,
		vec2.scale(vec2.sub(model.value, min.value ?? [-9999, -9999]), -scale)
	)
	const end = vec2.add(
		center,
		vec2.scale(vec2.sub(model.value, max.value ?? [9999, 9999]), -scale)
	)

	const size = vec2.sub(end, start)

	return {
		left: `${start[0]}px`,
		top: `${start[1]}px`,
		width: `${size[0]}px`,
		height: `${size[1]}px`,
	}
})

function decompose(value?: number | vec2): vec2 | undefined {
	if (value === undefined) return undefined

	if (typeof value === 'number') {
		return [value, value]
	}

	return value
}
</script>

<template>
	<button ref="$button" class="TqInputTranslate">
		<Icon class="grid-icon" icon="mingcute:dot-grid-fill" />
		<Transition>
			<div v-if="tweaking" class="overlay">
				<div class="overlay-grid" :style="overlayStyles">
					<div v-if="x" class="axis x" />
					<div v-if="y" class="axis y" />
					<div class="zero" :style="zeroStyle" />
				</div>
				<Tooltip v-if="showOverlayLabel" class="overlay-label">
					<label>X</label>
					{{ overlayLabelValues[0] }}
					<label>Y</label>
					{{ overlayLabelValues[1] }}
				</Tooltip>
			</div>
		</Transition>
	</button>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputTranslate
	z-index 1
	position relative
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	background var(--tq-color-accent)
	display flex
	align-items center
	justify-content center

	&:focus-visible
		button-focus-style()

	&:hover
		background var(--tq-color-accent-hover)

.grid-icon
	color var(--tq-color-on-accent)
	margin calc((var(--tq-input-height) - var(--tq-icon-size)) / 2)
	z-index 1

.overlay
	pointer-events none
	transition-duration var(--tq-hover-transition-duration)

.overlay-grid
	position absolute
	inset calc(-150px + var(--tq-input-height) / 2)

	background-image radial-gradient(circle at 1px 1px, var(--tq-color-text-subtle) 1px, transparent 1px)
	background-repeat repeat
	mask radial-gradient(closest-side, black 50%, transparent 100%)
	hover-transition(transform)

	.v-enter-from &,
	.v-leave-to &
		transform scale(0)

.overlay-label
	position absolute
	top 0
	left 50%
	tab-size 4
	white-space pre
	transform translate(-50%, calc(-100% - var(--tq-input-height) * .2))
	hover-transition(transform, opacity)

	.v-enter-from &,
	.v-leave-to &
		opacity 0
		transform translate(-50%, calc(-100% - var(--tq-input-height) * 0)) scale(.5)

	:deep(i)
		color var(--tq-color-text-mute)

.axis
	position absolute
	background var(--tq-color-accent)

	&.x
		top calc(50% - 1px)
		left 0
		width 100%
		height 2px

	&.y
		top 0
		left calc(50% - 1px)
		width 2px
		height 100%

.zero
	position absolute
	border 1px solid var(--tq-color-accent)
	outline 1px solid var(--tq-color-accent)
</style>
