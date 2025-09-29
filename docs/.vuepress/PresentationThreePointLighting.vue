<script setup lang="ts">
import PresentationContainer from './PresentationContainer.vue'
import PreviewThreePointLightingPresentation from './PreviewThreePointLightingPresentation.vue'

const initialValue = {
	keyEnabled: true,
	keyIntensity: 63,
	keyColor: '#a28fff',
	fillEnabled: true,
	fillIntensity: 28,
	fillColor: '#ed8d40',
	backEnabled: true,
	backIntensity: 110,
	backColor: '#5240fa',
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
