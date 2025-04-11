<script lang="ts" setup>
import {useFocus, useFocusWithin, useMagicKeys, whenever} from '@vueuse/core'
import chroma from 'chroma-js'
import Color from 'colorjs.io'
import {scalar, vec2} from 'linearly'
import {computed, ref, shallowRef, useTemplateRef, watch} from 'vue'

import {GlslCanvas} from '../GlslCanvas'
import {Popover} from '../Popover'
import {useMultiSelectStore} from '../stores/multiSelect'
import {useThemeStore} from '../stores/theme'
import {Tooltip} from '../Tooltip'
import {InputEmits} from '../types'
import {useCopyPaste} from '../use/useCopyPaste'
import {useDrag} from '../use/useDrag'
import InputColorPicker from './InputColorPicker.vue'
import PadFragmentString from './pad.frag'
import SliderFragmentString from './slider.frag'
import {
	type ColorChannel,
	colorChannelToIndex,
	type HSVA,
	type InputColorProps,
} from './types'
import {
	css2hsva,
	getHSVAChannel,
	hsv2rgb,
	hsva2hex,
	setHSVAChannel,
	tweakHSVAChannel,
} from './utils'
import WheelFragmentString from './wheel.frag'

const model = defineModel<string>({required: true})
const props = withDefaults(defineProps<InputColorProps>(), {
	alpha: true,
})
const emit = defineEmits<
	InputEmits & {
		'update:tweaking': [boolean]
	}
>()

const theme = useThemeStore()

defineSlots<{
	default: void
}>()

const $button = useTemplateRef('$button')
const open = ref(false)

const {shift, meta, alt, h, f, a, s, v, r, g, b} = useMagicKeys()

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

const local = shallowRef<HSVA>({h: 0, s: 0, v: 0, a: 0})
const decompose = css2hsva
const compose = hsva2hex

const $floating = useTemplateRef('$floating')
const floatingFocused = useFocusWithin($floating).focused

const temporarilyHidePopup = computed(() => {
	return !floatingFocused.value && (shift.value || meta.value)
})

const tweakWidth = theme.popupWidth

let localOnTweak: HSVA | null = null

const {origin, dragging: tweaking} = useDrag($button, {
	lockPointer: true,
	onClick() {
		if (multi.multiSelected) return
		open.value = !open.value
	},
	onDragStart() {
		local.value = localOnTweak = decompose(model.value)
		multi.capture()
		emit('update:tweaking', true)
	},
	onDrag({delta}) {
		const [dx, dy] = vec2.div(delta, [tweakWidth, -tweakWidth])

		const mode = tweakMode.value

		if (mode === 'pad') {
			local.value = tweakHSVAChannel(local.value, 's', dx)
			local.value = tweakHSVAChannel(local.value, 'v', dy)

			const {s: is, v: iv} = localOnTweak!
			const {s: cs, v: cv} = local.value

			multi.update(hsva => {
				if (cs !== is) {
					hsva = setHSVAChannel(hsva, 's', s =>
						cs < is
							? scalar.lerp(0, s, cs / is)
							: scalar.lerp(1, s, (1 - cs) / (1 - is))
					)
				}
				if (cv !== iv) {
					hsva = setHSVAChannel(hsva, 'v', v =>
						cv < iv
							? scalar.lerp(0, v, cv / iv)
							: scalar.lerp(1, v, (1 - cv) / (1 - iv))
					)
				}
				return hsva
			})
		} else {
			local.value = tweakHSVAChannel(local.value, mode, mode === 'v' ? dy : dx)

			const current = getHSVAChannel(local.value, mode)
			const initial = getHSVAChannel(localOnTweak!, mode)

			if (mode === 'h' || initial === 0) {
				const delta = current - initial
				multi.update(hsva => tweakHSVAChannel(hsva, 'h', delta))
			} else {
				const scale = current / initial
				multi.update(hsva => {
					const v = getHSVAChannel(hsva, mode)
					return setHSVAChannel(hsva, mode, v * scale)
				})
			}
		}

		model.value = compose(local.value)
	},
	onDragEnd() {
		emit('confirm')
		multi.confirm()
		emit('update:tweaking', false)
	},
})

watch(tweakMode, () => {
	if (!tweaking.value) return

	localOnTweak = local.value
	multi.capture()
})

// Update local value when model value changes externally
watch(
	model,
	model => {
		if (tweaking.value) return

		local.value = decompose(model)
	},
	{immediate: true, flush: 'sync'}
)

whenever(tweaking, () => {
	open.value = false
})

const overlayLabel = computed<[string, string, boolean?][]>(() => {
	const mode = tweakMode.value
	if (mode === 'h') {
		const h = (local.value.h * 360).toFixed(1)
		return [['Hue', h + '°']]
	} else if (mode === 's' || mode === 'v' || mode === 'a') {
		const label = mode === 's' ? 'Sat' : mode === 'v' ? 'Val' : 'α'
		const value = (local.value[mode] * 100).toFixed(1)
		return [[label, value + '%']]
	} else if (mode === 'r' || mode === 'g' || mode === 'b') {
		const label = mode.toUpperCase()
		const rgb = hsv2rgb(local.value)
		const value = (rgb[mode] * 255).toFixed(0)
		return [[label, value, true]]
	} else {
		const s = (local.value.s * 100).toFixed(1)
		const v = (local.value.v * 100).toFixed(1)
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

const defaultButtonStyle = computed(() => {
	const contrast = Color.contrastWCAG21(model.value, theme.backgroundColor)

	return {
		color: model.value,
		'--outline': contrast > 1.1 ? 'transparent' : 'var(--tq-color-border)',
	}
})

const overlayStyle = computed(() => {
	return {
		transformOrigin: `${origin.value[0]}px ${origin.value[1]}px`,
	}
})

const tweakPreviewStyle = computed(() => {
	let color = chroma(chroma.valid(model.value) ? model.value : 'black')

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
		opacity: tweakMode.value === 'pad' ? 1 : 0.1,
		left: `${origin.value[0] - local.value.s * tweakWidth}px`,
		top: `${origin.value[1] - (1 - local.value.v) * tweakWidth}px`,
	}
})

const padUniforms = computed(() => {
	const {h, s, v, a} = local.value
	return {
		hsva: [h, s, v, a],
		axes: [colorChannelToIndex('s'), colorChannelToIndex('v')],
	}
})

const wheelUniforms = computed(() => {
	const {h, s, v, a} = local.value
	return {
		hsva: [h, s, v, a],
	}
})

const wheelStyle = computed(() => {
	return {
		...tweakUIOffset.value,
		opacity: tweakMode.value === 'h' ? 1 : 0.1,
		rotate: `${local.value.h * -360}deg`,
	}
})

const sliderStyle = computed(() => {
	if (tweakMode.value === 'pad') return {}

	let value: number

	if (
		tweakMode.value === 'r' ||
		tweakMode.value === 'g' ||
		tweakMode.value === 'b'
	) {
		const rgb = hsv2rgb(local.value)
		value = rgb[tweakMode.value]
	} else {
		value = local.value[tweakMode.value]
	}

	const offsetAxis = -(value - 0.5) * tweakWidth

	const offset: vec2 =
		tweakMode.value === 'v' ? [0, offsetAxis] : [offsetAxis, 0]

	return {
		left: `${origin.value[0] + offset[0]}px`,
		top: `${origin.value[1] - offset[1]}px`,
	}
})

const sliderUniforms = computed(() => {
	const {h, s, v, a} = local.value
	return {
		hsva: [h, s, v, a],
		axis: colorChannelToIndex(tweakMode.value as ColorChannel),
		offset: 0,
	}
})

//------------------------------------------------------------------------------
// Multi Select

const focusing = useFocus($button).focused

const multi = useMultiSelectStore().register({
	type: 'color',
	el: $button,
	focusing,
	getValue: () => local.value,
	setValue(value: HSVA) {
		local.value = value
		model.value = compose(value)
	},
	confirm() {
		emit('confirm')
	},
})

whenever(
	() => multi.multiSelected,
	() => {
		open.value = false
	}
)

//------------------------------------------------------------------------------
// Copy and paste

useCopyPaste({
	target: $button,
	onCopy() {
		navigator.clipboard.writeText(model.value)
	},
	onPaste: async () => {
		const text = await navigator.clipboard.readText()
		if (!text) return
		model.value = text

		const hsva = decompose(text)

		multi.update(() => hsva)
		multi.confirm()
	},
})

//------------------------------------------------------------------------------
// Component settings

defineOptions({
	inheritAttrs: false,
})
</script>

<template>
	<button
		ref="$button"
		v-bind="$attrs"
		class="TqInputColorPad"
		:class="{focus: (open && temporarilyHidePopup) || multi.subfocus}"
	>
		<slot>
			<div
				class="default-button"
				:class="{open, tweaking}"
				:style="defaultButtonStyle"
				:inline-position="inlinePosition"
				:block-position="blockPosition"
			/>
		</slot>
	</button>
	<Popover
		:open="open && !temporarilyHidePopup"
		:reference="$button"
		placement="bottom-start"
		@update:open="open = $event"
	>
		<div ref="$floating" class="floating">
			<InputColorPicker
				v-model="model"
				:alpha="alpha"
				:pickers="pickers"
				:presets="presets"
				@confirm="emit('confirm')"
			/>
		</div>
	</Popover>
	<Transition>
		<div v-if="tweaking" class="overlay" :style="overlayStyle">
			<template
				v-if="
					tweakMode === 'pad' ||
					tweakMode === 'h' ||
					tweakMode === 's' ||
					tweakMode === 'v'
				"
			>
				<GlslCanvas
					class="pad"
					:fragmentString="PadFragmentString"
					:uniforms="padUniforms"
					:style="padStyle"
				/>
				<GlslCanvas
					class="wheel"
					:fragmentString="WheelFragmentString"
					:uniforms="wheelUniforms"
					:style="wheelStyle"
				/>
			</template>
			<GlslCanvas
				v-if="
					tweakMode === 's' ||
					tweakMode === 'v' ||
					tweakMode === 'r' ||
					tweakMode === 'g' ||
					tweakMode === 'b' ||
					tweakMode === 'a'
				"
				class="slider"
				:class="{[tweakMode]: true}"
				:fragmentString="SliderFragmentString"
				:uniforms="sliderUniforms"
				:style="sliderStyle"
			/>
			<div class="tweak-preview" :style="tweakPreviewStyle" />
			<Tooltip class="overlay-label" :style="tweakUIOffset">
				<template v-for="([label, value, rgb], i) in overlayLabel" :key="i">
					<label>{{ label }}</label>
					<span class="value" :rgb="rgb">{{ value }}</span>
				</template>
			</Tooltip>
		</div>
	</Transition>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.TqInputColorPad
	width fit-content
	position relative
	display flex

.default-button
	position relative
	overflow hidden
	border-radius var(--tq-radius-input)
	width var(--tq-input-height)
	height var(--tq-input-height)
	hover-transition(box-shadow)
	background-checkerboard()
	use-input-position()
	box-shadow inset 0 0 0 1px var(--outline)

	.TqInputColorPad:focus &,
	.TqInputColorPad.focus &,
	&:hover, &.tweaking
		--outline var(--tq-color-accent) !important
		box-shadow 0 0 0 1px var(--outline)

.floating
	width var(--tq-popup-width)
	position relative
	popup-style()

.overlay
	input-overlay()
	active-transition(opacity, scale)
	opacity 1

	&.v-enter-from,
	&.v-leave-to
		opacity 0
		scale .5

:is(.pad, .wheel, .slider)
	position fixed
	border-radius var(--tq-radius-input)
	width var(--tq-popup-width)
	overflow hidden
	active-transition(opacity)

.pad
	position absolute
	aspect-ratio 1
	mask linear-gradient(to right, black 4px, transparent 4px, transparent calc(100% - 4px), black calc(100% - 4px)) 0 0,
		linear-gradient(to bottom, black 4px, transparent 4px, transparent calc(100% - 4px), black calc(100% - 4px)) 0 0

.wheel
	aspect-ratio 1
	border-radius 50%
	margin-left calc(var(--tq-popup-width) / -2)
	margin-top -4px

	dot(angle)
		'radial-gradient(closest-side, black 80%, transparent 100%) calc(50% + sin(%s) * (50% - 6px)) calc(50% - cos(%s) * (50% - 6px)) / 4px 4px' % (angle angle)

	mask \
		radial-gradient(closest-side, transparent calc(100% - 4.5px), black calc(100% - 4px)),
		dot(0deg), dot(60deg), dot(120deg), dot(180deg), dot(240deg), dot(300deg)
	mask-repeat no-repeat

.slider
	height calc(0.5 * var(--tq-input-height))
	transform translate(-50%, -50%)
	color transparent
	background-checkerboard()

	&.v
		transform translate(-50%, -50%) rotate(-90deg)

.tweak-preview
	position absolute
	overflow hidden
	width var(--tq-input-height)
	height var(--tq-input-height)
	margin calc(var(--tq-input-height) / -2) 0 0 calc(var(--tq-input-height) / -2)
	pointer-events none
	active-transition(transform, border-radius)
	transform scale(1.8)
	border-radius calc(var(--tq-input-height) / 2)
	background-checkerboard()
	box-shadow 0 0 1px 0px var(--tq-color-shadow)

.overlay-label
	position absolute
	transform translate(-50%, calc(-100% - var(--tq-input-height) * 1.7))
	display flex
	gap .2em

	.value
		width 3.7em
		text-align right
		color var(--tq-color-text)

		&:not(:last-child)
			margin-right 1em

		&[rgb]
			width 2.2em
</style>
