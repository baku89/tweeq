<script setup lang="ts">
import {computed, inject, useSlots} from 'vue'

import {Icon} from '../Icon'
import {vTooltip} from '../Tooltip'
import {
	type ParameterProps,
	ParameterTreeContextKey,
	ParameterTreeDepthKey,
	ROW_DOT,
} from './types'

defineProps<ParameterProps>()

// In a tree, a plain row lines up with the items around it, which have a chevron, or
// the room for one, and an icon before their names: nothing moves as rows come and go.
// A ParameterTreeItem lays out its own label, and is left to it.
const slots = useSlots()
const tree = inject(ParameterTreeContextKey, null)
const depth = inject(ParameterTreeDepthKey, 0)
const inTree = computed(() => tree !== null && !slots.label)

defineSlots<{
	default: void
	label: void
}>()
</script>
<template>
	<li class="TqParameter">
		<!--
			`hint` is forwarded straight to v-tooltip: a bare string shows as plain
			text (the un-abbreviated term, e.g. "Apr." → "Aperture"), while an object
			like {title, description} opts into the structured two-line layout.
		-->
		<div
			class="label"
			:class="{'in-tree': inTree}"
			:style="inTree ? {'--depth': depth} : undefined"
			v-tooltip="hint"
		>
			<slot name="label">
				<template v-if="inTree">
					<span class="toggle" />
					<Icon class="icon" :icon="icon ?? ROW_DOT" />
					<span v-if="label" class="name">{{ label }}</span>
				</template>
				<template v-else>
					<Icon v-if="icon" class="icon" :icon="icon" />
					<template v-if="label">{{ label }}</template>
				</template>
			</slot>
		</div>
		<div class="input">
			<slot />
		</div>
	</li>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqParameter
	display grid
	grid-column 1 / 3
	grid-template-columns subgrid

.label
	line-height var(--tq-input-height)
	align-items center
	display flex
	gap var(--tq-gap-related)
	color var(--tq-color-text-mute)
	text-wrap nowrap

	// Keep icons / toggles (incl. those injected via the #label slot) at their
	// intrinsic size when the label column gets narrow — only the text should
	// give. Without this, flex's default shrink squashes the visibility toggle
	// and parameter icon as the panel narrows.
	& > :deep(*)
		flex-shrink 0

.label
	height var(--tq-input-height)

.icon
	width calc(var(--tq-input-height) - 4px)
	height calc(var(--tq-input-height) - 4px)
	color var(--tq-color-text-subtle)

// As a ParameterTreeItem lays out its row: a level as wide as a chevron looks, then the
// icon in its box, then the name as far in as an input's text.
.label.in-tree
	--indent calc(var(--tq-icon-size) * 0.7)
	gap 0
	padding-left calc(var(--depth) * var(--indent))
	min-width 0

	.toggle
		display block
		flex-shrink 0
		width var(--indent)
		height var(--tq-icon-size)

	.icon
		width var(--tq-icon-size)
		height var(--tq-icon-size)

	.name
		display block
		min-width 0
		padding-inline 0.5em
		overflow hidden
		text-overflow ellipsis

.input
	display grid
	gap var(--tq-gap-related)
	align-items center
	// Allow the value column to shrink with the panel instead of overflowing:
	// its own column too, or it is as wide as what is in it, and what can
	// fold itself up to fit (as a radio does) never sees that it has to.
	min-width 0
	grid-template-columns minmax(0, 1fr)
</style>
