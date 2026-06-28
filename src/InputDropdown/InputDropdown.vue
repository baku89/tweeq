<script lang="ts" setup generic="T">
import {useElementBounding, useWindowSize, whenever} from '@vueuse/core'
import {search} from 'fast-fuzzy'
import {scalar, type vec2} from 'linearly'
import {
	computed,
	nextTick,
	onBeforeUnmount,
	type Ref,
	ref,
	useTemplateRef,
	watch,
} from 'vue'

import {Icon} from '../Icon'
import {InputString} from '../InputString'
import {Popover} from '../Popover'
import {useThemeStore} from '../stores/theme'
import {type InputEmits, useLabelizer} from '../types'
import {unsignedMod} from '../util'
import type {InputDropdownProps} from './types'

const model = defineModel<T>({required: true})

const props = withDefaults(defineProps<InputDropdownProps<T>>(), {
	prefix: '',
	suffix: '',
	align: 'center',
})

const labelizer = useLabelizer(props)

const emit = defineEmits<InputEmits>()

defineOptions({
	inheritAttrs: false,
})

const open = ref(false)
const $root = useTemplateRef('$root')
const $input = useTemplateRef('$input')
const $select = useTemplateRef<HTMLUListElement>('$select')

const rootBound = useElementBounding($root)
const {height: windowHeight} = useWindowSize()

// Whether the cropped list has more content above / below the visible window.
const canScrollUp = ref(false)
const canScrollDown = ref(false)

// Gap kept from the viewport edges; the .select's own margin+border above the
// first option; auto-scroll speed (px/frame) while hovering an arrow.
const VIEWPORT_MARGIN = 6
const SELECT_CHROME = 2
const AUTO_SCROLL_SPEED = 8

const display = ref(labelizer.value(model.value))
const displayEdited = ref(false)

watch(
	() => [open.value, model.value] as const,
	([open, modelValue]) => {
		if (open) return
		display.value = labelizer.value(modelValue)
		displayEdited.value = false
	}
)

const valueAtStart = ref(model.value) as Ref<T>

const filteredOptions = computed(() => {
	if (display.value === '' || !displayEdited.value) return props.options

	const ret = search(display.value, props.options as any[], {
		keySelector: labelizer.value,
	}) as T[]

	return ret
})

const theme = useThemeStore()

// Real rendered height of the list, measured after open (scrollHeight). Falls
// back to an estimate for the first frame. Drives the fit/scroll decision so a
// wrong estimate can't push the box (and its bottom arrow) off-screen.
const listHeightPx = ref(0)

// Screen-Y of the popover's top edge (not-editing case). Starts so the selected
// option sits on the input; the down-arrow then nudges it upward to grow the
// menu into the empty space above — macOS-style — until it fills the viewport.
// A mutable ref (not a pure computed) because the auto-scroll moves it.
const dropdownTop = ref(VIEWPORT_MARGIN)

function initDropdownTop() {
	const itemH = theme.inputHeight
	const margin = VIEWPORT_MARGIN

	let index = props.options.indexOf(valueAtStart.value)
	if (index === -1) index = 0

	// Top that puts the selected option on the input (index 0 sits this far up).
	const anchorTop = rootBound.top.value - 2
	const idealTop = anchorTop - SELECT_CHROME - index * itemH

	const listHeight =
		listHeightPx.value || props.options.length * itemH + SELECT_CHROME * 2
	const available = windowHeight.value - margin * 2

	// Fits → cap so the whole list stays on screen (no cropping). Taller → keep
	// at least one row visible; the box still reaches the bottom edge (via
	// selectMaxHeight) and the down-arrow grows it upward from here.
	const maxTop =
		listHeight <= available
			? windowHeight.value - margin - listHeight
			: windowHeight.value - margin - itemH

	dropdownTop.value = scalar.clamp(idealTop, margin, Math.max(margin, maxTop))
}

const popoverPlacement = computed<vec2 | 'bottom'>(() => {
	// 2px === border width + focus outline
	const left = rootBound.left.value - 2

	// While typing to filter, just drop the (usually short) list below the input.
	if (displayEdited.value) {
		return [left, rootBound.bottom.value]
	}

	return [left, dropdownTop.value]
})

// Reach the bottom edge of the viewport, but never taller than the list itself.
// Tied to dropdownTop, so as the down-arrow raises the top the box grows and
// the bottom arrow disappears once everything fits.
const selectMaxHeight = computed(() => {
	const top = displayEdited.value ? rootBound.bottom.value : dropdownTop.value
	return Math.min(
		listHeightPx.value || Infinity,
		windowHeight.value - top - VIEWPORT_MARGIN
	)
})

watch(filteredOptions, filteredOptions => {
	if (!filteredOptions.includes(model.value)) {
		model.value = filteredOptions[0]
	}
	if (!open.value) return
	nextTick(() => {
		measureList()
		// Snap to the top ONLY when the user narrowed the list by typing. An
		// external options change (e.g. the camera reporting new settable values
		// right after a hover-select) must keep the current scroll position —
		// otherwise the popup yanks back to the top mid-interaction.
		if (displayEdited.value && $select.value) {
			$select.value.scrollTop = 0
		}
		updateScrollArrows()
	})
})

let timeAtOpen: number | null = null

whenever(open, () => {
	valueAtStart.value = model.value
	timeAtOpen = new Date().getTime()
	window.addEventListener('pointerup', onPointerupWhileOpen)
	// Provisional placement (last measured height), then once rendered re-measure
	// for an exact layout and scroll the selected option onto the input.
	initDropdownTop()
	nextTick(() => {
		measureList()
		initDropdownTop()
		requestAnimationFrame(alignCurrentToTrigger)
	})
})

watch(open, isOpen => {
	if (!isOpen) stopAutoScroll()
})

function measureList() {
	if ($select.value) listHeightPx.value = $select.value.scrollHeight
}

// Scroll the cropped list so the option open with (`.current`) lands on the
// input. scrollTop is clamped by the browser, so near the list ends the
// selection simply stops at the edge (matching native menus).
function alignCurrentToTrigger() {
	const select = $select.value
	if (!select) return
	select.scrollTop = 0
	const current = select.querySelector<HTMLElement>('.option.current')
	if (current) {
		const delta = current.getBoundingClientRect().top - (rootBound.top.value - 2)
		select.scrollTop = Math.max(0, delta)
	}
	updateScrollArrows()
}

function updateScrollArrows() {
	const s = $select.value
	if (!s) {
		canScrollUp.value = canScrollDown.value = false
		return
	}
	// Visible height of the box (grows as the down-arrow raises dropdownTop).
	// Formula-based off the reactive selectMaxHeight so it has no reflow lag.
	const visible = Math.min(s.scrollHeight, selectMaxHeight.value)
	canScrollUp.value = s.scrollTop > 0.5
	canScrollDown.value = s.scrollTop + visible < s.scrollHeight - 0.5
}

// Keep the highlighted option visible during keyboard navigation.
function scrollActiveIntoView() {
	$select.value
		?.querySelector<HTMLElement>('.option.active')
		?.scrollIntoView({block: 'nearest'})
	updateScrollArrows()
}

let autoScrollRAF: number | null = null

function startAutoScroll(dir: -1 | 1) {
	stopAutoScroll()
	const step = () => {
		const s = $select.value
		if (!s) return stopAutoScroll()

		if (dir > 0) {
			// Reveal more below: first grow the menu upward into the empty space
			// above (macOS-style), and only scroll the content once it has filled
			// the viewport.
			if (dropdownTop.value > VIEWPORT_MARGIN) {
				dropdownTop.value = Math.max(
					VIEWPORT_MARGIN,
					dropdownTop.value - AUTO_SCROLL_SPEED
				)
			} else {
				s.scrollTop += AUTO_SCROLL_SPEED
			}
		} else {
			s.scrollTop -= AUTO_SCROLL_SPEED
		}

		updateScrollArrows()
		const atEnd = dir < 0 ? !canScrollUp.value : !canScrollDown.value
		if (atEnd) return stopAutoScroll()
		autoScrollRAF = requestAnimationFrame(step)
	}
	autoScrollRAF = requestAnimationFrame(step)
}

function stopAutoScroll() {
	if (autoScrollRAF !== null) cancelAnimationFrame(autoScrollRAF)
	autoScrollRAF = null
}

// Wheel anywhere in the popup. Mirrors the chevron logic so wheeling and the
// arrows agree: grow the menu upward while there's room above, then scroll. Also
// keeps the wheel from falling through to the page when it lands on an arrow.
function onWheel(e: WheelEvent) {
	const s = $select.value
	if (!s) return

	const dy = e.deltaY * (e.deltaMode === 1 ? theme.inputHeight : 1)

	// Scrolling down with empty space above AND clipped content below → grow into
	// the space first, spill the rest into a content scroll. (The "clipped below"
	// guard stops a fully-visible list from drifting up off the input.)
	const visible = Math.min(s.scrollHeight, selectMaxHeight.value)
	const moreBelow = s.scrollTop + visible < s.scrollHeight - 0.5
	if (dy > 0 && dropdownTop.value > VIEWPORT_MARGIN && moreBelow) {
		e.preventDefault()
		const grow = Math.min(dy, dropdownTop.value - VIEWPORT_MARGIN)
		dropdownTop.value -= grow
		s.scrollTop += dy - grow
		updateScrollArrows()
		return
	}

	// Over an arrow (not the scroller itself): scroll the list manually so the
	// wheel doesn't scroll the page behind the popup.
	if (!s.contains(e.target as Node)) {
		e.preventDefault()
		s.scrollTop += dy
		updateScrollArrows()
	}
	// Otherwise let .select scroll natively (overscroll-behavior: contain stops
	// it chaining to the page); @scroll refreshes the arrows.
}

function onSelect(option: T) {
	model.value = option
}

function onPointerupWhileOpen() {
	const elapsedFromOpen = new Date().getTime() - (timeAtOpen ?? 0)

	if (elapsedFromOpen > 500) {
		open.value = false
		emit('confirm')
		emit('blur')
		window.removeEventListener('pointerup', onPointerupWhileOpen)
	} else {
		$input.value?.select()
	}
}

function onPressArrow(isUp: boolean) {
	const length = filteredOptions.value.length
	const index = filteredOptions.value.indexOf(model.value)
	const newIndex = unsignedMod(index + (isUp ? -1 : 1), length)
	const option = filteredOptions.value[newIndex]
	model.value = option
	nextTick(scrollActiveIntoView)
}

function onInputPointerdown(e: PointerEvent) {
	if (e.isPrimary) {
		open.value = true
	}
}

function onInputStringFocus() {
	open.value = true
	emit('focus')
}

function onInputStringUpdate(value: string) {
	display.value = value

	displayEdited.value = true
	open.value = true
}

function onInputStringBlur() {
	if (!open.value) {
		emit('blur')
	}
}

// When the popover is closed by pressing Esc, revert to the value at the start
function onPopoverUpdateOpen(_open: boolean) {
	if (!_open) {
		open.value = false
		window.removeEventListener('pointerup', onPointerupWhileOpen)
		model.value = valueAtStart.value
	}
}

onBeforeUnmount(() => {
	window.removeEventListener('pointerup', onPointerupWhileOpen)
	stopAutoScroll()
})
</script>

<template>
	<div
		ref="$root"
		class="TqInputDropdown"
		:class="{open}"
		v-bind="$attrs"
		:align="align"
		:disabled="disabled"
	>
		<InputString
			ref="$input"
			:modelValue="display"
			class="field"
			:theme="props.theme"
			:font="font"
			:align="align"
			:inline-position="inlinePosition"
			:block-position="blockPosition"
			:disabled="disabled"
			:invalid="invalid"
			@update:modelValue="onInputStringUpdate"
			@pointerdown="onInputPointerdown"
			@focus="onInputStringFocus"
			@blur="onInputStringBlur"
			@keydown.enter.prevent="open = !open"
			@keydown.up.prevent="onPressArrow(true)"
			@keydown.down.prevent="onPressArrow(false)"
		/>
		<Icon class="chevron" icon="mdi:unfold-more-horizontal" />
		<Popover
			:open="open"
			:reference="$root"
			:placement="popoverPlacement"
			:lightDismiss="false"
			@update:open="onPopoverUpdateOpen"
		>
			<div
				class="select-wrapper"
				:style="{width: rootBound.width.value + 2 + 'px'}"
				@wheel="onWheel"
			>
				<ul
					ref="$select"
					class="select"
					:style="{maxHeight: selectMaxHeight + 'px'}"
					:font="font"
					:align="align"
					@scroll="updateScrollArrows"
				>
					<li
						v-for="(item, index) in filteredOptions"
						:key="index"
						class="option"
						:class="{
							active: item === modelValue,
							current: item === valueAtStart,
						}"
						@pointerenter="onSelect(item)"
					>
						<slot name="option" :item="item">
							<Icon
								v-if="icons && icons[index]"
								class="option-icon"
								:icon="icons[index]"
							/>
							{{ labelizer(item) }}
						</slot>
					</li>
				</ul>
				<div
					v-if="canScrollUp"
					class="scroll-arrow top"
					@pointerenter="startAutoScroll(-1)"
					@pointerleave="stopAutoScroll"
					@pointerup.stop
				>
					<Icon icon="mdi:chevron-up" />
				</div>
				<div
					v-if="canScrollDown"
					class="scroll-arrow bottom"
					@pointerenter="startAutoScroll(1)"
					@pointerleave="stopAutoScroll"
					@pointerup.stop
				>
					<Icon icon="mdi:chevron-down" />
				</div>
			</div>
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

$right-arrow-width = 1em
$chevron-width = calc(.7 * var(--tq-input-height))

.TqInputDropdown
	position relative
	// flex-grow: fill the slot inside an InputGroup (like InputTextBase).
	// display:flex: let the field (InputString) stretch via its own flex-grow,
	// matching how InputNumber's box fills the group.
	display flex
	flex-grow 1
	height var(--tq-input-height)

// IMPORTANT: this class must NOT be `input`. InputTextBase has its own
// `.input { position: absolute; inset: 0 .5em }` for its internal text element;
// since InputString's root carries that same scope, naming the wrapper child
// `input` made the whole box absolutely positioned and shrink to content,
// leaving a ~.5em gap on each side instead of filling the width.
.field
	flex-grow 1
	cursor default
	padding-right $chevron-width

.chevron
	position absolute
	top 0
	z-index 10
	right 2px
	width $chevron-width
	height 100%
	pointer-events none
	color var(--tq-color-text-subtle)
	opacity .4
	hover-transition(opacity)

	.TqInputDropdown:hover &,
	.TqInputDropdown:focus-within &
		opacity 1

.select-wrapper
	position relative

.select
	margin 1px
	padding 0
	// max-height is set inline (selectMaxHeight) so it tracks the popover's top
	// edge and the box never spills past the bottom of the viewport. The list
	// scrolls inside and the arrows reveal the cropped parts.
	overflow-y auto
	overscroll-behavior contain
	// Growing the menu changes max-height; without this, scroll anchoring nudges
	// scrollTop to "keep content stable" and fights the grow (visible jitter).
	overflow-anchor none
	scrollbar-width none
	background set-alpha(--tq-color-input, .8)
	backdrop-filter blur(6px)
	border 1px solid var(--tq-color-border)
	border-radius var(--tq-radius-input)

	use-input-align()
	use-input-font()

	&::-webkit-scrollbar
		display none

// macOS-style crop indicators: a thin strip over each cropped edge; hovering it
// scrolls the list that way (see startAutoScroll).
.scroll-arrow
	position absolute
	left 2px
	right 2px
	height calc(var(--tq-input-height) * .7)
	display flex
	align-items center
	justify-content center
	color var(--tq-color-text)
	pointer-events auto
	cursor default
	z-index 20

	&.top
		top 1px
		border-radius var(--tq-radius-input) var(--tq-radius-input) 0 0
		background linear-gradient(to bottom, var(--tq-color-input) 45%, transparent)

	&.bottom
		bottom 1px
		border-radius 0 0 var(--tq-radius-input) var(--tq-radius-input)
		background linear-gradient(to top, var(--tq-color-input) 45%, transparent)

.option
	padding 0 $chevron-width 0 .5em
	height var(--tq-input-height)
	line-height var(--tq-input-height)
	display flex
	gap var(--tq-gap-related)
	align-items center
	align-content center
	justify-content center
	color var(--tq-color-text)
	border-radius var(--tq-radius-input)

	&.current
		background var(--tq-color-accent-soft)

	&.active
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.option-icon
	width calc(var(--tq-input-height) - 4px)
	height calc(var(--tq-input-height) - 4px)
</style>
