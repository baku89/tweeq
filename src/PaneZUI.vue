<script setup lang="ts">
import {Rect} from '@baku89/pave'
import {useElementBounding} from '@vueuse/core'
import {mat2d, vec2} from 'linearly'
import {computed, ref, shallowRef, watchEffect} from 'vue'

import {useZUI} from './use/useZUI'

const emit = defineEmits<{
	'update:transform': [mat2d]
	'update:visibleRect': [Rect]
}>()

const $root = ref<HTMLElement | null>(null)

const {width: rootWidth, height: rootHeight} = useElementBounding($root)

const transform = shallowRef(mat2d.I)

watchEffect(() => {
	emit('update:transform', transform.value)
})

watchEffect(() => {
	const invTransform = mat2d.inv(transform.value) ?? mat2d.I

	const topLeft = vec2.transformMat2d([0, 0], invTransform)
	const bottomRight = vec2.transformMat2d(
		[rootWidth.value, rootHeight.value],
		invTransform
	)

	emit('update:visibleRect', [topLeft, bottomRight])
})

useZUI($root, delta => {
	transform.value = mat2d.mul(delta, transform.value)
})

const rootStyles = computed(() => {
	const [a, , , d, tx, ty] = transform.value

	const size = 20

	return {
		backgroundPosition: `${tx}px ${ty}px`,
		backgroundSize: `${size * a}px ${size * d}px`,
	}
})

const transformStyles = computed(() => {
	return {
		transform: `matrix(${transform.value.join(',')})`,
	}
})
</script>

<template>
	<div ref="$root" class="PaneZUI" :style="rootStyles">
		<div class="transform" :style="transformStyles">
			<slot />
		</div>
	</div>
</template>

<style lang="stylus" scoped>

.PaneZUI
	position relative
	overflow hidden
	width 100%
	height 100%
	--bg var(--tq-color-background)
	background-image linear-gradient(to right, transparent 1px, var(--bg) 1px), linear-gradient(to bottom, transparent 1px, var(--bg) 1px)
	background-color var(--tq-color-gray-on-background)

.transform
	position absolute
	transform-origin 0 0
	pointer-events none

	& > *
		pointer-events auto
</style>
