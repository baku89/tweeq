<script lang="ts" setup>
import {Path} from '@baku89/pave'
import {useMagicKeys} from '@vueuse/core'
import {checkIntersection} from 'line-intersect'
import {scalar, vec2} from 'linearly'
import {partial, range} from 'lodash-es'
import {computed, ref, shallowRef} from 'vue'

import {useThemeStore} from '../stores/theme'
import {SvgIcon} from '../SvgIcon'
import type {InputEmits} from '../types'
import {useCursorStyle} from '../use/useCursorStyle'
import {useElementCenter} from '../use/useElementCenter'
import {useDrag} from '../useDrag'
import {unsignedMod} from '../util'
import type {InputRoteryProps} from './types'

const props = withDefaults(defineProps<InputRoteryProps>(), {quantizeStep: 45})

const theme = useThemeStore()

const emit = defineEmits<InputEmits<number>>()

defineOptions({
	inheritAttrs: false,
})

function signedAngleBetween(target: number, source: number) {
	const ret = target - source
	return unsignedMod(ret + 180, 360) - 180
}

const local = ref(props.modelValue)

const display = computed(() => {
	const revs = Math.trunc(props.modelValue / 360)
	const rot = props.modelValue - revs * 360

	return (revs !== 0 ? revs + 'x ' : '') + rot.toFixed(1) + '°'
})

const $el = shallowRef<null | HTMLElement>(null)

const tweakMode = ref<'relative' | 'absolute'>('relative')

const valueOnTweak = ref(props.modelValue)

const center = useElementCenter($el)

const quantizeMeterRadii: vec2 = [theme.inputHeight * 4, 160]

// Local value before quantize
let localRaw = props.modelValue

const {
	dragging: tweaking,
	initial,
	origin,
	xy,
} = useDrag($el, {
	dragDelaySeconds: 0,
	onDragStart({xy}) {
		valueOnTweak.value = localRaw = props.modelValue

		if (tweakMode.value === 'absolute') {
			const p = vec2.sub(xy, center.value)
			const angle = vec2.angle(p)
			const diff = signedAngleBetween(angle, localRaw)

			localRaw += diff
		}
	},
	onDrag({xy, previous}) {
		const p = vec2.sub(xy, center.value)
		const pp = vec2.sub(previous, center.value)

		const delta = vec2.angle(pp, p)
		localRaw += delta

		local.value = localRaw

		if (doQuantize.value) {
			local.value = scalar.quantize(local.value, props.quantizeStep)
		}

		emit('update:modelValue', local.value)
	},
	onDragEnd() {
		tweakMode.value = 'relative'

		emit('confirm')
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

useCursorStyle(() => (tweaking.value ? 'none' : null))

function clampPos(p: vec2): vec2 {
	const [ox, oy] = initial.value
	const [x, y] = p
	const margin = 40
	const left = margin,
		top = margin,
		right = window.innerWidth - margin,
		bottom = window.innerHeight - margin

	let ret: ReturnType<typeof checkIntersection>

	const check = partial(checkIntersection, x, y, ox, oy)

	if ((ret = check(left, top, right, top)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	if ((ret = check(right, top, right, bottom)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	if ((ret = check(right, bottom, left, bottom)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	if ((ret = check(left, bottom, left, top)).type === 'intersecting') {
		return [ret.point.x, ret.point.y]
	}

	return [x, y]
}

const overlayLabelPos = computed(() => {
	return clampPos(xy.value)
})

const overlayArrowAngle = computed(() => {
	const p = vec2.sub(xy.value, origin.value)
	return vec2.angle(p) + 90
})

function radialLine(angle: number, innerRadius: number, outerRadius: number) {
	return Path.line(
		vec2.dir(angle, innerRadius, center.value),
		vec2.dir(angle, outerRadius, center.value)
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
		doQuantize.value && local.value % props.quantizeStep === 0
			? radialLine(local.value, ...quantizeMeterRadii)
			: Path.empty
	)
})

const overlayPath = computed(() => {
	const c = center.value

	if (tweakMode.value === 'absolute') {
		const dist = vec2.distance(center.value, xy.value)
		const to = vec2.dir(props.modelValue, dist, center.value)

		const innerRadius = theme.inputHeight
		const dir = vec2.normalize(vec2.sub(to, c))
		const from = vec2.scaleAndAdd(c, dir, innerRadius)

		return Path.toSVGString(Path.line(from, to))
	} else {
		const baseRadius = theme.inputHeight * 4
		const radiusStep = theme.inputHeight * 0.25

		const start = valueOnTweak.value
		const end = props.modelValue

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
</script>

<template>
	<button
		ref="$el"
		class="InputRotery"
		:class="{tweaking}"
		:tweak-mode="tweakMode"
		v-bind="$attrs"
	>
		<SvgIcon mode="block" class="rotery">
			<circle class="circle" cx="16" cy="16" r="15" />
			<g
				transform-origin="16 16"
				:style="{transform: `rotate(${props.modelValue}deg)`}"
				@pointerenter="tweakMode = 'absolute'"
				@pointerleave="!tweaking && (tweakMode = 'relative')"
			>
				<path
					class="absolute-mode-area"
					d="M 16 16 L 16 32 A 16 16 0 0 0 16 0 Z"
				/>
				<path class="tip" d="M20 16 L30 16" />
			</g>
		</SvgIcon>
	</button>
	<div v-if="tweaking" class="overlay">
		<svg>
			<path class="thin gray" :class="{quantize: doQuantize}" :d="metersPath" />
			<path class="bold" :d="overlayPath" />
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
			<span
				class="arrows"
				:style="{
					transform: `rotate(${overlayArrowAngle}deg)`,
				}"
			/>
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputRotery
	position relative
	display block
	overflow hidden
	width var(--tq-input-height)
	height var(--tq-input-height)
	hover-transition(transform)
	z-index 1

	&:hover, &:focus-visible, &.tweaking
		transform scale(3)

.rotery
	width var(--tq-input-height)
	height var(--tq-input-height)


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
