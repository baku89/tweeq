<script setup lang="ts">
import {clamp} from 'lodash-es'
import {ref, useTemplateRef} from 'vue'

import {useAppConfigStore} from '../stores/appConfig'
import ParameterGrid from './ParameterGrid.vue'
import type {ParameterTreeProps} from './types'

const MIN_LABEL = 60
const MIN_VALUE = 120

const props = withDefaults(defineProps<ParameterTreeProps>(), {
	labelWidth: 180,
})

// A label column that fits its content would move every value at each opening
// and closing of a row, so it has a width of its own, kept under `name`.
const labelWidth = useAppConfigStore().ref(
	`${props.name}.labelWidth`,
	props.labelWidth
)

const $root = useTemplateRef<HTMLElement>('$root')
const resizing = ref(false)

function onPointerDown(event: PointerEvent) {
	const handle = event.currentTarget as HTMLElement
	const startX = event.clientX
	const startWidth = labelWidth.value
	handle.setPointerCapture(event.pointerId)
	resizing.value = true

	const onMove = (move: PointerEvent) => {
		const max = ($root.value?.clientWidth ?? Infinity) - MIN_VALUE
		labelWidth.value = clamp(startWidth + move.clientX - startX, MIN_LABEL, max)
	}
	const onUp = () => {
		resizing.value = false
		handle.removeEventListener('pointermove', onMove)
		handle.removeEventListener('pointerup', onUp)
		handle.removeEventListener('pointercancel', onUp)
	}
	handle.addEventListener('pointermove', onMove)
	handle.addEventListener('pointerup', onUp)
	handle.addEventListener('pointercancel', onUp)
}
</script>

<template>
	<div
		ref="$root"
		class="TqParameterTree"
		:style="{'--label-width': `${labelWidth}px`}"
	>
		<!-- Rows of one tree sit closer than one tree does to the next. -->
		<ParameterGrid class="grid">
			<slot />
		</ParameterGrid>
		<div class="resizer" :class="{resizing}" @pointerdown="onPointerDown" />
	</div>
</template>

<style scoped>
.TqParameterTree {
	position: relative;
}
.TqParameterGrid.grid {
	grid-template-columns: var(--label-width) minmax(0, 1fr);
	row-gap: var(--tq-gap-related);
}
/* In the gap between the columns, and seen only when reached for. */
.resizer {
	position: absolute;
	top: 0;
	bottom: 0;
	left: calc(3px + var(--label-width));
	z-index: 3;
	width: var(--tq-gap-control);
	cursor: col-resize;
	touch-action: none;
}
.resizer::after {
	content: '';
	position: absolute;
	top: 0;
	bottom: 0;
	left: calc(50% - 0.5px);
	width: 1px;
	background: var(--tq-color-border);
	opacity: 0;
	transition: opacity var(--tq-hover-transition-duration);
}
.resizer:hover::after,
.resizer.resizing::after {
	opacity: 1;
}
</style>
