<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {clamp} from 'lodash-es'
import {computed, provide, ref, shallowRef, useTemplateRef} from 'vue'

import {useAppConfigStore} from '../stores/appConfig'
import ParameterGrid from './ParameterGrid.vue'
import {type TreeDrop, type TreeDropPosition, treeDropsAt, type TreeRow} from './treeDrop'
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

const items = new Set<ParameterTreeItemHandle>()

const dragging = shallowRef<{id: string; label: string} | null>(null)
const drop = shallowRef<TreeDrop | null>(null)
const ghost = ref<[number, number]>([0, 0])

provide(ParameterTreeContextKey, {
	register(item) {
		items.add(item)
		return () => items.delete(item)
	},
	draggingId: computed(() => dragging.value?.id ?? null),
	insideId: computed(() =>
		drop.value?.position === 'inside' ? drop.value.target : null
	),
})

let press: {id: string; label: string; x: number; y: number; pointerId: number} | null = null
let rows: TreeRow[] = []
let indent = 18
let originX = 0

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
}

function startDrag(id: string, label: string, pointerId: number) {
	const root = $root.value
	if (!root) return
	const style = getComputedStyle(root)
	indent = parseFloat(style.getPropertyValue('--tq-icon-size')) || indent
	originX = root.getBoundingClientRect().left
	rows = [...items]
		.map(item => ({item, rect: item.element()?.getBoundingClientRect()}))
		.filter(({rect}) => rect !== undefined)
		.sort((a, b) => a.rect!.top - b.rect!.top)
		.map(({item, rect}) => ({
			...(item.id() === undefined ? {} : {id: item.id()!}),
			depth: item.depth,
			top: rect!.top,
			bottom: rect!.bottom,
			open: item.open(),
			expandable: item.expandable(),
		}))
	dragging.value = {id, label}
	root.setPointerCapture(pointerId)
}

function onPointerMove(event: PointerEvent) {
	if (press && event.pointerId === press.pointerId) {
		const {x, y} = press
		if (Math.hypot(event.clientX - x, event.clientY - y) < DRAG_THRESHOLD) return
		startDrag(press.id, press.label, press.pointerId)
		press = null
	}
	const source = dragging.value?.id
	if (source === undefined) return
	ghost.value = [event.clientX, event.clientY]
	const candidates = treeDropsAt(rows, event.clientX - originX, event.clientY, indent)
	drop.value =
		candidates.find(({target, position}) =>
			props.canDrop!(source, target, position)
		) ?? null
}

function finishDrag(commit: boolean) {
	const source = dragging.value?.id
	const landed = drop.value
	press = null
	dragging.value = null
	drop.value = null
	if (commit && source !== undefined && landed !== null) {
		emit('move', source, landed.target, landed.position)
	}
}

useEventListener('keydown', (event: KeyboardEvent) => {
	if (event.key === 'Escape' && dragging.value) finishDrag(false)
})

const lineStyle = computed(() => {
	const root = $root.value
	const landed = drop.value
	if (!root || !landed || landed.position === 'inside') return null
	return {
		top: `${landed.y - root.getBoundingClientRect().top}px`,
		left: `${landed.depth * indent}px`,
	}
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
		<div v-if="lineStyle" class="drop-line" :style="lineStyle" />
		<div
			v-if="dragging"
			class="drag-ghost"
			:style="{left: `${ghost[0]}px`, top: `${ghost[1]}px`}"
		>
			{{ dragging.label }}
		</div>
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
.drop-line {
	position: absolute;
	right: 0;
	z-index: 4;
	height: 2px;
	margin-top: -1px;
	border-radius: 1px;
	background: var(--tq-color-accent);
	pointer-events: none;
}
.drag-ghost {
	position: fixed;
	z-index: 10;
	padding-inline: 0.5em;
	line-height: var(--tq-input-height);
	border-radius: var(--tq-radius-input);
	background: var(--tq-color-surface);
	box-shadow: 0 2px 12px var(--tq-color-shadow);
	color: var(--tq-color-text);
	transform: translate(8px, 8px);
	pointer-events: none;
}
</style>
