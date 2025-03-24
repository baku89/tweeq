<script setup lang="ts">
import {useRafFn} from '@vueuse/core'
import {vec2} from 'linearly'
import {shallowRef} from 'vue'

const props = defineProps<{
	modelValue: {
		stiffness: number
		damping: number
	}
}>()

const target = shallowRef<vec2>([0.5, 0.5])

const pos = shallowRef(target.value)
let vel = vec2.zero

let lastTimestamp = 0

useRafFn(({delta, timestamp}) => {
	// Update target position every 1000ms
	const lastSec = Math.floor(lastTimestamp / 1000)
	const nowSec = Math.floor(timestamp / 1000)

	if (lastSec !== nowSec) {
		target.value = vec2.lerp(
			[0.2, 0.2],
			[0.8, 0.8],
			[Math.random(), Math.random()]
		)
	}

	lastTimestamp = timestamp

	const dt = delta / 1000
	const {stiffness, damping} = props.modelValue

	const dp = vec2.sub(target.value, pos.value)

	const accel = vec2.sub(
		vec2.scale(dp, stiffness),
		vec2.scale(vel, damping * Math.sqrt(stiffness) * 2)
	)

	vel = vec2.add(vel, vec2.scale(accel, dt))

	pos.value = vec2.add(pos.value, vec2.scale(vel, dt))
})
</script>

<template>
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
</template>
