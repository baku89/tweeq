<script setup lang="ts">
import ExampleContainer from './ExampleContainer.vue'

const initialValue = {
	key: 255,
	keyColor: '#dcd7f5',
	fill: 255,
	fillColor: '#f19999',
	back: 0,
	backColor: '#ffffff',
}

const scheme = {
	key: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi-lightbulb',
	},
	keyColor: {
		type: 'string',
		ui: 'color',
	},
	fill: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi-lightbulb',
	},
	fillColor: {
		type: 'string',
		ui: 'color',
	},
	back: {
		type: 'number',
		min: 0,
		max: 255,
		clampMin: true,
		clampMax: true,
		icon: 'mdi-lightbulb',
	},
	backColor: {
		type: 'string',
		ui: 'color',
	},
}
</script>

<template>
	<ExampleContainer :initialValue="initialValue" :scheme="scheme">
		<template #default="{modelValue}">
			<div class="preview">
				<div
					class="pass"
					:style="{color: modelValue.keyColor, opacity: modelValue.key / 255}"
				>
					<img src="/assets/three-point-lighting_key.png" />
				</div>
				<div
					class="pass"
					:style="{color: modelValue.fillColor, opacity: modelValue.fill / 255}"
				>
					<img src="/assets/three-point-lighting_fill.png" />
				</div>
				<div
					class="pass"
					:style="{color: modelValue.backColor, opacity: modelValue.back / 255}"
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
