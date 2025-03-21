<script setup lang="ts">
import {vec2} from 'linearly'
import {useTemplateRef} from 'vue'

import {IconIndicator} from '../IconIndicator'
import {useMultiSelectStore} from '../stores/multiSelect'
import {useDrag} from '../useDrag'

const props = defineProps<{
	updator: (px: number) => (values: number[]) => number[]
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
		const f = props.updator(delta[0])
		multiSelect.updateValues(f)
	},
	onDragEnd() {
		multiSelect.confirmValues()
	},
})
</script>

<template>
	<div ref="$root" class="MultiSelectHorizontalSlider">
		<IconIndicator :icon="icon" :active="dragging" />
	</div>
</template>

<style lang="stylus">
@import '../common.styl'

.MultiSelectHorizontalSlider
	cursor ew-resize
</style>
