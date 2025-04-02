<script setup lang="ts">
import {useMagicKeys} from '@vueuse/core'
import {vec2} from 'linearly'
import {computed, useTemplateRef, watch} from 'vue'

import {IconIndicator} from '../IconIndicator'
import {useMultiSelectStore} from '../stores/multiSelect'
import {useDrag} from '../use/useDrag'

const props = defineProps<{
	type: 'slider' | 'pad'
	updator:
		| ((delta: number) => (values: number[]) => number[])
		| ((delta: vec2) => (values: number[]) => number[])
	icon: string
}>()

const multiSelect = useMultiSelectStore()

const $root = useTemplateRef('$root')

let origin: vec2 = vec2.zero

const {x, y, '1': d1, '2': d2} = useMagicKeys()

const constrainsX = computed(() => x.value || d1.value)
const constrainsY = computed(() => y.value || d2.value)

watch(
	[constrainsX, constrainsY],
	([x, y]) => {
		if (x || y) {
			multiSelect.captureValues()
			origin = xy.value
		}
	},
	{flush: 'sync'}
)

const {xy, dragging} = useDrag($root, {
	lockPointer: true,
	onDragStart({xy}) {
		multiSelect.captureValues()
		origin = xy
	},
	onDrag({xy}) {
		let delta = vec2.sub(xy, origin)
		if (props.type === 'slider') {
			const f = props.updator(delta[0] as any)
			multiSelect.updateValues(f)
		} else {
			if (constrainsX.value) {
				delta = vec2.mul(delta, [1, 0])
			} else if (constrainsY.value) {
				delta = vec2.mul(delta, [0, 1])
			}

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
	<IconIndicator
		ref="$root"
		class="TqMultiSelectPad"
		:class="{[type]: true}"
		:icon="icon"
		:active="dragging"
	/>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqMultiSelectPad
	border-radius var(--tq-radius-input)

	&:hover
		background var(--tq-color-input-hover)

	&.slider
		cursor ew-resize

	&.pad
		cursor move
</style>
