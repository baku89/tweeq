<script setup lang="ts">
import {vec2} from 'linearly'
import {computed} from 'vue'

const props = defineProps<{
	modelValue: {
		offset: vec2
		blur: number
		spread: number
		color: string
	}
}>()

const styles = computed(() => {
	const {
		offset: [x, y],
		blur,
		spread,
		color,
	} = props.modelValue

	return {
		boxShadow: `${x / 10}em ${y / 10}em ${blur / 10}em ${spread / 10}em ${color}`,
	}
})
</script>

<template>
	<div class="preview">
		<div class="round-rect" :style="styles" />
	</div>
</template>

<style lang="stylus" scoped>

.preview
	border-radius var(--tq-radius-popup)
	overflow hidden
	width 30em
	aspect-ratio 1
	position relative
	background var(--tq-color-input)
	display flex
	align-items center
	justify-content center

.round-rect
	width 10em
	height 10em
	border-radius 1em
	background white
	border 1px solid rgba(0, 0, 0, 0.2)
</style>
