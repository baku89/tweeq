<script setup lang="ts">
import {shallowRef} from 'vue'

import PreviewSpring from './PreviewSpring.vue'
import UserTestContainer from './UserTestContainer.vue'

const model = shallowRef({
	stiffness: 500,
	damping: 0.5,
})

const targets = [
	{stiffness: 100, damping: 0.1},
	{stiffness: 1000, damping: 0.5},
]

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
		icon: 'jam:rubber',
	},
}
</script>

<template>
	<UserTestContainer
		title="Spring"
		:targets="targets"
		:initialValue="model"
		:scheme="scheme"
		@update:modelValue="model = $event"
	>
		<template #default="{modelValue}">
			<PreviewSpring :modelValue="modelValue" />
		</template>
	</UserTestContainer>
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
