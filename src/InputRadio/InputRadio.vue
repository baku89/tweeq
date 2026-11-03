<script lang="ts" setup generic="T">
import {useResizeObserver} from '@vueuse/core'
import {uniqueId} from 'lodash-es'
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'

import {Icon} from '../Icon'
import {vTooltip} from '../Tooltip'
import {type InputEmits, type LabelizerProps, useLabelizer} from '../types'

interface CompleteOption {
	value: T
	label: string
}

type Props = LabelizerProps<T> & {
	modelValue: T
	icons?: string[]
	tooltips?: string[]
}

const model = defineModel<T>({required: true})

const props = defineProps<Props>()

defineEmits<InputEmits>()

defineSlots<{
	option: {label: string; value: T; isActive: boolean}
}>()

const labelizer = useLabelizer(props)
const id = uniqueId('InputRadio_')

const completeOptions = computed<CompleteOption[]>(() => {
	return props.options.map(op => {
		return {value: op, label: labelizer.value(op)}
	})
})

const activeIndex = computed(() =>
	completeOptions.value.findIndex(o => o.value === model.value)
)

function onChange(index: number) {
	const newValue = completeOptions.value[index].value
	model.value = newValue
}

// Responsive layout. The control adapts to the width it's given, in this order
// of preference (most expanded first):
//   rowFull  — horizontal, icon + label
//   rowIcon  — horizontal, icon only, each button a square (icons present only)
//   colFull  — single vertical column, icon + label
//   colIcon  — single vertical column, icon only (icons present only)
// Without icons there's nothing to drop, so it's just rowFull → colFull. We never
// wrap into a ragged grid (e.g. 3 + 2): the fallback is always a clean column.
type Mode = 'rowFull' | 'rowIcon' | 'colFull' | 'colIcon'

const mode = ref<Mode>('rowFull')

const hasIcons = computed(() => !!props.icons && props.icons.length > 0)
const vertical = computed(() => mode.value === 'colFull' || mode.value === 'colIcon')
const showLabel = computed(() => mode.value === 'rowFull' || mode.value === 'colFull')

// When an option's label is dropped (an icon-only mode), surface it as the
// tooltip instead — but never override an explicit tooltip the caller supplied.
function tooltipFor(index: number, label: string): string | undefined {
	const explicit = props.tooltips?.[index]
	if (explicit) return explicit
	const labelDropped = !showLabel.value && !!props.icons?.[index]
	return labelDropped ? label : undefined
}

const $ul = ref<HTMLUListElement>()

// Sliding active indicator: track the active <label>'s position and size so the
// accent block animates between options instead of snapping. Measured from the
// real labels (not assumed equal-size) so it follows variable labels, and uses
// the full rect (left/top/width/height) so it works in both row and column.
const indicator = ref<{
	left: number
	top: number
	width: number
	height: number
} | null>(null)
// Only animate the indicator for a user-driven change of value (click, drag,
// arrow keys) — never for external layout/resize, where a slide reads as a glitch.
const animating = ref(false)
let animTimer: ReturnType<typeof setTimeout> | undefined

// Pick the layout mode for the width we've been given. The required widths are
// measured from a hidden ruler (always rendered with icon + label, so its sizes
// are stable regardless of the current mode — that's what keeps this from
// oscillating). Only meaningful when the control's width is externally
// constrained: if it's content-sized it always reports just enough room for the
// full layout, so it never compacts.
function updateLayout() {
	const ul = $ul.value
	if (!ul) return

	const n = completeOptions.value.length
	if (n === 0) return

	const cs = getComputedStyle(ul)
	const unit = parseFloat(cs.getPropertyValue('--tq-input-height')) || 0
	const gap = parseFloat(cs.gap) || 0

	// Natural icon + label width of each option, from the offscreen ruler.
	const rulerItems = ul.querySelectorAll<HTMLElement>(
		':scope > .ruler > .item'
	)
	let sumFull = 0
	let maxFull = 0
	rulerItems.forEach(el => {
		const w = el.getBoundingClientRect().width
		sumFull += w
		if (w > maxFull) maxFull = w
	})

	// Ruler not laid out yet (fonts still loading, hidden parent…) — keep the
	// current mode rather than collapsing to a bogus measurement.
	if (sumFull === 0) return

	const gaps = gap * (n - 1)
	const rowFullWidth = sumFull + gaps // labels in a row
	const rowIconWidth = unit * n + gaps // square icons in a row
	const colFullWidth = maxFull // widest single icon + label row
	// colIcon needs only a single icon square (`unit`), the narrowest of all.

	const w = ul.clientWidth
	const fits = (need: number) => w + 1 >= need

	let next: Mode
	if (hasIcons.value) {
		if (fits(rowFullWidth)) next = 'rowFull'
		else if (fits(rowIconWidth)) next = 'rowIcon'
		else if (fits(colFullWidth)) next = 'colFull'
		else next = 'colIcon'
	} else {
		next = fits(rowFullWidth) ? 'rowFull' : 'colFull'
	}

	if (next !== mode.value) mode.value = next

	nextTick(updateIndicator)
}

function updateIndicator() {
	const ul = $ul.value
	if (!ul) return
	const labels = ul.querySelectorAll<HTMLElement>(':scope > .list > label')
	const el = labels[activeIndex.value]
	if (!el) {
		indicator.value = null
		return
	}
	// Measure relative to the <ul> via bounding rects: offsetLeft/Top would be
	// relative to the <label>'s offsetParent (the positioned .list), so they'd
	// read ~0 for every option and the indicator would never move.
	const ulRect = ul.getBoundingClientRect()
	const rect = el.getBoundingClientRect()
	indicator.value = {
		left: rect.left - ulRect.left,
		top: rect.top - ulRect.top,
		width: rect.width,
		height: rect.height,
	}
}

// User changed the value → animate the slide. Keep the class on just long
// enough to cover the transition, then drop it so the next resize won't animate.
watch(activeIndex, () => {
	animating.value = true
	clearTimeout(animTimer)
	animTimer = setTimeout(() => (animating.value = false), 250)
	nextTick(updateIndicator)
})
// Layout-only changes (option set, icons toggled) re-evaluate the mode and
// reposition, both without animating.
watch([completeOptions, hasIcons], () => nextTick(updateLayout))
useResizeObserver($ul, updateLayout)
onMounted(updateLayout)

// Drag-to-select: press anywhere and slide across the segments (the indicator
// follows). We track on `window` rather than via pointer capture so the gesture
// keeps working past the control's edges and always ends on pointerup wherever
// it lands (capture could be lost mid-drag, leaving it stuck).
const dragging = ref(false)

// The segment under the pointer, hit-tested along the layout's main axis (Y when
// stacked into a column, X when laid out in a row).
function optionIndexAt(clientX: number, clientY: number): number {
	const ul = $ul.value
	if (!ul) return activeIndex.value
	const labels = ul.querySelectorAll<HTMLElement>(':scope > .list > label')
	for (let i = 0; i < labels.length; i++) {
		const rect = labels[i].getBoundingClientRect()
		const past = vertical.value ? clientY < rect.bottom : clientX < rect.right
		if (past) return i
	}
	return labels.length - 1
}

function selectAt(clientX: number, clientY: number) {
	const opt = completeOptions.value[optionIndexAt(clientX, clientY)]
	if (opt && opt.value !== model.value) model.value = opt.value
}

function onWindowPointerMove(e: PointerEvent) {
	if (dragging.value) selectAt(e.clientX, e.clientY)
}

function endDrag() {
	if (!dragging.value) return
	dragging.value = false
	window.removeEventListener('pointermove', onWindowPointerMove)
	window.removeEventListener('pointerup', endDrag)
	window.removeEventListener('pointercancel', endDrag)
}

function onPointerDown(e: PointerEvent) {
	if (e.button !== 0) return
	// Suppress the native label/radio click (and its focus): otherwise releasing
	// after a drag re-fires a click on the originally pressed segment, snapping
	// the value back to where the drag started.
	e.preventDefault()
	dragging.value = true
	selectAt(e.clientX, e.clientY)
	window.addEventListener('pointermove', onWindowPointerMove)
	window.addEventListener('pointerup', endDrag)
	window.addEventListener('pointercancel', endDrag)
}

onBeforeUnmount(endDrag)
</script>

<template>
	<ul
		ref="$ul"
		class="TqInputRadio"
		:class="[mode, {vertical, iconOnly: !showLabel}]"
		@pointerdown="onPointerDown"
	>
		<div
			v-if="indicator"
			class="indicator"
			:class="{animating, dragging}"
			:style="{
				transform: `translate(${indicator.left}px, ${indicator.top}px)`,
				width: `${indicator.width}px`,
				height: `${indicator.height}px`,
			}"
		/>
		<li
			v-for="({value, label}, index) in completeOptions"
			:key="label"
			class="list"
		>
			<input
				:id="id + value"
				type="radio"
				:name="id"
				:checked="model === value"
				@change="onChange(index)"
			/>
			<label
				:for="id + value"
				:class="{active: model === value}"
				v-tooltip="tooltipFor(index, label)"
			>
				<slot
					name="option"
					:label="label"
					:value="value"
					:isActive="model === value"
				>
					<!-- Icon + label. The label hides (leaving the icon) in the icon-only
						modes; an option with no icon always keeps its label so it's never
						blank. -->
					<Icon v-if="icons?.[index]" class="icon" :icon="icons[index]" />
					<span v-if="showLabel || !icons?.[index]" class="text">
						{{ label }}
					</span>
				</slot>
			</label>
		</li>
		<!-- Offscreen ruler: the icon + label of every option, measured to decide the
			layout mode. Kept out of flow so it never affects the real layout. -->
		<li class="ruler" aria-hidden="true">
			<div
				v-for="({label}, index) in completeOptions"
				:key="label"
				class="item"
			>
				<Icon v-if="icons?.[index]" class="icon" :icon="icons[index]" />
				<span class="text">{{ label }}</span>
			</div>
		</li>
	</ul>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputRadio
	position relative
	display flex
	overflow hidden
	background var(--tq-color-input)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	padding 0
	gap 1px
	hover-transition(background, box-shadow)
	// Drag-to-select: no text selection, and claim pointer gestures so a swipe
	// across segments doesn't scroll the page on touch.
	user-select none
	touch-action none
	cursor pointer

	// Focus ring matching the text inputs (shows on keyboard focus of a radio;
	// a click doesn't focus since pointerdown preventDefaults).
	&:focus-within
		box-shadow 0 0 0 1px var(--tq-color-accent)

	// Stacked fallback: one clean column, the control grows in height.
	&.vertical
		flex-direction column
		height auto

	// Icon-only modes: drop the side padding so each button can shrink all the way
	// down to a square around its icon (the buttons still stretch to fill the
	// width and shrink with it — the square is just the point where it folds into
	// a column).
	&.iconOnly label
		padding 0

// The accent block behind the active option. Slides/stretches to the active
// label's measured geometry; sits below the labels so their text shows on top.
.indicator
	position absolute
	top 0
	left 0
	border-radius var(--tq-radius-input)
	background var(--tq-color-accent)
	pointer-events none
	z-index 0

	&.animating
		transition transform var(--tq-hover-transition-duration) ease, width var(--tq-hover-transition-duration) ease, height var(--tq-hover-transition-duration) ease

	// While dragging, the active block reads as "held" with the hover tint.
	&.dragging
		background var(--tq-color-accent-hover)

// Match the old accent-hover when hovering the already-active option.
.TqInputRadio:has(label.active:hover) .indicator
	background var(--tq-color-accent-hover)

.list
	position relative
	z-index 1
	flex-grow 1

input
	position absolute
	opacity 0

label
	display flex
	line-height var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	overflow hidden
	text-align center
	justify-content center
	align-items center
	gap 0.4em
	white-space nowrap
	hover-transition(background, color)
	padding 0 0.75em

	&:not(.active):hover
		background var(--tq-color-input-hover)

	&.active
		color var(--tq-color-on-accent)

.icon
	display block
	flex none

// Offscreen measuring ruler: laid out like the real labels (same padding, gap,
// height, font) but pulled out of flow and hidden so it only contributes its
// intrinsic widths.
.ruler
	position absolute
	visibility hidden
	pointer-events none
	top 0
	left 0
	display flex

	.item
		flex none
		display flex
		align-items center
		gap 0.4em
		height var(--tq-input-height)
		line-height var(--tq-input-height)
		padding 0 0.75em
		white-space nowrap
</style>
