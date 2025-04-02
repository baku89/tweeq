<script lang="ts" setup>
import {computed, ref, useTemplateRef} from 'vue'

import {Popover} from '../Popover'
import InputCubicBezierPicker from './InputCubicBezierPicker.vue'
import type {InputCubicBezierProps} from './types'
import type {CubicBezierValue} from './util'

const props = defineProps<InputCubicBezierProps>()

const emit = defineEmits<{
	'update:modelValue': [CubicBezierValue]
}>()

defineOptions({
	inheritAttrs: false,
})

const $button = useTemplateRef('$button')
const open = ref(false)

const easingPath = computed(() => {
	const [x1, y1, x2, y2] = props.modelValue
	return `M 0,0 C ${x1},${y1} ${x2},${y2} 1,1`
})
</script>

<template>
	<button
		ref="$button"
		class="TqInputCubicBezier"
		:class="{open}"
		v-bind="$attrs"
		@click="open = true"
	>
		<svg class="icon" viewBox="0 0 1 1">
			<path :d="easingPath" />
		</svg>
	</button>
	<Popover v-model:open="open" :reference="$button">
		<div class="floating">
			<InputCubicBezierPicker
				:modelValue="modelValue"
				@update:modelValue="emit('update:modelValue', $event)"
			/>
		</div>
	</Popover>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputCubicBezier
	position relative
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	overflow hidden
	hover-transition(background)
	background var(--tq-color-accent-hover)

	&:hover, &.open
		background var(--tq-color-tinted-input-active)

.icon
	display block
	position absolute
	inset 2px
	overflow visible

	path
		transform scaleY(-1)
		transform-origin 50% 50%
		stroke-width 1.5
		stroke var(--tq-color-accent)
		stroke-linecap round
		fill none
		vector-effect non-scaling-stroke

.floating
	width var(--tq-popup-width)
	height var(--tq-popup-width)
	position relative
	popup-style()
</style>
