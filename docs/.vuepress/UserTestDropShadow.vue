<script setup lang="ts">
import {vec2} from 'linearly'
import {ref} from 'vue'

import SpInputDropShadow from './components/SpInputDropShadow.vue'
import PreviewDropShadow from './PreviewDropShadow.vue'
import UserTestContainer from './UserTestContainer.vue'

type Model = {
	offset: vec2
	blur: number
	spread: number
	color: string
}

const model = ref<Model>({
	offset: [0, 0] as vec2,
	blur: 10,
	spread: 0,
	color: '#00000030',
})

const targets: Model[] = [
	{
		offset: [2.5, 2.5],
		blur: 10,
		spread: 0,
		color: '#1e387d36',
	},
	// {
	// 	offset: [0, 6.4],
	// 	blur: 17,
	// 	spread: 0,
	// 	color: '#5c8badb5',
	// },
	{
		offset: [0, 7],
		blur: 52.61111111111116,
		spread: -10.111111111111105,
		color: '#b1383830',
	},
]

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
	<UserTestContainer
		title="Drop Shadow"
		:initialValue="model"
		:targets="targets"
		:scheme="scheme"
	>
		<template #default="{modelValue}">
			<PreviewDropShadow :modelValue="modelValue" />
		</template>
		<template #spectrum="{modelValue, update}">
			<SpInputDropShadow :modelValue="modelValue" @update:modelValue="update" />
		</template>
	</UserTestContainer>
</template>
