<script setup lang="ts">
import ExampleContainer from './ExampleContainer.vue'

const initialValue = {
	keyIntensity: 255,
	keyColor: '#dcd7f5',
	fillIntensity: 255,
	fillColor: '#f19999',
	backIntensity: 0,
	backColor: '#ffffff',
}

const scheme = {
	keyIntensity: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi:lightbulb',
	},
	keyColor: {
		type: 'string',
		ui: 'color',
		icon: 'mdi:color',
	},
	fillIntensity: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi:lightbulb',
	},
	fillColor: {
		type: 'string',
		ui: 'color',
		icon: 'mdi:color',
	},
	backIntensity: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi:lightbulb',
	},
	backColor: {
		type: 'string',
		ui: 'color',
		icon: 'mdi:color',
	},
}
</script>

<template>
	<ExampleContainer :initialValue="initialValue" :scheme="scheme">
		<template #default="{modelValue}">
			<div class="preview">
				<div
					class="pass"
					:style="{
						color: modelValue.keyColor,
						opacity: modelValue.keyIntensity / 255,
					}"
				>
					<img src="/assets/three-point-lighting_key.png" />
				</div>
				<div
					class="pass"
					:style="{
						color: modelValue.fillColor,
						opacity: modelValue.fillIntensity / 255,
					}"
				>
					<img src="/assets/three-point-lighting_fill.png" />
				</div>
				<div
					class="pass"
					:style="{
						color: modelValue.backColor,
						opacity: modelValue.backIntensity / 255,
					}"
				>
					<img src="/assets/three-point-lighting_back.png" />
				</div>
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
