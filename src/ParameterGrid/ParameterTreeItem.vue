<script lang="ts">
import {computed, inject, provide, ref, shallowRef, useTemplateRef} from 'vue'

import {Icon} from '../Icon'
import {Menu} from '../Menu'
import {Popover} from '../Popover'
import Parameter from './Parameter.vue'
import {ParameterTreeDepthKey, type ParameterTreeItemProps} from './types'

// One drag at a time, across every tree.
const dragged = shallowRef<{group: string; index: number} | null>(null)
</script>

<script setup lang="ts">
// A row without an icon keeps the rhythm of those with one.
const DOT = 'fill:M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'

const props = defineProps<ParameterTreeItemProps>()

const open = defineModel<boolean>('open', {default: false})

const emit = defineEmits<{
	select: []
	/** The item at `from` in this group should move to be at `to`. */
	sort: [from: number, to: number]
}>()

defineSlots<{
	/** The value column. */
	default?: () => any
	/** Items one level down, rendered while open. */
	children?: () => any
}>()

const depth = inject(ParameterTreeDepthKey, 0)
provide(ParameterTreeDepthKey, depth + 1)

const sortable = computed(
	() => props.sortGroup !== undefined && props.sortIndex !== undefined
)
const dropSide = ref<'before' | 'after' | null>(null)

function onDragStart(event: DragEvent) {
	if (!sortable.value || event.dataTransfer === null) return
	event.dataTransfer.effectAllowed = 'move'
	event.dataTransfer.setData('text/plain', props.label)
	dragged.value = {group: props.sortGroup!, index: props.sortIndex!}
}

function onDragEnd() {
	dragged.value = null
}

function onDragOver(event: DragEvent) {
	const from = dragged.value
	if (from === null || from.group !== props.sortGroup || from.index === props.sortIndex) {
		return
	}
	event.preventDefault()
	const {top, height} = (event.currentTarget as HTMLElement).getBoundingClientRect()
	dropSide.value = event.clientY < top + height / 2 ? 'before' : 'after'
}

function onDrop(event: DragEvent) {
	const from = dragged.value
	const side = dropSide.value
	dropSide.value = null
	if (from === null || side === null) return
	event.preventDefault()
	const at = props.sortIndex! + (side === 'after' ? 1 : 0)
	emit('sort', from.index, from.index < at ? at - 1 : at)
}

const $label = useTemplateRef<HTMLElement>('$label')
const menuPosition = ref<[number, number] | null>(null)

function onContextMenu(event: MouseEvent) {
	event.preventDefault()
	emit('select')
	if (props.menuItems?.length) {
		menuPosition.value = [event.clientX, event.clientY]
	}
}
</script>

<template>
	<Parameter
		class="TqParameterTreeItem"
		:class="[{selected, top: depth === 0}, dropSide && `drop-${dropSide}`]"
		:hint="hint"
		@dragover="onDragOver"
		@dragleave="dropSide = null"
		@drop="onDrop"
	>
		<template #label>
			<span
				ref="$label"
				class="row"
				:class="{open: expandable && open}"
				:style="{'--depth': depth}"
				:draggable="sortable || undefined"
				@dragstart="onDragStart"
				@dragend="onDragEnd"
				@click="emit('select')"
				@contextmenu="onContextMenu"
			>
				<button
					v-if="expandable"
					class="toggle"
					type="button"
					@click.stop="open = !open"
				>
					<Icon class="chevron" icon="mdi:chevron-down" />
				</button>
				<span v-else class="toggle" />
				<Icon class="icon" :icon="icon ?? DOT" />
				<span class="name">{{ label }}</span>
			</span>
			<!-- Teleported, or the grid's subgrid would clip the fixed popover. -->
			<Popover
				v-if="menuPosition"
				:reference="$label"
				:placement="menuPosition"
				:open="true"
				teleport=".TqViewport"
				@update:open="$event || (menuPosition = null)"
			>
				<Menu :items="menuItems ?? []" @close="menuPosition = null" />
			</Popover>
		</template>
		<slot />
	</Parameter>
	<slot v-if="expandable && open" name="children" />
</template>

<style scoped>
.TqParameterTreeItem {
	position: relative;
	isolation: isolate;
	--inset: calc((var(--tq-input-height) - var(--tq-icon-size)) / 2);
}
.TqParameterTreeItem.top:not(:first-child) {
	margin-top: calc(var(--tq-gap-control) - var(--tq-gap-related));
}
.TqParameterTreeItem.drop-before {
	box-shadow: 0 -2px 0 var(--tq-color-accent);
}
.TqParameterTreeItem.drop-after {
	box-shadow: 0 2px 0 var(--tq-color-accent);
}
/* A row is as tall as its value, which may have many lines. */
.TqParameterTreeItem :deep(.label) {
	align-self: stretch;
	height: auto;
}
/* Behind the row, so that inputs keep their own colors. */
.TqParameterTreeItem.selected::after {
	content: '';
	position: absolute;
	inset: calc(var(--tq-gap-related) / -2) 0 calc(var(--tq-gap-related) / -2) -3px;
	z-index: -1;
	border-radius: var(--tq-radius-input);
	background: var(--tq-color-accent-soft);
	pointer-events: none;
}
.row {
	position: relative;
	display: flex;
	align-items: flex-start;
	align-self: stretch;
	/* The whole label column selects, not only the text in it. */
	flex: 1 0 auto;
	padding-left: calc(var(--depth) * var(--tq-icon-size));
	cursor: pointer;
}
/* One line for each level this row is inside, under that level's chevron. */
.row::before {
	content: '';
	position: absolute;
	top: calc(-1 * var(--tq-gap-related));
	bottom: 0;
	left: 0;
	width: calc(var(--depth) * var(--tq-icon-size));
	pointer-events: none;
	background: repeating-linear-gradient(
		to right,
		transparent 0 calc(var(--tq-icon-size) / 2),
		var(--tq-color-border) 0 calc(var(--tq-icon-size) / 2 + 1px),
		transparent 0 var(--tq-icon-size)
	);
}
/* The start of that line, just below the tip of an open chevron. */
.row.open::after {
	content: '';
	position: absolute;
	top: calc(var(--inset) + var(--tq-icon-size) * 0.64 + 4px);
	/* The first child's line takes over from here. They would darken if they met. */
	bottom: 0;
	left: calc((var(--depth) + 0.5) * var(--tq-icon-size));
	width: 1px;
	pointer-events: none;
	background: var(--tq-color-border);
}
.toggle {
	display: block;
	flex-shrink: 0;
	width: var(--tq-icon-size);
	height: var(--tq-icon-size);
	margin-top: var(--inset);
	color: var(--tq-color-text-mute);
	cursor: pointer;
}
.chevron {
	display: block;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);
	transition: transform var(--tq-hover-transition-duration) ease;
}
.row.open .chevron {
	transform: none;
}
.icon {
	flex-shrink: 0;
	width: var(--tq-icon-size);
	height: var(--tq-icon-size);
	margin-top: var(--inset);
	margin-right: var(--tq-gap-related);
	color: var(--tq-color-text-subtle);
}
</style>
