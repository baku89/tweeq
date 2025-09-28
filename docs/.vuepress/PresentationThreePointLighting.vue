<script setup lang="ts">
import PresentationContainer from './PresentationContainer.vue'
import PreviewThreePointLightingPresentation from './PreviewThreePointLightingPresentation.vue'

const initialValue = {
	keyEnabled: true,
	keyIntensity: 63,
	keyColor: '#dcd7f5',
	fillEnabled: true,
	fillIntensity: 28,
	fillColor: '#f65436',
	backEnabled: true,
	backIntensity: 110,
	backColor: '#ffffff',
}

const scheme = {
	keyEnabled: {
		type: 'boolean',
	},
	keyIntensity: {
		type: 'number',
		min: 0,
		max: 200,
		clampMax: false,
		suffix: '%',
		// icon: 'mdi:lightbulb',
	},
	keyColor: {
		type: 'string',
		ui: 'color',
		// icon: 'mdi:color',
	},
	fillEnabled: {
		type: 'boolean',
	},
	fillIntensity: {
		type: 'number',
		min: 0,
		max: 200,
		clampMax: false,
		suffix: '%',
		// icon: 'mdi:lightbulb',
	},
	fillColor: {
		type: 'string',
		ui: 'color',
		// icon: 'mdi:color',
	},
	backEnabled: {
		type: 'boolean',
	},
	backIntensity: {
		type: 'number',
		min: 0,
		max: 200,
		clampMax: false,
		suffix: '%',
		// icon: 'mdi:lightbulb',
	},
	backColor: {
		type: 'string',
		ui: 'color',
		// icon: 'mdi:color',
	},
}
</script>

<template>
	<PresentationContainer
		title="Three Point Lighting"
		:initialValue="initialValue"
		:scheme="scheme"
	>
		<template #default="{modelValue}">
			<div class="preview">
				<PreviewThreePointLightingPresentation :modelValue="modelValue" />
			</div>
		</template>
	</PresentationContainer>
</template>
