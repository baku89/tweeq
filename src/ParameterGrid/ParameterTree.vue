<script setup lang="ts">
import {useElementSize, useEventListener} from '@vueuse/core'
import {clamp} from 'lodash-es'
import {computed, nextTick, provide, ref, shallowRef, useTemplateRef} from 'vue'

import {useAppConfigStore} from '../stores/appConfig'
import ParameterGrid from './ParameterGrid.vue'
import {
	dropParentOf,
	gapTopOf,
	guideShiftsOf,
	liftedHeight,
	shiftsOf,
	subtreeEnd,
	type TreeDrop,
	type TreeDropPosition,
	treeDropsAt,
	type TreeRow,
} from './treeDrop'
import {
	ParameterTreeContextKey,
	type ParameterTreeItemHandle,
	type ParameterTreeProps,
} from './types'

const MIN_LABEL = 60
const MIN_VALUE = 120
const DRAG_THRESHOLD = 4

const props = withDefaults(defineProps<ParameterTreeProps>(), {
	labelWidth: 180,
})

const emit = defineEmits<{
	/** An item was dropped: `source` should go `position` of `target`. */
	move: [source: string, target: string, position: TreeDropPosition]
}>()

// A label column that fits its content would move every value at each opening
// and closing of a row, so it has a width of its own, kept under `name`.
const labelWidth = useAppConfigStore().ref(
	`${props.name}.labelWidth`,
	props.labelWidth
)

const $root = useTemplateRef<HTMLElement>('$root')
const resizing = ref(false)

function onResizeStart(event: PointerEvent) {
	event.stopPropagation()
	const handle = event.currentTarget as HTMLElement
	const startX = event.clientX
	const startWidth = labelWidth.value
	handle.setPointerCapture(event.pointerId)
	resizing.value = true

	const onMove = (move: PointerEvent) => {
		const max = ($root.value?.clientWidth ?? Infinity) - MIN_VALUE
		labelWidth.value = clamp(startWidth + move.clientX - startX, MIN_LABEL, max)
	}
	const onUp = () => {
		resizing.value = false
		handle.removeEventListener('pointermove', onMove)
		handle.removeEventListener('pointerup', onUp)
		handle.removeEventListener('pointercancel', onUp)
	}
	handle.addEventListener('pointermove', onMove)
	handle.addEventListener('pointerup', onUp)
	handle.addEventListener('pointercancel', onUp)
}

//------------------------------------------------------------------------------
// Moving items around the tree

const {width: rootWidth} = useElementSize($root)
// Less the grid's own inset, and the gap between its columns.
const valueWidth = computed(() =>
	rootWidth.value === 0
		? 0
		: Math.max(0, rootWidth.value - labelWidth.value - 3 - gapControl.value)
)
const gapControl = computed(() =>
	rootWidth.value === 0 || !$root.value
		? 0
		: parseFloat(getComputedStyle($root.value).getPropertyValue('--tq-gap-control')) || 0
)

const items = new Set<ParameterTreeItemHandle>()

const dragging = shallowRef<{id: string; label: string} | null>(null)
const drop = shallowRef<TreeDrop | null>(null)

provide(ParameterTreeContextKey, {
	register(item) {
		items.add(item)
		return () => items.delete(item)
	},
	insideId: computed(() =>
		drop.value?.position === 'inside' ? drop.value.target : null
	),
	valueWidth,
})

let press: {id: string; label: string; x: number; y: number; pointerId: number} | null = null
let rows: TreeRow[] = []
let elements: HTMLElement[] = []
/** The rows being dragged, by where they are in `rows`, and where the pointer began. */
let lifted = {from: 0, to: 0, y: 0}
let indent = 18
let originTop = 0
/** Where a row at depth 0 starts, within the tree. */
let baseLeft = 0
/** Where the pointer began, and the level of what it took: it goes by how far it goes. */
let pressX = 0
let liftedDepth = 0
/** Where it would land, and how much room it takes up there. */
const landing = shallowRef<{top: number; left: number; height: number} | null>(null)

function onPointerDown(event: PointerEvent) {
	if (event.button !== 0 || !props.canDrop) return
	const target = event.target as Element
	if (target.closest('button, input, textarea')) return
	const handle = target.closest<HTMLElement>('[data-tq-tree-handle]')
	if (!handle) return
	press = {
		id: handle.dataset.tqTreeHandle!,
		label: handle.querySelector('.name')?.textContent ?? '',
		x: event.clientX,
		y: event.clientY,
		pointerId: event.pointerId,
	}
	pressX = event.clientX
}

function startDrag(id: string, label: string, pointerId: number, y: number) {
	const root = $root.value
	if (!root) return
	indent = root.querySelector('.toggle')?.getBoundingClientRect().width || indent
	const origin = root.getBoundingClientRect()
	originTop = origin.top
	const showing = [...items]
		.map(item => ({
			item,
			element: item.element(),
			rect: item.element()?.getBoundingClientRect(),
		}))
		.filter(({rect}) => rect !== undefined)
		.sort((a, b) => a.rect!.top - b.rect!.top)
	rows = showing.map(({item, rect}) => ({
		...(item.id() === undefined ? {} : {id: item.id()!}),
		depth: item.depth,
		top: rect!.top,
		bottom: rect!.bottom,
		open: item.open(),
		expandable: item.expandable(),
	}))
	elements = showing.map(({element}) => element!)
	const from = rows.findIndex(row => row.id === id)
	lifted = {from, to: subtreeEnd(rows, from), y}
	liftedDepth = rows[from]?.depth ?? 0
	const start = elements[from]?.querySelector('.row')?.getBoundingClientRect().left
	baseLeft = (start ?? origin.left) - origin.left - liftedDepth * indent
	for (const element of liftedElements()) element.classList.add('lifted')
	dragging.value = {id, label}
	root.setPointerCapture(pointerId)
}

/** The row being dragged, and what it holds, which go together. */
function liftedElements(): HTMLElement[] {
	const row = elements[lifted.from]
	if (!row) return []
	const inside = row.nextElementSibling
	return inside?.classList.contains('children') ? [row, inside as HTMLElement] : [row]
}

/** The dragged row at the pointer, at the level it would land, and the rest around it. */
function layOut(pointerY: number) {
	const landed = drop.value
	const shifts = shiftsOf(
		rows,
		lifted.from,
		lifted.to,
		landed === null || landed.position === 'inside' ? null : landed.y
	)
	elements.forEach((element, i) => {
		if (i < lifted.from || i >= lifted.to) {
			element.style.transform = shifts[i] ? `translateY(${shifts[i]}px)` : ''
		}
	})
	const level =
		landed === null
			? 0
			: landed.depth + (landed.position === 'inside' ? 1 : 0) - rows[lifted.from]!.depth
	for (const element of liftedElements()) {
		element.style.translate = `${level * indent}px`
		element.style.transform = `translateY(${pointerY - lifted.y}px)`
	}
	layOutGuides(landed)
	landing.value =
		landed === null || landed.position === 'inside'
			? null
			: {
					top: gapTopOf(rows, lifted.from, lifted.to, landed.y) - originTop,
					left: baseLeft + landed.depth * indent,
					height: Math.max(
						0,
						liftedHeight(rows, lifted.from, lifted.to) - gapBelowLifted()
					),
				}
}

const gapBelowLifted = () => {
	const last = rows[lifted.to - 1]
	const after = rows[lifted.to]
	const before = rows[lifted.from - 1]
	const first = rows[lifted.from]
	return last && after
		? after.top - last.bottom
		: first && before
			? first.top - before.bottom
			: 0
}

/** The guides go with the rows, and the one it would land along says so. */
function layOutGuides(landed: TreeDrop | null) {
	const guides = guideShiftsOf(rows, lifted.from, lifted.to, landed)
	const parent =
		landed === null ? null : dropParentOf(rows, lifted.from, lifted.to, landed)
	elements.forEach((element, i) => {
		const children = element.nextElementSibling
		if (!(children instanceof HTMLElement) || !children.classList.contains('children')) return
		const guide = guides.get(i)
		children.style.setProperty('--guide-top', `${guide?.top ?? 0}px`)
		children.style.setProperty('--guide-bottom', `${guide?.bottom ?? 0}px`)
		children.classList.toggle('drop-parent', i === parent)
	})
}

function clearGuides() {
	for (const element of elements) {
		const children = element.nextElementSibling
		if (!(children instanceof HTMLElement) || !children.classList.contains('children')) continue
		children.style.removeProperty('--guide-top')
		children.style.removeProperty('--guide-bottom')
		children.classList.remove('drop-parent')
	}
}

/** Everything back in its place, and where the dragged row had got to. */
function settle(): number | undefined {
	const top = elements[lifted.from]?.getBoundingClientRect().top
	for (const element of liftedElements()) element.classList.remove('lifted')
	const inside = liftedElements()[1]
	if (inside) {
		inside.style.transform = ''
		inside.style.translate = ''
	}
	for (const element of elements) {
		element.style.transform = ''
		element.style.translate = ''
	}
	clearGuides()
	landing.value = null
	elements = []
	return top
}

function onPointerMove(event: PointerEvent) {
	if (press && event.pointerId === press.pointerId) {
		const {x, y} = press
		if (Math.hypot(event.clientX - x, event.clientY - y) < DRAG_THRESHOLD) return
		startDrag(press.id, press.label, press.pointerId, y)
		press = null
	}
	const source = dragging.value?.id
	if (source === undefined) return
	// Among the rows that stay, as what is dragged cannot land next to itself. To the
	// right is a level in, and to the left a level out, from wherever it was taken.
	const staying = rows.filter((_, i) => i < lifted.from || i >= lifted.to)
	const x = (liftedDepth + 0.5) * indent + event.clientX - pressX
	const candidates = treeDropsAt(staying, x, event.clientY, indent)
	drop.value =
		candidates.find(({target, position}) =>
			props.canDrop!(source, target, position)
		) ?? null
	layOut(event.clientY)
}

function finishDrag(commit: boolean) {
	const source = dragging.value?.id
	const landed = drop.value
	press = null
	if (source === undefined) return
	const top = settle()
	dragging.value = null
	drop.value = null
	if (!commit || landed === null) return
	emit('move', source, landed.target, landed.position)
	// From where it was let go of, to where it has gone, if it is still that row.
	void nextTick(() => {
		const element = [...items].find(item => item.id() === source)?.element()
		if (!element || top === undefined) return
		const from = top - element.getBoundingClientRect().top
		element.animate([{transform: `translateY(${from}px)`}, {transform: 'none'}], {
			duration: 180,
			easing: 'cubic-bezier(0.2, 0, 0, 1)',
		})
	})
}

useEventListener('keydown', (event: KeyboardEvent) => {
	if (event.key === 'Escape' && dragging.value) finishDrag(false)
})
</script>

<template>
	<div
		ref="$root"
		class="TqParameterTree"
		:class="{dragging: dragging !== null}"
		:style="{'--label-width': `${labelWidth}px`}"
		@pointerdown="onPointerDown"
		@pointermove="onPointerMove"
		@pointerup="finishDrag(true)"
		@pointercancel="finishDrag(false)"
	>
		<!-- Rows of one tree sit closer than one tree does to the next. -->
		<ParameterGrid class="grid">
			<slot />
		</ParameterGrid>
		<div class="resizer" :class="{resizing}" @pointerdown="onResizeStart" />
		<div
			v-if="landing"
			class="landing"
			:style="{
				top: `${landing.top}px`,
				left: `${landing.left}px`,
				height: `${landing.height}px`,
			}"
		/>
	</div>
</template>

<style scoped>
.TqParameterTree {
	position: relative;
}
.TqParameterTree.dragging {
	cursor: grabbing;
}
.TqParameterGrid.grid {
	grid-template-columns: var(--label-width) minmax(0, 1fr);
	row-gap: var(--tq-gap-related);
}
.grid :deep(.TqInputArray),
.grid :deep(.TqInputArrayItem) {
	row-gap: var(--tq-gap-related);
}
.TqParameterGrid.grid > :deep(.TqInputArray) {
	row-gap: var(--tq-gap-control);
}
/* In the gap between the columns, and seen only when reached for. */
.resizer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: calc(3px + var(--label-width));
	z-index: 3;
	width: var(--tq-gap-control);
	cursor: col-resize;
	touch-action: none;
}
.resizer::after {
	content: '';
	position: absolute;
	top: 0;
	bottom: 0;
	left: calc(50% - 0.5px);
	width: 1px;
	background: var(--tq-color-border);
	opacity: 0;
	transition: opacity var(--tq-hover-transition-duration);
}
.resizer:hover::after,
.resizer.resizing::after {
	opacity: 1;
}
/* What is in the way slides aside, and what is dragged goes by the pointer. */
.TqParameterTree.dragging :deep(.TqParameterTreeItem) {
	transition: transform 180ms cubic-bezier(0.2, 0, 0, 1);
}
.TqParameterTree.dragging :deep(.children)::before {
	transition:
		top 180ms cubic-bezier(0.2, 0, 0, 1),
		bottom 180ms cubic-bezier(0.2, 0, 0, 1);
}
/* Up and down it follows the pointer, and it steps from level to level. */
.TqParameterTree.dragging :deep(.lifted) {
	position: relative;
	z-index: 5;
	transition: translate 120ms cubic-bezier(0.2, 0, 0, 1);
	pointer-events: none;
}
/* Where it would land, at the level it would land. */
.landing {
	position: absolute;
	right: 0;
	border-radius: var(--tq-radius-input);
	background: var(--tq-color-accent-soft);
	box-shadow: inset 2px 0 0 var(--tq-color-accent);
	pointer-events: none;
	transition:
		top 180ms cubic-bezier(0.2, 0, 0, 1),
		left 120ms cubic-bezier(0.2, 0, 0, 1);
}
.TqParameterTree.dragging :deep(.TqParameterTreeItem.lifted) {
	border-radius: var(--tq-radius-input);
	background: var(--tq-color-surface);
	box-shadow: 0 2px 12px var(--tq-color-shadow);
}
</style>
