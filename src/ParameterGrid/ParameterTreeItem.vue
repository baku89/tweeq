<script setup lang="ts">
import {inject, provide, ref, useTemplateRef} from 'vue'

import {Icon} from '../Icon'
import {Menu} from '../Menu'
import {Popover} from '../Popover'
import Parameter from './Parameter.vue'
import {ParameterTreeDepthKey, type ParameterTreeItemProps} from './types'

// A row without an icon keeps the rhythm of those with one.
const DOT = 'fill:M12 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z'

const props = defineProps<ParameterTreeItemProps>()

const open = defineModel<boolean>('open', {default: false})

const emit = defineEmits<{select: []}>()

defineSlots<{
	/** The value column. */
	default?: () => any
	/** Items one level down, rendered while open. */
	children?: () => any
}>()

const depth = inject(ParameterTreeDepthKey, 0)
provide(ParameterTreeDepthKey, depth + 1)

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
		:class="{selected}"
		:hint="hint"
	>
		<template #label>
			<span
				ref="$label"
				class="row"
				:style="{'--depth': depth}"
				@click="emit('select')"
				@contextmenu="onContextMenu"
			>
				<button
					v-if="expandable"
					class="toggle"
					:class="{open}"
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
}
/* Behind the row, so that inputs keep their own colors. */
.TqParameterTreeItem.selected::after {
	content: '';
	position: absolute;
	inset: calc(var(--tq-gap-control) / -2) 0 calc(var(--tq-gap-control) / -2) -3px;
	z-index: -1;
	border-radius: var(--tq-radius-input);
	background: var(--tq-color-accent-soft);
	pointer-events: none;
}
.row {
	position: relative;
	display: flex;
	align-items: center;
	align-self: stretch;
	padding-left: calc(var(--depth) * var(--tq-icon-size));
	cursor: pointer;
}
/* One line for each level this row is inside, under that level's chevron. */
.row::before {
	content: '';
	position: absolute;
	top: calc(-1 * var(--tq-gap-control));
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
.toggle {
	position: relative;
	display: block;
	flex-shrink: 0;
	width: var(--tq-icon-size);
	height: var(--tq-icon-size);
	color: var(--tq-color-text-mute);
	cursor: pointer;
}
/* The start of that line, just below the tip of an open chevron. */
.toggle.open::after {
	content: '';
	position: absolute;
	top: calc(64% + 2px);
	bottom: calc((var(--tq-input-height) - var(--tq-icon-size)) / -2 - var(--tq-gap-control));
	left: 50%;
	width: 1px;
	pointer-events: none;
	background: var(--tq-color-border);
}
.chevron {
	display: block;
	width: 100%;
	height: 100%;
	transform: rotate(-90deg);
	transition: transform var(--tq-hover-transition-duration) ease;
}
.toggle.open .chevron {
	transform: none;
}
.icon {
	flex-shrink: 0;
	width: var(--tq-icon-size);
	height: var(--tq-icon-size);
	color: var(--tq-color-text-subtle);
}
.name {
	padding-inline: 0.25em;
}
</style>
