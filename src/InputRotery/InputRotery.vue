<script lang="ts" setup>
import {Path, Rect} from '@baku89/pave'
import {useFocus, useMagicKeys, useWindowSize} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {range} from 'lodash-es'
import {computed, ref, useTemplateRef, watch} from 'vue'

import {useMultiSelectStore} from '../stores/multiSelect'
import {useThemeStore} from '../stores/theme'
import {SvgIcon} from '../SvgIcon'
import type {InputEmits} from '../types'
import {useCopyPaste} from '../use/useCopyPaste'
import {useCursorStyle} from '../use/useCursorStyle'
import {useDrag} from '../use/useDrag'
import {useElementCenter} from '../use/useElementCenter'
import {unsignedMod} from '../util'
import * as V from '../validator'
import type {InputRoteryProps} from './types'
import {clampPosWithinRect} from './utils'

const props = withDefaults(defineProps<InputRoteryProps>(), {
	quantizeStep: 45,
	angleOffset: -90,
})

const theme = useThemeStore()

const model = defineModel<number>({required: true})

const emit = defineEmits<InputEmits>()

function signedAngleBetween(target: number, source: number) {
	const ret = target - source
	return unsignedMod(ret + 180, 360) - 180
}

const display = computed(() => {
	const revs = Math.trunc(model.value / 360)
	const rot = model.value - revs * 360

	return (revs !== 0 ? revs + 'x ' : '') + rot.toFixed(1) + '°'
})

const tweakMode = ref<'relative' | 'absolute'>('relative')

const initialValueOnTweak = ref(model.value)

const quantizeMeterRadii: vec2 = [theme.inputHeight * 4, 160]

const $root = useTemplateRef('$root')
const center = useElementCenter($root)

const {
	dragging: tweaking,
	initial,
	origin,
	xy,
} = useDrag($root, {
	dragDelaySeconds: 0,
	onDragStart({xy}) {
		initialValueOnTweak.value = local.value = model.value

		if (tweakMode.value === 'absolute') {
			const p = vec2.sub(xy, center.value)
			const angle = vec2.angle(p) - props.angleOffset
			const diff = signedAngleBetween(angle, local.value)

			local.value += diff
		}

		multi.capture()
	},
	onDrag({xy, previous}) {
		const p = vec2.sub(xy, center.value)
		const pp = vec2.sub(previous, center.value)

		const delta = vec2.angle(pp, p)
		local.value += delta
	},
	onDragEnd() {
		tweakMode.value = 'relative'

		emit('confirm')
		multi.confirm()
	},
})

const doQuantizeKey = useMagicKeys()['shift']

const doQuantize = computed(() => {
	const radius = vec2.dist(center.value, xy.value)
	return (
		doQuantizeKey.value ||
		(quantizeMeterRadii[0] <= radius && radius <= quantizeMeterRadii[1])
	)
})

// Local value before quantize
const local = ref(model.value)

const validate = computed(() => {
	return doQuantize.value ? V.quantize(props.quantizeStep) : V.identity
})

const validateResult = computed(() => validate.value(local.value))

watch(
	() =>
		[
			validateResult.value,
			tweaking.value,
			tweakMode.value,
			doQuantize.value,
			props.quantizeStep,
		] as const,
	([result]) => {
		if (result.value === undefined) return

		if (tweaking.value) {
			model.value = result.value
		}

		if (tweaking.value) {
			if (tweakMode.value === 'absolute') {
				multi.update(() => result.value)
			} else {
				const delta = result.value - initialValueOnTweak.value

				multi.update(x => {
					const newX = x + delta
					return doQuantize.value
						? scalar.quantize(newX, props.quantizeStep)
						: newX
				})
			}
		}
	},
	{flush: 'sync'}
)

useCursorStyle(() => (tweaking.value ? 'none' : null))

const roteryStyles = computed(() => {
	const rotation = model.value + props.angleOffset
	return {
		transform: `rotate(${rotation}deg)`,
	}
})

const windowSize = useWindowSize()

const overlayBounds = computed<Rect>(() => {
	const margin = 40
	const left = margin,
		top = margin,
		right = windowSize.width.value - margin,
		bottom = windowSize.height.value - margin

	return [
		[left, top],
		[right, bottom],
	]
})

const overlayLabelPos = computed(() => {
	return clampPosWithinRect(initial.value, xy.value, overlayBounds.value)
})

const overlayArrowStyles = computed(() => {
	const p = vec2.sub(xy.value, origin.value)
	const angle = vec2.angle(p) + 90

	return {
		transform: `rotate(${angle}deg)`,
	}
})

function radialLine(angle: number, innerRadius: number, outerRadius: number) {
	const a = angle + props.angleOffset
	return Path.line(
		vec2.dir(a, innerRadius, center.value),
		vec2.dir(a, outerRadius, center.value)
	)
}

const metersPath = computed(() =>
	Path.toSVGString(
		Path.merge(
			range(0, 360, props.quantizeStep).map(a =>
				radialLine(a, ...quantizeMeterRadii)
			)
		)
	)
)

const activeMeterPath = computed(() => {
	return Path.toSVGString(
		doQuantize.value && model.value % props.quantizeStep === 0
			? radialLine(model.value, ...quantizeMeterRadii)
			: Path.empty
	)
})

const overlayPath = computed(() => {
	const c = center.value

	if (tweakMode.value === 'absolute') {
		const dist = vec2.distance(center.value, xy.value)
		const angle = model.value

		const innerRadius = theme.inputHeight
		const outerRadius = dist

		return Path.toSVGString(radialLine(angle, innerRadius, outerRadius))
	} else {
		const baseRadius = theme.inputHeight * 4
		const radiusStep = theme.inputHeight * 0.25

		const start = initialValueOnTweak.value + props.angleOffset
		const end = model.value + props.angleOffset

		const turns =
			Math.floor(Math.abs(end - start) / 360) * Math.sign(end - start)

		// Create revolutions
		const revolutions = range(0, turns).map(i =>
			Path.circle(c, baseRadius + i * radiusStep)
		)

		// Create arc
		const arcRadius = baseRadius + turns * radiusStep

		let offsetInTurn = unsignedMod(signedAngleBetween(end, start), 360)
		if (end < start) {
			offsetInTurn -= 360
		}

		const startInTurn = unsignedMod(start, 360)
		const endInTurn = startInTurn + offsetInTurn

		const arc = Path.arc(c, arcRadius, startInTurn, endInTurn)

		return Path.toSVGString(Path.merge([...revolutions, arc]))
	}
})

//------------------------------------------------------------------------------
// Multi Select

const multi = useMultiSelectStore().register({
	type: 'number',
	el: $root,
	focusing: useFocus($root).focused,
	getValue: () => local.value,
	setValue(value) {
		local.value = value
	},
	confirm() {
		emit('confirm')
	},
})

//------------------------------------------------------------------------------
// Copy and paste

useCopyPaste({
	target: $root,
	onCopy() {
		navigator.clipboard.writeText(model.value.toString())
	},
	onPaste: async () => {
		const text = await navigator.clipboard.readText()
		if (!text) return

		const value = parseFloat(text)

		if (isNaN(value)) return

		model.value = value

		multi.update(() => value)
		multi.confirm()
	},
})
</script>

<template>
	<button
		ref="$root"
		class="InputRotery"
		:class="{tweaking, subfocus: multi.subfocus}"
		:tweak-mode="tweakMode"
		@focus="emit('focus')"
		@blur="emit('blur')"
	>
		<SvgIcon mode="block" class="rotery">
			<circle class="circle" cx="16" cy="16" r="16" />
			<g
				transform-origin="16 16"
				:style="roteryStyles"
				@pointerenter="tweakMode = 'absolute'"
				@pointerleave="!tweaking && (tweakMode = 'relative')"
			>
				<path
					class="absolute-mode-area"
					d="M 16 16 L 16 32 A 16 16 0 0 0 16 0 Z"
				/>
				<path class="tip" d="M20 16 L30 16" />
			</g>
			<circle cx="16" cy="16" r="7" fill="transparent" stroke="none" />
		</SvgIcon>
	</button>
	<div v-if="tweaking" class="overlay">
		<svg>
			<defs>
				<marker
					id="arrow"
					markerWidth="6"
					markerHeight="6"
					refX="3"
					refY="3"
					orient="auto"
					fill="var(--tq-color-accent)"
				>
					<path d="M 0 0 L 6 3 L 0 6 Z" />
				</marker>
			</defs>
			<path class="thin gray" :class="{quantize: doQuantize}" :d="metersPath" />
			<path
				class="bold"
				:d="overlayPath"
				:marker-end="tweakMode === 'relative' ? 'url(#arrow)' : ''"
			/>
			<path class="bold" :d="activeMeterPath" />
		</svg>
		<div
			ref="overlayLabel"
			class="overlay-label"
			:style="{
				top: overlayLabelPos[1] + 'px',
				left: overlayLabelPos[0] + 'px',
			}"
		>
			{{ display }}
			<span class="arrows" :style="overlayArrowStyles" />
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputRotery
	position relative
	display block
	width var(--tq-input-height)
	height var(--tq-input-height)
	z-index 1

	&:hover, &.tweaking
		z-index 2

		.rotery
			transform scale(1.8)

	&:focus-visible,
	&.subfocus
		&:before
			content ''
			position absolute
			inset -3px
			border-radius 50%
			border 1px solid var(--tq-color-accent-hover)


.rotery
	width var(--tq-input-height)
	height var(--tq-input-height)
	hover-transition(transform)

.circle
	fill var(--tq-color-accent)
	stroke none

	&:hover,
	.InputRotery:focus-visible &,
	.InputRotery[tweak-mode=relative] &
		fill var(--tq-color-accent-hover)

	.InputRotery[tweak-mode=absolute] &
		fill var(--tq-color-accent-soft)

.absolute-mode-area
	fill transparent
	stroke none

.tip
	transform-origin 16px 16px
	stroke var(--tq-color-input)
	stroke-width 3
	stroke-linecap round

	[tweak-mode=absolute] &
		stroke var(--tq-color-accent-hover)

.overlay
	input-overlay()

	.quantize
		stroke-width 2
		stroke var(--tq-color-accent-soft-hover) !important

.overlay-label
	tooltip-style()
	z-index 1001
	position fixed
	font-numeric()
	transform translate(-50%, -50%)
	white-space nowrap

	.arrows
		position absolute
		inset 0
		color var(--tq-color-accent)

		&:before, &:after
			position absolute
			top 50%
			display block
			width 1em
			font-size 14px
			text-align center
			font-weight normal
			transform translateY(-50%)

		&:before
			right 100%
			content '<'

		&:after
			left 100%
			content '>'
</style>
