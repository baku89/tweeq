<script setup lang="ts">
import {
	computed,
	inject,
	nextTick,
	onBeforeUnmount,
	provide,
	ref,
	useTemplateRef,
	watch,
} from 'vue'

import {Icon} from '../Icon'
import {InputTextBase} from '../InputTextBase'
import {Menu} from '../Menu'
import {Popover} from '../Popover'
import {vTooltip} from '../Tooltip'
import Parameter from './Parameter.vue'
import {
	ParameterTreeContextKey,
	ParameterTreeDepthKey,
	type ParameterTreeItemProps,
} from './types'

// A row without an icon keeps the rhythm of those with one.
const DOT = 'fill:M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'

const props = defineProps<ParameterTreeItemProps>()

const open = defineModel<boolean>('open', {default: false})

const renaming = defineModel<boolean>('renaming', {default: false})

const emit = defineEmits<{
	select: []
	/** A new name was confirmed. Nothing changes as it is typed. */
	rename: [name: string]
	add: []
}>()

defineSlots<{
	/** The value column. */
	default?: () => any
	/** Items one level down, rendered while open. */
	children?: () => any
	/** Takes the place of the label and the value, across both columns. */
	wide?: () => any
}>()

const depth = inject(ParameterTreeDepthKey, 0)
provide(ParameterTreeDepthKey, depth + 1)

const $label = useTemplateRef<HTMLElement>('$label')

const $rename = useTemplateRef<{select: () => void}>('$rename')
const draftName = ref('')
const nameIsFine = computed(
	() => props.canRename === undefined || props.canRename(draftName.value)
)

watch(
	renaming,
	async on => {
		if (!on) return
		draftName.value = props.labelSource ?? props.label
		await nextTick()
		$rename.value?.select()
	},
	{immediate: true}
)

function onNameClick() {
	if (props.renamable) renaming.value = true
}

function confirmRename() {
	if (!renaming.value) return
	renaming.value = false
	const source = props.labelSource ?? props.label
	if (nameIsFine.value && draftName.value !== source) emit('rename', draftName.value)
}

function onRenameKey(event: KeyboardEvent) {
	if (event.key === 'Escape') {
		event.stopPropagation()
		renaming.value = false
	}
}

defineExpose({
	/** Bring the row into view. */
	scrollIntoView: () => $label.value?.scrollIntoView({block: 'nearest'}),
})

function onDoubleClick() {
	if (!renaming.value && props.expandable) open.value = !open.value
}

const tree = inject(ParameterTreeContextKey, null)
const unregister = tree?.register({
	depth,
	id: () => props.dragId,
	open: () => open.value,
	expandable: () => props.expandable ?? false,
	element: () => $label.value?.closest<HTMLElement>('.TqParameterTreeItem') ?? undefined,
})
onBeforeUnmount(() => unregister?.())

const isDragged = computed(
	() => props.dragId !== undefined && tree?.draggingId.value === props.dragId
)
const isDropTarget = computed(
	() => props.dragId !== undefined && tree?.insideId.value === props.dragId
)
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
	<li
		v-if="$slots.wide"
		class="TqParameterTreeItem wide"
		:class="{'gap-after': gapAfter}"
		:style="{'--depth': depth}"
	>
		<span class="toggle" />
		<Icon class="icon" :icon="icon ?? DOT" />
		<div class="wide-content">
			<slot name="wide" />
		</div>
	</li>
	<Parameter
		v-else
		class="TqParameterTreeItem"
		:class="{
			selected,
			top: depth === 0,
			dragged: isDragged,
			'drop-target': isDropTarget,
			'gap-after': gapAfter,
		}"
		:hint="hint"
	>
		<template #label>
			<span
				ref="$label"
				class="row"
				:class="{open: expandable && open}"
				:style="{'--depth': depth}"
				:data-tq-array-handle="sortHandle ? '' : undefined"
:data-tq-tree-handle="dragId"
				@click="emit('select')"
				@dblclick="onDoubleClick"
				@contextmenu="onContextMenu"
			>
				<button
					v-if="expandable"
					class="toggle"
					type="button"
					@click.stop="open = !open"
					@dblclick.stop
				>
					<Icon class="chevron" icon="mdi:chevron-down" />
				</button>
				<span v-else class="toggle" />
				<Icon class="icon" :icon="icon ?? DOT" />
				<InputTextBase
					v-if="renaming"
					ref="$rename"
					v-model="draftName"
					class="rename"
					theme="underline"
					font="monospace"
					:invalid="!nameIsFine"
					@confirm="confirmRename"
					@blur="confirmRename"
					@keydown="onRenameKey"
					@click.stop
				/>
				<span
					v-else
					class="name"
					:class="{emphasized, renamable}"
					:title="hint === undefined ? label : undefined"
					@click="onNameClick"
					>{{
					label
				}}</span>
				<button
					v-if="addLabel !== undefined && !renaming"
					v-tooltip="addLabel"
					class="add"
					type="button"
					:aria-label="addLabel"
					@click.stop="emit('add')"
					@dblclick.stop
				>
					<Icon icon="mdi:plus" />
				</button>
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
	<div
		v-if="expandable && open"
		class="children"
		:class="{closed: closedGuide}"
		:style="{'--depth': depth}"
	>
		<slot name="children" />
	</div>
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
/* A row is as tall as its value, which may have many lines. */
.TqParameterTreeItem :deep(.label) {
	align-self: stretch;
	height: auto;
	min-width: 0;
}
.TqParameterTreeItem .row {
	flex-shrink: 1;
}
.rename {
	flex: 1 1 0;
	min-width: 0;
}
/* What can be edited says so. */
.name.renamable {
	cursor: text;
	text-decoration: underline;
	text-decoration-color: var(--tq-color-border);
	text-underline-offset: 0.2em;
	transition: text-decoration-color var(--tq-hover-transition-duration);
}
.name.renamable:hover {
	text-decoration-color: currentColor;
}
.name.emphasized {
	color: var(--tq-color-info);
	font-weight: 600;
}
.name {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}
.TqParameterTreeItem.dragged {
	opacity: 0.5;
}
/* Behind the row, so that inputs keep their own colors. */
.TqParameterTreeItem.drop-target::after,
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
	flex: 1 1 0;
	min-width: 0;
	padding-left: calc(var(--depth) * var(--tq-icon-size));
	cursor: pointer;
	user-select: none;
}
/*
 * The guide along a row's children, from just below the tip of its chevron. It
 * belongs to them, so that it ends where they do.
 */
/* At the end of the label, and there when reached for. */
.add {
	display: block;
	flex-shrink: 0;
	width: var(--tq-icon-size);
	height: var(--tq-icon-size);
	margin-top: var(--inset);
	margin-left: auto;
	border-radius: var(--tq-radius-input);
	color: var(--tq-color-text-mute);
	cursor: pointer;
	opacity: 0;
	transition: opacity var(--tq-hover-transition-duration);
}
.add > * {
	display: block;
	width: 100%;
	height: 100%;
}
.row:hover .add,
.selected .add,
.add:focus-visible {
	opacity: 1;
}
.add:hover {
	color: var(--tq-color-text);
	background: var(--tq-color-input-hover);
}
.children {
	--tip: calc(
		(var(--tq-input-height) - var(--tq-icon-size)) / 2 + var(--tq-icon-size) * 0.64 + 4px
	);
	position: relative;
	display: grid;
	grid-column: 1 / -1;
	grid-template-columns: subgrid;
	row-gap: var(--tq-gap-related);
}
.children::before {
	content: '';
	position: absolute;
	top: calc(var(--tip) - var(--tq-input-height) - var(--tq-gap-related));
	bottom: 0;
	left: calc((var(--depth) + 0.5) * var(--tq-icon-size));
	width: 1px;
	background: var(--tq-color-border);
	pointer-events: none;
}
/* Closed at both ends, around just its children, like a `(`. */
.children.closed::before {
	box-sizing: border-box;
	top: 0;
	width: calc(var(--tq-icon-size) / 2);
	border: 1px solid var(--tq-color-border);
	border-right: none;
	border-radius: calc(var(--tq-icon-size) / 2) 0 0 calc(var(--tq-icon-size) / 2);
	background: none;
}
.TqParameterTreeItem.wide {
	display: flex;
	align-items: flex-start;
	grid-column: 1 / -1;
	padding-left: calc(var(--depth) * var(--tq-icon-size));
}
.wide-content {
	flex: 1 1 0;
	min-width: 0;
}
.TqParameterTreeItem.gap-after {
	margin-bottom: var(--tq-gap-control);
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
