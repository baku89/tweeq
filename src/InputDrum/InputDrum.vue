<script lang="ts" setup generic="T">
import {useElementBounding, useResizeObserver} from '@vueuse/core'
import {computed, onMounted, ref, shallowRef} from 'vue'

import {type InputEmits, useLabelizer} from '../types'
import {useDrag} from '../use/useDrag'
import type {InputDrumProps} from './types'

const props = defineProps<InputDrumProps<T>>()

const model = defineModel<T>({required: true})

const emit = defineEmits<InputEmits>()

const labelizer = useLabelizer(props)

const completeOptions = computed(() =>
	props.options.map(value => ({value, label: labelizer.value(value)}))
)

const activeIndex = computed(() => props.options.indexOf(model.value))

const disabled = computed(() => props.disabled ?? false)

const $root = shallowRef<HTMLElement | null>(null)
const {width: viewportWidth} = useElementBounding($root)

// Animate the slide ONLY for user-driven changes (drag release, click, wheel,
// keys). Option-list and layout changes (and the initial mount) reposition
// instantly — otherwise a value that stays put would slide for no reason when
// the options around it change.
const animating = ref(false)
let animTimer: ReturnType<typeof setTimeout> | undefined
function triggerAnim() {
	animating.value = true
	clearTimeout(animTimer)
	animTimer = setTimeout(() => (animating.value = false), 250)
}

// Cell width = the widest label (measured off-screen, so it tracks font load and
// option changes), keeping every cell the same — evenly spaced — and wide enough
// for its content. The cellWidth prop overrides it.
const measuredWidth = ref(0)
// Label font-size in px, so the gap cap below can be expressed in em.
const emPx = ref(16)
const $measure = shallowRef<HTMLElement | null>(null)

// Cap how far the cells may stretch past the widest label, so on a wide drum the
// labels don't drift so far apart they're tedious to scrub past (e.g. shutter
// speed's long list).
const MAX_GAP_EM = 2

function measure() {
	const m = $measure.value
	if (!m) return
	emPx.value = parseFloat(getComputedStyle(m).fontSize) || 16
	let max = 0
	for (const child of Array.from(m.children)) {
		max = Math.max(max, (child as HTMLElement).offsetWidth)
	}
	measuredWidth.value = max
}

onMounted(measure)
useResizeObserver($measure, measure)

const cellWidth = computed(() => {
	if (props.cellWidth) return Math.max(props.cellWidth, 1)

	const label = measuredWidth.value
	const W = viewportWidth.value
	if (!label || !W) return Math.max(label, 1)

	// Stretch the cells to an EVEN count across the width. With the active value
	// centred, an even count puts the viewport edges exactly on the two edge
	// cells' centres — so a half (and therefore mask-faded) label always peeks on
	// each side, signalling there's more to scroll. Keep cells ≥ the widest label
	// so nothing clips.
	let cells = Math.floor(W / label)
	if (cells % 2 === 1) cells -= 1
	if (cells < 2) cells = 2

	// Stretch to fill the width, but never let the gap past the label exceed
	// MAX_GAP_EM (the drum then just doesn't span the full width — the mask still
	// fades the edges).
	return Math.min(W / cells, label + MAX_GAP_EM * emPx.value)
})

function clampIndex(i: number) {
	return Math.max(0, Math.min(props.options.length - 1, i))
}

function setIndex(i: number) {
	const next = props.options[clampIndex(i)]
	if (next !== undefined && next !== model.value) {
		model.value = next
	}
}

// While dragging we track a fractional index so the drum follows the pointer
// smoothly; the bound value snaps to the nearest whole option as it crosses.
const floatIndex = ref(0)
let dragStartIndex = 0

// Pixels of (locked) pointer movement per option step while dragging. Fixed —
// NOT the cell width — so a wide label (e.g. shutter speed's "1/8000") doesn't
// stretch the cells and make the drum sluggish to scrub. The pointer is locked
// during a drag, so there's no on-screen cursor to keep aligned with the cells.
const DRAG_STEP_PX = 40

const {dragging} = useDrag($root, {
	disabled,
	// Lock the pointer so a single drag can scrub the whole list even when the
	// drum sits at a screen edge: useDrag then advances by accumulated movementX
	// instead of the (clamped) cursor position. A click still steps via onClick.
	lockPointer: true,
	onDragStart() {
		dragStartIndex = activeIndex.value < 0 ? 0 : activeIndex.value
		floatIndex.value = dragStartIndex
	},
	onDrag(state) {
		// Grab-and-spin: dragging right reveals earlier (lower-index) options.
		// Accumulate this frame's movement and clamp each step (not the total
		// offset from pointerdown) — so dragging past an end builds up no hidden
		// overshoot and a reversal turns the drum back immediately.
		floatIndex.value = clampIndex(
			floatIndex.value - state.delta[0] / DRAG_STEP_PX
		)
		setIndex(Math.round(floatIndex.value))
	},
	onDragEnd() {
		// Animate the settle from the fractional drag position to the snapped value.
		triggerAnim()
		emit('confirm')
	},
	onClick(state) {
		// Tapping a peeking neighbour steps toward it.
		const root = $root.value
		if (!root) return
		const x = state.xy[0] - root.getBoundingClientRect().left
		const offset = Math.round((x - viewportWidth.value / 2) / cellWidth.value)
		if (offset !== 0) {
			triggerAnim()
			setIndex(activeIndex.value + offset)
		}
	},
})

const displayIndex = computed(() =>
	dragging.value ? floatIndex.value : Math.max(0, activeIndex.value)
)

const trackStyle = computed(() => ({
	transform: `translateX(${
		viewportWidth.value / 2 - cellWidth.value * (displayIndex.value + 0.5)
	}px)`,
	// Tween only during a user-driven change (animating); never while dragging
	// (it would lag the pointer) or for option/layout repositioning.
	transition: dragging.value || !animating.value ? 'none' : undefined,
}))

// Wheel / trackpad: accumulate until a cell's worth of scroll, then step.
let wheelAccum = 0
function onWheel(e: WheelEvent) {
	if (disabled.value) return
	wheelAccum += e.deltaX || e.deltaY
	const threshold = 24
	while (Math.abs(wheelAccum) >= threshold) {
		const dir = Math.sign(wheelAccum)
		triggerAnim()
		setIndex(activeIndex.value + dir)
		wheelAccum -= dir * threshold
	}
}

function onKeyDown(e: KeyboardEvent) {
	if (disabled.value) return
	if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
		e.preventDefault()
		// Don't let the arrow bubble to global shortcuts (frame step etc.) — the
		// drum handled it.
		e.stopPropagation()
		triggerAnim()
		setIndex(activeIndex.value - 1)
	} else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
		e.preventDefault()
		e.stopPropagation()
		triggerAnim()
		setIndex(activeIndex.value + 1)
	}
}
</script>

<template>
	<div
		ref="$root"
		class="TqInputDrum"
		:class="{disabled}"
		:style="{
			'--cell-width': cellWidth + 'px',
			'--label-width': measuredWidth + 'px',
		}"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		:tabindex="disabled ? -1 : 0"
		@keydown="onKeyDown"
		@wheel.prevent="onWheel"
		@focus="emit('focus')"
		@blur="emit('blur')"
	>
		<!-- Centre ruler mark: a fixed, full-height line at the selection point.
			Before .viewport in the DOM so it paints behind the labels. -->
		<span class="center-mark" />
		<div class="viewport">
			<div class="track" :style="trackStyle">
				<div
					v-for="(op, i) in completeOptions"
					:key="op.label"
					class="cell"
					:class="{active: i === activeIndex, numeric: font === 'numeric'}"
				>
					{{ op.label }}
					<span class="tick" />
				</div>
			</div>
		</div>
		<!-- Off-screen ruler: same font/padding as the cells, intrinsic width, so
			measuring the widest label drives the (uniform) cell width. -->
		<div ref="$measure" class="measure" aria-hidden="true">
			<span
				v-for="op in completeOptions"
				:key="op.label"
				:class="{numeric: font === 'numeric'}"
			>
				{{ op.label }}
			</span>
		</div>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputDrum
	position relative
	// Fill the slot inside an InputGroup like the other fields; the track is
	// absolutely positioned, so keep a min-width (≈two labels: the centre value
	// plus a half-label peeking on each side) so it never collapses.
	flex-grow 1
	min-width calc(var(--label-width) * 2)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	background var(--tq-color-input)
	overflow hidden
	cursor ew-resize
	user-select none
	touch-action none
	hover-transition(background, box-shadow)
	use-input-position()

	&:hover
		background var(--tq-color-input-hover)

	// Keyboard focus only (a click/drag shouldn't flash the ring), matching the
	// other inputs' accent outline.
	&:focus-visible
		box-shadow 0 0 0 1px var(--tq-color-accent)
		outline none

	&.disabled
		opacity 0.5
		pointer-events none

// Clips + fades the strip here (not on the root) so the focus ring stays crisp.
// The fade band is a fixed width (≈one cell), not a percentage, so a wider drum
// keeps more crisp candidates in the middle and just fades the edges — several
// options peek past the centre instead of only one.
.viewport
	position absolute
	inset 0
	overflow hidden
	--fade calc(var(--cell-width) * 0.6)
	mask-image linear-gradient(to right, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent)
	-webkit-mask-image linear-gradient(to right, transparent, #000 var(--fade), #000 calc(100% - var(--fade)), transparent)

.track
	position absolute
	top 0
	left 0
	height 100%
	display flex
	align-items center
	will-change transform
	transition transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)

.cell
	position relative
	flex 0 0 auto
	width var(--cell-width)
	height 100%
	display flex
	align-items center
	justify-content center
	text-align center
	white-space nowrap
	border-radius var(--tq-radius-input)
	color var(--tq-color-text-subtle)
	hover-transition(color, background)

	&.numeric
		font-numeric()

	&.active
		color var(--tq-color-text)

	// Non-active values highlight on hover and show a pointer cursor: a click
	// jumps straight to that value (handled in onClick).
	&:not(.active)
		cursor pointer

		&:hover
			color var(--tq-color-text)
			background var(--tq-color-input-hover)

// Per-value ruler tick: faint, sits under each value and rides the track.
.tick
	position absolute
	bottom 2px
	left 50%
	transform translateX(-50%)
	width 1px
	height 3px
	border-radius 1px
	background var(--tq-color-text-subtle)
	opacity 0.5
	pointer-events none

// Fixed centre line at the selection point: spans the full height and runs
// behind the labels (it's before .viewport in the DOM). Outside .viewport so the
// mask never fades it.
.center-mark
	position absolute
	top 0
	bottom 0
	left 50%
	transform translateX(-50%)
	width 1px
	// The line runs behind the labels. Full accent reads fine on light text
	// (dark mode), but in light mode it shows through the dark centre label and
	// hurts legibility — soften it to the pale accent there only.
	background var(--tq-color-accent)
	pointer-events none

	[data-color-mode='light'] &
		background var(--tq-color-accent-soft)

// Hidden measuring row: never constrained, so each span is its natural width.
.measure
	position absolute
	top 0
	left 0
	visibility hidden
	pointer-events none
	display flex
	white-space nowrap

	span
		flex 0 0 auto
		// Breathing room added around the widest label to form the cell width.
		padding 0 0.6em

		&.numeric
			font-numeric()
</style>
