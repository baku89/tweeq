<script setup lang="ts">
import {cloneVNode, defineComponent, useSlots} from 'vue'

defineSlots<{
	default: () => any
}>()

const slots = useSlots()

const Child = defineComponent({
	render: () => {
		const vnode = slots.default?.()

		if (!Array.isArray(vnode) || vnode.length <= 1) return vnode

		return vnode.map((child: any, index: number) => {
			return cloneVNode(child, {
				horizontalPosition:
					index === 0
						? 'left'
						: index === vnode.length - 1
							? 'right'
							: 'middle',
			})
		})
	},
})
</script>

<template>
	<div class="TqInputGroup">
		<Child />
	</div>
</template>

<style scoped lang="stylus">
.TqInputGroup
	display flex
</style>
