<script setup lang="ts">
import {useRafFn} from '@vueuse/core'
import {vec2} from 'linearly'
import {reactive, ref} from 'vue'

import ExampleContainer from './ExampleContainer.vue'

const model = reactive({
	stiffness: 500,
	damping: 0.5,
})

function update(value: typeof model) {
	model.stiffness = value.stiffness
	model.damping = value.damping
}

const scheme = {
	stiffness: {
		type: 'number',
		min: 0,
		max: 1000,
		clampMin: true,
		clampMax: true,
		icon: 'simple-icons:teespring',
	},
	damping: {
		type: 'number',
		min: 0,
		max: 1,
		clampMin: true,
		clampMax: true,
		icon: 'mdi:lightbulb',
	},
}

const target = ref<vec2>([0.5, 0.5])

const pos = ref(target.value)
let vel = vec2.zero

setInterval(() => {
	target.value = vec2.lerp(
		[0.2, 0.2],
		[0.8, 0.8],
		[Math.random(), Math.random()]
	)
}, 1000)

useRafFn(({delta}) => {
	const dt = delta / 1000

	const dp = vec2.sub(target.value, pos.value)

	const accel = vec2.sub(
		vec2.scale(dp, model.stiffness),
		vec2.scale(vel, model.damping * Math.sqrt(model.stiffness) * 2)
	)

	vel = vec2.add(vel, vec2.scale(accel, dt))

	pos.value = vec2.add(pos.value, vec2.scale(vel, dt))
})
</script>

<template>
	<ExampleContainer
		:initialValue="model"
		:scheme="scheme"
		@update:modelValue="update"
	>
		<svg class="preview" viewBox="0 0 1 1">
			<circle :cx="pos[0]" :cy="pos[1]" r="0.1" fill="tomato" />
			<circle
				:cx="target[0]"
				:cy="target[1]"
				r="0.1"
				fill="none"
				stroke="black"
				stroke-width="0.005"
				stroke-dasharray="0.01"
			/>
		</svg>
	</ExampleContainer>
</template>

<style lang="stylus" scoped>

.preview
	border-radius var(--tq-popup-border-radius)
	overflow hidden
	width 30em
	aspect-ratio 1
	background var(--tq-color-input)
	border 1px solid var(--tq-color-border)
</style>
