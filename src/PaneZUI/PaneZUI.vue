<script setup lang="ts">
import {Rect} from '@baku89/pave'
import {useElementBounding} from '@vueuse/core'
import {mat2d, scalar, vec2} from 'linearly'
import {computed, shallowRef, useTemplateRef, watch, watchEffect} from 'vue'

import {useZUI} from '../use/useZUI'

const props = defineProps<{
	transform?: mat2d
	background?: 'dots'
}>()

const emit = defineEmits<{
	'update:transform': [mat2d]
	'update:visibleRect': [Rect]
	'update:size': [vec2]
}>()

const $root = useTemplateRef('$root')

const {width: rootWidth, height: rootHeight} = useElementBounding($root)

const transformLocal = shallowRef(mat2d.I)

const size = computed<vec2>(() => {
	return [rootWidth.value, rootHeight.value]
})

watchEffect(() => {
	emit('update:size', size.value)
})

watch(
	() => props.transform,
	transform => {
		transformLocal.value = transform ?? mat2d.I
	}
)

watch(transformLocal, local => {
	if (local === props.transform) return
	emit('update:transform', local)
})

watchEffect(() => {
	const invTransform = mat2d.inv(transformLocal.value) ?? mat2d.I

	const topLeft = vec2.transformMat2d([0, 0], invTransform)
	const bottomRight = vec2.transformMat2d(
		[rootWidth.value, rootHeight.value],
		invTransform
	)

	emit('update:visibleRect', [topLeft, bottomRight])
})

useZUI($root, delta => {
	transformLocal.value = mat2d.mul(delta, transformLocal.value)
})

const averageZoom = computed(() => {
	const [a, , , d] = transformLocal.value
	return (a + d) / 2
})

const dotStyles = computed(() => {
	const [a, , , d, tx, ty] = transformLocal.value

	const size = 20

	const opacity = scalar.smoothstep(0.1, 0.4, averageZoom.value)

	return {
		opacity: `${opacity * 100}%`,
		backgroundPosition: `${tx}px ${ty}px`,
		backgroundSize: `${size * a}px ${size * d}px`,
	}
})

const transformStyles = computed(() => {
	return {
		transform: `matrix(${transformLocal.value.join(',')})`,
	}
})
</script>

<template>
	<div ref="$root" class="TqPaneZUI" :class="{dots: background === 'dots'}">
		<div v-if="background === 'dots'" class="dots" :style="dotStyles" />
		<div class="transform" :style="transformStyles">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>

.TqPaneZUI
	position relative
	overflow hidden
	width 100%
	height 100%

.dots
	position absolute
	inset 0
	background-image radial-gradient(
		circle at top left,
		var(--tq-color-text-mute) 1px,
		transparent 1px)

.transform
	position absolute
	transform-origin 0 0
	pointer-events none

	& > *
		pointer-events auto
</style>
