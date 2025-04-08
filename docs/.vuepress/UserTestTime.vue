<script setup lang="ts">
import {shallowRef} from 'vue'

import PreviewTime from './PreviewTime.vue'
import UserTestContainer from './UserTestContainer.vue'

const model = shallowRef({
	time: 0,
})

function timecode(h: number, m: number, s: number, f: number) {
	return f + s * 24 + m * 60 * 24 + h * 60 * 60 * 24
}

const targets = [
	{time: timecode(0, 10, 15, 12)},
	{time: timecode(0, 35, 42, 8)},
	// {time: timecode(1, 12, 5, 20)},
]

const scheme = {
	time: {
		type: 'number',
		ui: 'time',
		min: 0,
		// icon: 'simple-icons:teespring',
	},
}
</script>

<template>
	<UserTestContainer
		title="Time"
		:targets="targets"
		:initialValue="model"
		:scheme="scheme"
		@update:modelValue="model = $event"
	>
		<template #default="{modelValue}">
			<PreviewTime :modelValue="modelValue" />
		</template>
		<template #spectrum="{modelValue, update}">
			<PreviewTime :modelValue="modelValue" @update:modelValue="update" />
		</template>
	</UserTestContainer>
</template>
