<script setup lang="ts">
import ExampleContainer from './ExampleContainer.vue'
import PreviewThreePointLighting from './PreviewThreePointLighting.vue'
const initialValue = {
	keyIntensity: 100,
	keyColor: '#dcd7f5',
	fillIntensity: 100,
	fillColor: '#f19999',
	backIntensity: 0,
	backColor: '#ffffff',
}

const scheme = {
	keyIntensity: {
		type: 'number',
		min: 0,
		max: 200,
		clampMax: false,
		suffix: '%',
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
		max: 200,
		clampMax: false,
		suffix: '%',
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
		max: 200,
		clampMax: false,
		suffix: '%',
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
				<PreviewThreePointLighting :modelValue="modelValue" />
			</div>
		</template>
	</ExampleContainer>
</template>
