<script setup lang="ts">
import {cloneVNode, Comment, Fragment, Text, useSlots, type VNode} from 'vue'

import type {InputPosition} from '../types'

const props = withDefaults(
	defineProps<{
		/** Axis the inputs are laid out along; picks inline- vs block-position. */
		direction?: 'horizontal' | 'vertical'
	}>(),
	{direction: 'horizontal'}
)

defineSlots<{
	default: () => any
}>()

const slots = useSlots()

// Unwrap fragments (v-for / <template>) and drop comments + whitespace, so the
// position is assigned by actual rendered input order.
function flatten(nodes: VNode[]): VNode[] {
	const out: VNode[] = []
	for (const node of nodes) {
		if (node.type === Comment) continue
		if (
			node.type === Text &&
			typeof node.children === 'string' &&
			node.children.trim() === ''
		) {
			continue
		}
		if (node.type === Fragment && Array.isArray(node.children)) {
			out.push(...flatten(node.children as VNode[]))
		} else {
			out.push(node)
		}
	}
	return out
}

// Clone each grouped child and stamp its inline/block position (start | middle |
// end) so the shared use-input-position() mixin rounds only the group's outer
// corners — giving the row/column a single cohesive shape. Passed as a prop (not
// a raw attribute) because each input binds :inline-position from its own prop,
// which would otherwise overwrite an attribute we set directly.
function PositionedChildren(): VNode[] {
	const children = flatten(slots.default?.() ?? [])
	if (children.length <= 1) return children

	const key = props.direction === 'vertical' ? 'blockPosition' : 'inlinePosition'

	return children.map((child, i) => {
		const position: InputPosition =
			i === 0 ? 'start' : i === children.length - 1 ? 'end' : 'middle'
		return cloneVNode(child, {[key]: position})
	})
}
</script>

<template>
	<div class="TqInputGroup" :data-direction="direction">
		<PositionedChildren />
	</div>
</template>

<style scoped lang="stylus">
.TqInputGroup
	display flex
	flex-grow 1
	gap var(--tq-gap-group)

	&[data-direction=vertical]
		flex-direction column
</style>
