<script setup lang="ts">
import ExampleContainer from './ExampleContainer.vue'

const initialValue = {key: 255, fill: 255, back: 0}

const scheme = {
	key: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi-lightbulb',
	},
	fill: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi-lightbulb',
	},
	back: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi-lightbulb',
	},
}
</script>

<template>
	<ExampleContainer :initialValue="initialValue" :scheme="scheme">
		<template #default="{modelValue}">
			<div class="preview">
				<img
					src="/assets/three-point-lighting_key.png"
					:style="{opacity: modelValue.key / 255}"
				/>
				<img
					src="/assets/three-point-lighting_fill.png"
					:style="{opacity: modelValue.fill / 255}"
				/>
				<img
					src="/assets/three-point-lighting_back.png"
					:style="{opacity: modelValue.back / 255}"
				/>
			</div>
		</template>
	</ExampleContainer>
</template>

<style lang="stylus" scoped>

.preview
	border-radius var(--tq-popup-border-radius)
	overflow hidden
	width 30em
	aspect-ratio 1
	position relative
	background black

	img
		position absolute
		inset 0
		mix-blend-mode screen
</style>
