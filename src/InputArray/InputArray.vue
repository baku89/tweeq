<script setup lang="ts" generic="T">
/**
 * An editor for an array, with each item laid out by the default slot. What it
 * lets you do is up to the options:
 *
 * - `sortable`: a drag handle on each item, or none with `handleless`. The item
 *   follows the pointer and the others slide out of its way.
 * - `removable`: a delete button on each item.
 * - `appendable`: an Add button making an item with `create`. The `add` slot
 *   replaces it, for an item that needs asking about first.
 *
 * Every edit comes as `update:modelValue`. `add` and `remove` say which edit it
 * was, for a parent whose array is only a view of something else.
 *
 * On a grid (a `ParameterGrid`, say) the list and its items take the grid's
 * columns as subgrids, so `Parameter`s and bare cells line up with the rows around
 * the list. The handle and the button hang in gutters at the ends of the item, so
 * they take no column. A `TableHeader` in the `header` slot gets the same gutters.
 */
import {computed, nextTick, ref, shallowRef, useTemplateRef, watch} from 'vue'

import {Icon} from '../Icon'
import {InputButton} from '../InputButton'
import {dropIndex, moveItem} from './utils'

type Key = string | number

const props = defineProps<{
	modelValue: readonly T[]
	/** What identifies an item: a property name, or a function of the item. */
	itemKey: keyof T | ((item: T) => Key)
	/** Items can be reordered by dragging. */
	sortable?: boolean
	/**
	 * No drag handle of its own: whatever in an item has `data-tq-array-handle`
	 * is one. A drag starts once the pointer has moved, so that it can still be
	 * clicked.
	 */
	handleless?: boolean
	/** Items can be removed: all of them, or those this returns true for. */
	removable?: boolean | ((item: T) => boolean)
	/** Items can be added. */
	appendable?: boolean
	/** Makes a new item for the Add button. */
	create?: () => T
	/** Label of the Add button. */
	addLabel?: string
	/**
	 * Emit `update:modelValue` at each step of a drag, not once on release. Use it
	 * when what's behind the list should follow along.
	 */
	live?: boolean
}>()

const emit = defineEmits<{
	'update:modelValue': [items: T[]]
	add: [item: T]
	remove: [item: T, index: number]
	/** An edit is finished: an item added or removed, or a drag that changed the order. */
	confirm: []
}>()

defineSlots<{
	default(props: {item: T; index: number; dragging: boolean}): any
	header(): any
	add(): any
}>()

const DURATION = 180
const EASING = 'cubic-bezier(0.2, 0, 0, 1)'
const ANIMATION_ID = 'tq-input-array'

function keyOf(item: T): Key {
	return typeof props.itemKey === 'function'
		? props.itemKey(item)
		: (item[props.itemKey] as Key)
}

const $root = useTemplateRef<HTMLElement>('$root')
const elements = new Map<Key, HTMLElement>()

function setElement(key: Key, el: unknown) {
	if (el) elements.set(key, el as HTMLElement)
	else elements.delete(key)
}

/** The order while dragging; the model always supplies the items themselves. */
const dragOrder = shallowRef<Key[] | null>(null)
const draggingKey = ref<Key | null>(null)
const settlingKey = ref<Key | null>(null)

const items = computed<readonly T[]>(() => {
	if (!dragOrder.value) return props.modelValue
	const byKey = new Map(props.modelValue.map(item => [keyOf(item), item]))
	const ordered = dragOrder.value.flatMap(key => {
		const item = byKey.get(key)
		byKey.delete(key)
		return item === undefined ? [] : [item]
	})
	// Anything added while dragging goes at the end.
	return [...ordered, ...byKey.values()]
})

//------------------------------------------------------------------------------
// Adding and removing

function add() {
	if (!props.create) return
	const item = props.create()
	emit('update:modelValue', [...props.modelValue, item])
	emit('add', item)
	emit('confirm')
}

function canRemove(item: T) {
	return typeof props.removable === 'function' ? props.removable(item) : !!props.removable
}

function remove(item: T, index: number) {
	const key = keyOf(item)
	emit('update:modelValue', props.modelValue.filter(other => keyOf(other) !== key))
	emit('remove', item, index)
	emit('confirm')
}

//------------------------------------------------------------------------------
// Sliding: remember where everything was, then play from there to the new place.
// The rects include any slide under way, so a slide interrupted by the next step
// carries on from where it is rather than jumping.

function slide(el: HTMLElement, from: number) {
	for (const animation of el.getAnimations()) {
		if (animation.id === ANIMATION_ID) animation.cancel()
	}
	const delta = from - el.getBoundingClientRect().top
	if (Math.abs(delta) < 0.5) return null
	const animation = el.animate(
		[{transform: `translateY(${delta}px)`}, {transform: 'none'}],
		{duration: DURATION, easing: EASING}
	)
	animation.id = ANIMATION_ID
	return animation
}

let tops = new Map<Key, number>()

const orderSignature = computed(() => items.value.map(keyOf).join('\0'))

watch(
	orderSignature,
	() => {
		tops = new Map([...elements].map(([key, el]) => [key, el.getBoundingClientRect().top]))
	},
	{flush: 'pre'}
)

watch(
	orderSignature,
	() => {
		for (const [key, el] of elements) {
			if (key === draggingKey.value) continue
			const top = tops.get(key)
			if (top !== undefined) slide(el, top)
			// New here: nothing to slide from.
			else el.animate([{opacity: 0}, {opacity: 1}], {duration: DURATION, easing: EASING})
		}
		placeDragged()
	},
	{flush: 'post'}
)

//------------------------------------------------------------------------------
// Dragging

let drag: {
	key: Key
	el: HTMLElement
	pointerId: number
	startY: number
	startTop: number
	/** Where the item's top edge should be, in the list's coordinates. */
	top: number
	minTop: number
	maxTop: number
	initial: readonly T[]
} | null = null

function placeDragged() {
	if (!drag) return
	drag.el.style.transform = `translateY(${drag.top - drag.el.offsetTop}px)`
}

/** Pressed on a handle of a `handleless` list, and not yet moved far enough. */
let pending: {key: Key; el: HTMLElement; event: PointerEvent} | null = null

const DRAG_THRESHOLD = 4

function onPointerDown(e: PointerEvent) {
	if (e.button !== 0 || drag || !props.sortable) return
	const target = e.target as Element
	const itemEl = target.closest('[data-tq-array-handle]')?.closest('.TqInputArrayItem')
	// A handle of this list, not of a list nested inside an item.
	if (!itemEl || itemEl.parentElement !== $root.value) return
	const key = [...elements].find(([, el]) => el === itemEl)?.[0]
	if (key === undefined) return

	if (props.handleless) {
		pending = {key, el: itemEl as HTMLElement, event: e}
		return
	}
	startDrag(key, itemEl as HTMLElement, e)
}

function startDrag(key: Key, el: HTMLElement, e: PointerEvent) {
	e.preventDefault()
	for (const animation of el.getAnimations()) {
		if (animation.id === ANIMATION_ID) animation.cancel()
	}
	const all = [...elements.values()]
	drag = {
		key,
		el,
		pointerId: e.pointerId,
		startY: e.clientY,
		startTop: el.offsetTop,
		top: el.offsetTop,
		minTop: Math.min(...all.map(item => item.offsetTop)),
		maxTop: Math.max(...all.map(item => item.offsetTop + item.offsetHeight)) - el.offsetHeight,
		initial: props.modelValue,
	}
	draggingKey.value = key
	settlingKey.value = null
	dragOrder.value = props.modelValue.map(keyOf)
	// On the list, which stays put: Vue moving the item in the DOM would drop it.
	$root.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
	if (pending && e.pointerId === pending.event.pointerId) {
		const {key, el, event} = pending
		const distance = Math.hypot(e.clientX - event.clientX, e.clientY - event.clientY)
		if (distance < DRAG_THRESHOLD) return
		pending = null
		startDrag(key, el, event)
	}
	if (!drag || e.pointerId !== drag.pointerId) return
	const {minTop, maxTop, startTop, startY} = drag
	drag.top = Math.min(maxTop, Math.max(minTop, startTop + e.clientY - startY))
	placeDragged()

	const keys = dragOrder.value as Key[]
	const from = keys.indexOf(drag.key)
	const els = keys.map(key => elements.get(key))
	if (els.some(el => !el)) return
	const heights = els.map(el => (el as HTMLElement).offsetHeight)
	const to = dropIndex(heights, from, rowGap(), drag.top - minTop)
	if (to === from) return

	dragOrder.value = moveItem(keys, from, to)
	if (props.live) emit('update:modelValue', [...items.value])
}

function rowGap() {
	return $root.value ? parseFloat(getComputedStyle($root.value).rowGap) || 0 : 0
}

function endDrag(commit: boolean) {
	if (!drag) return
	const {key, el, initial} = drag
	const from = el.getBoundingClientRect().top
	const initialKeys = initial.map(keyOf)
	const changed = items.value.map(keyOf).some((k, i) => k !== initialKeys[i])

	if (changed) {
		if (commit && !props.live) emit('update:modelValue', [...items.value])
		// Called off (the pointer was taken away): a live drag has to go back.
		if (!commit && props.live) emit('update:modelValue', [...initial])
	}

	drag = null
	draggingKey.value = null
	settlingKey.value = key
	dragOrder.value = null
	el.style.transform = ''

	if (changed && commit) emit('confirm')

	// Whatever the parent did with the emit, glide from under the pointer to the
	// item's place. Stays on top of the others until it lands.
	nextTick(() => {
		const clear = () => {
			if (settlingKey.value === key) settlingKey.value = null
		}
		const animation = slide(el, from)
		if (animation) animation.onfinish = animation.oncancel = clear
		else clear()
	})
}

function onPointerUp(e: PointerEvent) {
	pending = null
	if (drag && e.pointerId === drag.pointerId) endDrag(true)
}

function onPointerCancel(e: PointerEvent) {
	pending = null
	if (drag && e.pointerId === drag.pointerId) endDrag(false)
}
</script>

<template>
	<div
		ref="$root"
		class="TqInputArray"
		:class="{sortable: sortable && !handleless, removable: !!removable}"
		@pointerdown="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="onPointerUp"
		@pointercancel="onPointerCancel"
	>
		<div v-if="$slots.header" class="row">
			<slot name="header" />
		</div>
		<div
			v-for="(item, index) in items"
			:key="keyOf(item)"
			:ref="el => setElement(keyOf(item), el)"
			class="row TqInputArrayItem"
			:class="{
				dragging: keyOf(item) === draggingKey,
				settling: keyOf(item) === settlingKey,
			}"
		>
			<span v-if="sortable && !handleless" class="handle" data-tq-array-handle>
				<Icon icon="mdi:drag-vertical" />
			</span>
			<slot :item="item" :index="index" :dragging="keyOf(item) === draggingKey" />
			<button
				v-if="removable"
				type="button"
				class="remove"
				aria-label="Remove"
				:disabled="!canRemove(item)"
				@mousedown.prevent
				@click="remove(item, index)"
			>
				<Icon class="remove-icon" icon="mdi:close-thick" />
			</button>
		</div>
		<div v-if="appendable" class="add">
			<slot name="add">
				<InputButton icon="mdi:plus" :label="addLabel ?? 'Add'" subtle @click="add" />
			</slot>
		</div>
	</div>
</template>

<style lang="stylus" scoped>
// `position relative` makes the list the items' offsetParent. Both levels are
// subgrids of whatever grid they are on, and take its alignment and column gap.
// The rows are its own: items are independent controls, whatever the grid does.
.TqInputArray
	--handle-gutter 16px
	--remove-size 16px
	--remove-gutter calc(var(--remove-size) + var(--tq-gap-control))
	position relative
	display grid
	grid-column 1 / -1
	grid-template-columns subgrid
	row-gap var(--tq-gap-control)
	column-gap inherit
	align-items inherit

	&.sortable > .row
		padding-left var(--handle-gutter)

	&.removable > .row
		padding-right var(--remove-gutter)

.row
	position relative
	display grid
	grid-column 1 / -1
	grid-template-columns subgrid
	align-items inherit

.TqInputArrayItem
	border-radius var(--tq-radius-input)

	&.dragging
	&.settling
		z-index 1

	&.dragging
		background var(--tq-color-surface)
		box-shadow 0 2px 12px var(--tq-color-shadow)

		.handle
			cursor grabbing

.handle
	position absolute
	left 0
	top 0
	width var(--handle-gutter)
	height var(--tq-input-height)
	display flex
	align-items center
	justify-content center
	color var(--tq-color-text-mute)
	cursor grab
	touch-action none

	&:hover
		color var(--tq-color-text)

.remove
	position absolute
	right 0
	top calc((var(--tq-input-height) - var(--remove-size)) / 2)
	width var(--remove-size)
	height var(--remove-size)
	display flex
	align-items center
	justify-content center
	border-radius 50%
	border 1px solid var(--tq-color-text-mute)
	color var(--tq-color-text-mute)
	cursor pointer
	transition background var(--tq-hover-transition-duration), border-color var(--tq-hover-transition-duration), color var(--tq-hover-transition-duration)

	// Quiet until it is about to act, like a button lighting up with the accent,
	// but in the semantic color.
	&:not(:disabled):hover
		background var(--tq-color-error)
		border-color var(--tq-color-error)
		color var(--tq-color-on-error)

	&:focus-visible
		outline 1px solid var(--tq-color-accent)
		outline-offset 1px

	&:disabled
		opacity .3
		cursor not-allowed

.remove-icon
	width 12px
	height 12px

.add
	grid-column 1 / -1
</style>
