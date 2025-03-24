<script setup lang="ts">
import {vec2} from 'linearly'
import {ref} from 'vue'

import ExampleContainer from './ExampleContainer.vue'
import PreviewDropShadow from './PreviewDropShadow.vue'

const model = ref({
	offset: [2.5, 2.5] as vec2,
	blur: 10,
	spread: 0,
	color: '#00000030',
})

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
	<ExampleContainer :initialValue="model" :scheme="scheme">
		<template #default="{modelValue}">
			<PreviewDropShadow :modelValue="modelValue" />
		</template>
	</ExampleContainer>
</template>
