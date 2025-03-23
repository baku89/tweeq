<script setup lang="ts">
import {ref} from 'vue'

import ExampleContainer from './ExampleContainer.vue'

const model = ref({
	offset: [2.5, 2.5],
	blur: 10,
	spread: 0,
	color: '#00000030',
})

const scheme = {
	offset: {
		type: 'vec2',
		ui: 'position',
		min: -100,
		max: 100,
	},
	blur: {
		type: 'number',
		min: 0,
		max: 100,
		precision: 2,
	},
	spread: {
		type: 'number',
		min: -100,
		max: 100,
		precision: 2,
	},
	color: {
		type: 'string',
		ui: 'color',
		alpha: true,
	},
}
</script>

<template>
	<ExampleContainer
		:initialValue="model"
		:scheme="scheme"
		@update:modelValue="model = $event"
	>
		<template
			#default="{
				modelValue: {
					offset: [x, y],
					blur,
					spread,
					color,
				},
			}"
		>
			<div class="preview">
				<div
					class="round-rect"
					:style="{
						boxShadow: `${x / 10}em ${y / 10}em ${blur / 10}em ${spread / 10}em ${color}`,
					}"
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
