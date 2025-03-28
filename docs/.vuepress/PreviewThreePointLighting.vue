<script setup lang="ts">
defineProps<{
	modelValue: {
		keyIntensity: number
		keyColor: string
		fillIntensity: number
		fillColor: string
		backIntensity: number
		backColor: string
	}
}>()
</script>

<template>
	<div class="preview">
		<div
			class="pass"
			:style="{
				color: modelValue.keyColor,
				filter: `brightness(${modelValue.keyIntensity / 100})`,
			}"
		>
			<img src="/assets/three-point-lighting_key.png" />
		</div>
		<div
			class="pass"
			:style="{
				color: modelValue.fillColor,
				filter: `brightness(${modelValue.fillIntensity / 100})`,
			}"
		>
			<img src="/assets/three-point-lighting_fill.png" />
		</div>
		<div
			class="pass"
			:style="{
				color: modelValue.backColor,
				filter: `brightness(${modelValue.backIntensity / 100})`,
			}"
		>
			<img src="/assets/three-point-lighting_back.png" />
		</div>
	</div>
</template>

<style lang="stylus" scoped>

.preview
	border-radius var(--tq-radius-popup)
	overflow hidden
	aspect-ratio 1
	position relative
	background black

.pass
	position absolute
	inset 0
	mix-blend-mode screen

	&:after
		content ''
		position absolute
		inset 0
		background-color currentColor
		z-index 1
		mix-blend-mode multiply

	img
		position absolute
		inset 0
</style>
