<script lang="ts" setup>
import {useMagicKeys} from '@vueuse/core'
import chroma from 'chroma-js'
import {vec2} from 'linearly'
import {clamp} from 'lodash-es'
import {computed, ref, shallowRef, watchEffect} from 'vue'

import {GlslCanvas} from '../GlslCanvas'
import {Popover} from '../Popover'
import {useDrag} from '../useDrag'
import {unsignedMod} from '../util'
import InputColorPicker from './InputColorPicker.vue'
import PadFragmentString from './pad.frag'
import SliderFragmentString from './slider.frag'
import {
	ColorChannel,
	colorChannelToIndex,
	hsv2rgb,
	type InputColorProps,
	rgb2hsv,
} from './types'
import WheelFragmentString from './wheel.frag'

const props = withDefaults(defineProps<InputColorProps>(), {
	alpha: true,
})

const emit = defineEmits<{
	'update:modelValue': [string]
}>()

defineSlots<{
	default: void
}>()

const $button = shallowRef<HTMLElement | null>(null)
const open = ref(false)

const {shift, alt, h, f, a, s, v, r, g, b} = useMagicKeys()

const tweakMode = computed(() => {
	if (shift.value || h.value || f.value) {
		return 'h'
	}

	if (s.value) return 's'
	if (v.value) return 'v'

	if (r.value) return 'r'
	if (g.value) return 'g'
	if (b.value) return 'b'

	if (props.alpha && (alt.value || a.value)) {
		return 'a'
	}

	return 'pad'
})

const tweakChannels = ref({h: 0, s: 0, v: 0, a: 0, r: 0, g: 0, b: 0})

const tweakWidth = 300

function decomposeChannels() {
	if (!chroma.valid(props.modelValue)) {
		return {h: 0, s: 0, v: 0, r: 0, g: 0, b: 0, a: 1}
	}

	const rgba = chroma(props.modelValue).rgba()
	const [r, g, b, a] = rgba
	const hsv = rgb2hsv([r / 255, g / 255, b / 255])

	if (isNaN(hsv[0])) {
		hsv[0] = 0
	}
	if (isNaN(hsv[1])) {
		hsv[1] = 0
	}

	return {
		h: hsv[0],
		s: hsv[1],
		v: hsv[2],
		r: r / 255,
		g: g / 255,
		b: b / 255,
		a,
	}
}

const {origin, dragging: tweaking} = useDrag($button, {
	lockPointer: true,
	onDragStart() {
		tweakChannels.value = decomposeChannels()
	},
	onDrag({delta}) {
		const [dx, dy] = vec2.div(delta, [tweakWidth, -tweakWidth])

		let {h, s, v, a, r, g, b} = tweakChannels.value

		const mode = tweakMode.value

		if (mode === 'pad' || mode === 'h' || mode === 's' || mode === 'v') {
			if (mode === 'pad') {
				s = clamp(s - dx, 0, 1)
				v = clamp(v - dy, 0, 1)
			} else if (mode === 'h') {
				h = unsignedMod(h - dx, 1)
			} else if (mode === 's') {
				s = clamp(s - dx, 0, 1)
			} else if (mode === 'v') {
				v = clamp(v - dx, 0, 1)
			}

			;[r, g, b] = hsv2rgb([h, s, v])
		}

		if (mode === 'r' || mode === 'g' || mode === 'b') {
			if (mode === 'r') {
				r = clamp(r - dx, 0, 1)
			} else if (mode === 'g') {
				g = clamp(g - dx, 0, 1)
			} else if (mode === 'b') {
				b = clamp(b - dx, 0, 1)
			}

			const [_h, _s, _v] = rgb2hsv([r, g, b])

			h = isNaN(_h) ? h : 0
			s = _s
			v = _v
		}

		if (mode === 'a') {
			a = clamp(a + -dx, 0, 1)
		}

		tweakChannels.value = {r, g, b, h, s, v, a}

		const newValue = chroma(r * 255, g * 255, b * 255, a).hex()

		emit('update:modelValue', newValue)
	},
})

function onClickButton() {
	if (tweaking.value) return

	open.value = !open.value
}

watchEffect(() => {
	if (tweaking.value) {
		open.value = false
	}
})

const overlayLabel = computed<[string, string, boolean?][]>(() => {
	const mode = tweakMode.value
	if (mode === 'h') {
		const h = (tweakChannels.value.h * 360).toFixed(1)
		return [['Hue', h + '°']]
	} else if (mode === 's' || mode === 'v' || mode === 'a') {
		const label = mode === 's' ? 'Sat' : mode === 'v' ? 'Val' : 'α'
		const value = (tweakChannels.value[mode] * 100).toFixed(1)
		return [[label, value + '%']]
	} else if (mode === 'r' || mode === 'g' || mode === 'b') {
		const label = mode.toUpperCase()
		const value = (tweakChannels.value[mode] * 255).toFixed(0)
		return [[label, value, true]]
	} else {
		const s = (tweakChannels.value.s * 100).toFixed(1)
		const v = (tweakChannels.value.v * 100).toFixed(1)
		return [
			['Sat', s + '%'],
			['Val', v + '%'],
		]
	}
})

// Styles
const tweakUIOffset = computed(() => {
	return {
		left: `${origin.value[0]}px`,
		top: `${origin.value[1]}px`,
	}
})

const tweakPreviewStyle = computed(() => {
	let color = chroma.valid(props.modelValue)
		? chroma(props.modelValue)
		: chroma('black')

	if (tweakMode.value !== 'a') {
		color = color.alpha(1)
	}

	return {
		...tweakUIOffset.value,
		color: color.css(),
	}
})

const padStyle = computed(() => {
	return {
		left: `${origin.value[0] - tweakChannels.value.s * tweakWidth}px`,
		top: `${origin.value[1] - (1 - tweakChannels.value.v) * tweakWidth}px`,
	}
})

const padUniforms = computed(() => {
	const {h, s, v, a} = tweakChannels.value
	return {
		hsva: [h, s, v, a],
		axes: [colorChannelToIndex('s'), colorChannelToIndex('v')],
	}
})

const wheelUniforms = computed(() => {
	const {h, s, v, a} = tweakChannels.value
	return {
		hsva: [h, s, v, a],
	}
})

const wheelStyle = computed(() => {
	return {
		...tweakUIOffset.value,
		rotate: `${tweakChannels.value.h * -360}deg`,
	}
})

const sliderStyle = computed(() => {
	if (tweakMode.value === 'pad') return {}

	const value = tweakChannels.value[tweakMode.value]

	return {
		left: `${origin.value[0] - (value - 0.5) * tweakWidth}px`,
		top: `${origin.value[1]}px`,
	}
})

const sliderUniforms = computed(() => {
	const {h, s, v, a} = tweakChannels.value
	return {
		hsva: [h, s, v, a],
		axis: colorChannelToIndex(tweakMode.value as ColorChannel),
		offset: 0,
	}
})
</script>

<template>
	<button
		v-bind="$attrs"
		ref="$button"
		class="InputColor"
		@click="onClickButton"
	>
		<slot>
			<div
				class="default-button"
				:class="{open, tweaking}"
				:style="{color: modelValue}"
			/>
		</slot>
	</button>
	<Popover v-model:open="open" :reference="$button" placement="bottom-start">
		<div class="floating">
			<InputColorPicker
				:modelValue="modelValue"
				:alpha="alpha"
				:pickers="pickers"
				:presets="presets"
				@update:modelValue="emit('update:modelValue', $event)"
			/>
		</div>
	</Popover>
	<Transition>
		<div v-if="tweaking" class="overlay">
			<GlslCanvas
				v-if="tweakMode === 'pad'"
				class="pad"
				:fragmentString="PadFragmentString"
				:uniforms="padUniforms"
				:style="padStyle"
			/>
			<GlslCanvas
				v-else-if="tweakMode === 'h'"
				class="wheel"
				:fragmentString="WheelFragmentString"
				:uniforms="wheelUniforms"
				:style="wheelStyle"
			/>
			<GlslCanvas
				v-else
				class="slider"
				:fragmentString="SliderFragmentString"
				:uniforms="sliderUniforms"
				:style="sliderStyle"
			/>
			<div class="tweak-preview" :style="tweakPreviewStyle" />
			<div class="overlay-label" :style="tweakUIOffset">
				<template v-for="([label, value, rgb], i) in overlayLabel" :key="i">
					<span class="label">{{ label }}</span>
					<span class="value" :rgb="rgb">{{ value }}</span>
				</template>
			</div>
		</div>
	</Transition>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputColor
	width fit-content
	position relative
	display flex

.default-button
	position relative
	overflow hidden
	border-radius var(--tq-input-border-radius)
	width var(--tq-input-height)
	height var(--tq-input-height)
	hover-transition(box-shadow)
	background-checkerboard()

	.InputColor:focus-visible &,
	&:hover, &.tweaking
		box-shadow 0 0 0 1px var(--tq-color-accent)

.floating
	width var(--tq-popup-width)
	position relative
	popup-style()

.overlay
	--tq-hover-transition-duration 0.1s
	input-overlay()
	transition-duration var(--tq-hover-transition-duration)

:is(.pad, .wheel, .slider)
	position fixed
	border-radius var(--tq-input-border-radius)
	width 300px
	overflow hidden
	opacity 1

	.v-enter-active &,
	.v-leave-active &
		hover-transition(opacity)

	.v-enter-from &,
	.v-leave-to &
		opacity 0

.pad
	position absolute
	aspect-ratio 1
	mask linear-gradient(to right, black 4px, transparent 4px, transparent calc(100% - 4px), black calc(100% - 4px)) 0 0,
		linear-gradient(to bottom, black 4px, transparent 4px, transparent calc(100% - 4px), black calc(100% - 4px)) 0 0

.wheel
	aspect-ratio 1
	border-radius 50%
	margin-left -150px
	margin-top -4px
	mask radial-gradient(circle, transparent calc(70.71% - 4.5px), black calc(70.71% - 4px))

.slider
	height calc(0.7 * var(--tq-input-height))
	transform translate(-50%, -50%)
	color transparent
	background-checkerboard()

.tweak-preview
	position absolute
	overflow hidden
	width var(--tq-input-height)
	height var(--tq-input-height)
	margin calc(var(--tq-input-height) / -2) 0 0 calc(var(--tq-input-height) / -2)
	pointer-events none
	active-transition(transform, border-radius)
	transform scale(3)
	border-radius calc(var(--tq-input-height) / 2)
	background-checkerboard()
	box-shadow 0 0 1px 0px var(--tq-color-shadow)

	.v-enter-from &,
	.v-leave-to &
		transform scale(1)
		border-radius var(--tq-input-border-radius)

.overlay-label
	position absolute
	tooltip-style()
	font-numeric()
	transform translate(-50%, calc(-100% - var(--tq-input-height) * 1.7))
	active-transition(transform, opacity)
	display flex
	gap .2em

	.v-enter-from &,
	.v-leave-to &
		opacity 0
		transform translate(-50%, calc(-100% - var(--tq-input-height) * 0.2)) scale(.5)

	.label
		color var(--tq-color-text-mute)

	.value
		width 3.7em
		text-align right
		color var(--tq-color-text)

		&:not(:last-child)
			margin-right 1em

		&[rgb]
			width 2.2em
</style>
