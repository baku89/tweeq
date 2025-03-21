<script setup lang="ts">
import ExampleContainer from './ExampleContainer.vue'

const initialValue = {key: 0, fill: 0, back: 0}

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
			{{ modelValue }}
		</template>
	</ExampleContainer>
</template>
