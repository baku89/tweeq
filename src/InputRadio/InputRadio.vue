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

// Sliding active indicator: track the active <label>'s position and width so the
// accent block animates between options instead of snapping. Measured from the
// real labels (not assumed equal-width) so it follows variable label widths.
const $ul = ref<HTMLUListElement>()
const indicator = ref<{left: number; width: number} | null>(null)
// Suppress the transition for the very first placement (no slide-in from 0).
const ready = ref(false)

function updateIndicator() {
	const ul = $ul.value
	if (!ul) return
	const labels = ul.querySelectorAll<HTMLElement>(':scope > .list > label')
	const el = labels[activeIndex.value]
	if (!el) {
		indicator.value = null
		return
	}
	// Measure relative to the <ul> via bounding rects: offsetLeft would be
	// relative to the <label>'s offsetParent (the positioned .list), so it'd
	// read ~0 for every option and the indicator would never move.
	const ulRect = ul.getBoundingClientRect()
	const rect = el.getBoundingClientRect()
	indicator.value = {left: rect.left - ulRect.left, width: rect.width}
}

watch([activeIndex, completeOptions], () => nextTick(updateIndicator))
useResizeObserver($ul, updateIndicator)
onMounted(async () => {
	updateIndicator()
	await nextTick()
	ready.value = true
})

// Drag-to-select: press anywhere and slide across the segments (the indicator
// follows). We track on `window` rather than via pointer capture so the gesture
// keeps working past the control's edges and always ends on pointerup wherever
// it lands (capture could be lost mid-drag, leaving it stuck).
const dragging = ref(false)

function optionIndexAtX(clientX: number): number {
	const ul = $ul.value
	if (!ul) return activeIndex.value
	const labels = ul.querySelectorAll<HTMLElement>(':scope > .list > label')
	for (let i = 0; i < labels.length; i++) {
		if (clientX < labels[i].getBoundingClientRect().right) return i
	}
	return labels.length - 1
}

function selectAtX(clientX: number) {
	const opt = completeOptions.value[optionIndexAtX(clientX)]
	if (opt && opt.value !== model.value) model.value = opt.value
}

function onWindowPointerMove(e: PointerEvent) {
	if (dragging.value) selectAtX(e.clientX)
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
	selectAtX(e.clientX)
	window.addEventListener('pointermove', onWindowPointerMove)
	window.addEventListener('pointerup', endDrag)
	window.addEventListener('pointercancel', endDrag)
}

onBeforeUnmount(endDrag)
</script>

<template>
	<ul ref="$ul" class="TqInputRadio" @pointerdown="onPointerDown">
		<div
			v-if="indicator"
			class="indicator"
			:class="{ready, dragging}"
			:style="{
				transform: `translateX(${indicator.left}px)`,
				width: `${indicator.width}px`,
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
				v-tooltip="tooltips?.[index]"
			>
				<slot
					name="option"
					:label="label"
					:value="value"
					:isActive="model === value"
				>
					<!-- An icon, when given, stands in for the label (segmented icon
						control); otherwise fall back to the text label. -->
					<Icon v-if="icons?.[index]" class="icon" :icon="icons[index]" />
					<template v-else>{{ label }}</template>
				</slot>
			</label>
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
	// Drag-to-select: no text selection, and claim horizontal pointer gestures
	// so a swipe across segments doesn't scroll the page on touch.
	user-select none
	touch-action none
	cursor pointer

	// Focus ring matching the text inputs (shows on keyboard focus of a radio;
	// a click doesn't focus since pointerdown preventDefaults).
	&:focus-within
		box-shadow 0 0 0 1px var(--tq-color-accent)

// The accent block behind the active option. Slides/stretches to the active
// label's measured geometry; sits below the labels so their text shows on top.
.indicator
	position absolute
	top 0
	left 0
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	background var(--tq-color-accent)
	pointer-events none
	z-index 0

	&.ready
		transition transform var(--tq-hover-transition-duration) ease, width var(--tq-hover-transition-duration) ease

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
	hover-transition(background, color)
	padding 0 0.75em

	&:not(.active):hover
		background var(--tq-color-input-hover)

	&.active
		color var(--tq-color-on-accent)

.icon
	display block
</style>
