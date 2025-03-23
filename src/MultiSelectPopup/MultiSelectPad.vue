<script setup lang="ts">
import {vec2} from 'linearly'
import {useTemplateRef} from 'vue'

import {IconIndicator} from '../IconIndicator'
import {useMultiSelectStore} from '../stores/multiSelect'
import {useDrag} from '../useDrag'

const props = defineProps<{
	type: 'slider' | 'pad'
	updator:
		| ((delta: number) => (values: number[]) => number[])
		| ((delta: vec2) => (values: number[]) => number[])
	icon: string
}>()

const multiSelect = useMultiSelectStore()

const $root = useTemplateRef('$root')

const {dragging} = useDrag($root, {
	lockPointer: true,
	onDragStart() {
		multiSelect.captureValues()
	},
	onDrag({xy, initial}) {
		const delta = vec2.sub(xy, initial)
		if (props.type === 'slider') {
			const f = props.updator(delta[0] as any)
			multiSelect.updateValues(f)
		} else {
			const f = props.updator(delta as any)
			multiSelect.updateValues(f)
		}
	},
	onDragEnd() {
		multiSelect.confirmValues()
	},
})
</script>

<template>
	<div ref="$root" class="MultiSelectPad" :class="{[type]: true}">
		<IconIndicator :icon="icon" :active="dragging" />
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.MultiSelectPad
	&.slider
		cursor ew-resize

	&.pad
		cursor move
</style>
