<script setup lang="ts">
import {ref} from 'vue'

import ExampleContainer from './ExampleContainer.vue'

const model = ref({
	offset: [0.25, 0.25],
	blur: 1,
	spread: 0,
	color: '#00000030',
})

const scheme = {
	offset: {
		type: 'vec2',
		ui: 'position',
		min: -10,
		max: 10,
	},
	blur: {
		type: 'number',
		min: 0,
		max: 10,
		precision: 2,
	},
	spread: {
		type: 'number',
		min: -5,
		max: 5,
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
						boxShadow: `${x}em ${y}em ${blur}em ${spread}em ${color}`,
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
