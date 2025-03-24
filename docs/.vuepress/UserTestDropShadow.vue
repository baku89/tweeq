<script setup lang="ts">
import {vec2} from 'linearly'
import {ref} from 'vue'

import PreviewDropShadow from './PreviewDropShadow.vue'
import UserTestContainer from './UserTestContainer.vue'

const model = ref({
	offset: [0, 0] as vec2,
	blur: 10,
	spread: 0,
	color: '#00000030',
})

const targets = [
	{
		offset: [2.5, 2.5],
		blur: 10,
		spread: 0,
		color: '#1e387d36',
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
	</UserTestContainer>
</template>
