<script setup lang="ts">
import {templateRef} from '@vueuse/core'
import {vec2} from 'linearly'

import {IconIndicator} from '../IconIndicator'
import {useMultiSelectStore} from '../stores/multiSelect'
import {useDrag} from '../useDrag'

const props = defineProps<{
	updator: (px: number) => (value: number) => number
	icon: string
}>()

const multiSelect = useMultiSelectStore()

const $root = templateRef('$root')

const {dragging} = useDrag($root, {
	onDragStart() {
		multiSelect.captureValues()
	},
	onDrag({xy, initial}) {
		const delta = vec2.sub(xy, initial)
		const f = props.updator(delta[0])
		multiSelect.updateValues(values => values.map(f))
	},
	onDragEnd() {
		multiSelect.conformValues()
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
