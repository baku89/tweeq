<script setup lang="ts">
import PreviewThreePointLighting from './PreviewThreePointLighting.vue'
import UserTestContainer from './UserTestContainer.vue'
const initialValue = {
	keyIntensity: 100,
	keyColor: '#ffffff',
	fillIntensity: 100,
	fillColor: '#ffffff',
	backIntensity: 100,
	backColor: '#ffffff',
}

const targets: (typeof initialValue)[] = [
	{
		keyIntensity: 63,
		keyColor: '#dcd7f5',
		fillIntensity: 28,
		fillColor: '#f65436',
		backIntensity: 110,
		backColor: '#ffffff',
	},
	{
		keyIntensity: 140,
		keyColor: '#fed9a8',
		fillIntensity: 130,
		fillColor: '#8a83f9',
		backIntensity: 70,
		backColor: '#f1dd44',
	},
]

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
	<UserTestContainer
		title="Three Point Lighting"
		:initialValue="initialValue"
		:targets="targets"
		:scheme="scheme"
	>
		<template #default="{modelValue}">
			<div class="preview">
				<PreviewThreePointLighting :modelValue="modelValue" />
			</div>
		</template>
	</UserTestContainer>
</template>
