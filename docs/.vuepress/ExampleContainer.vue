<script setup lang="ts" generic="T extends Record<string, any>">
import {InputComplex} from 'tweeq'
import {shallowRef} from 'vue'

import DemoContainer from './DemoContainer.vue'

interface Props {
	initialValue: T
	scheme: any
}

const props = defineProps<Props>()

defineSlots<{
	default: (props: {modelValue: T}) => any
}>()

const modelValue = shallowRef(props.initialValue)

function update(value: T) {
	modelValue.value = value
}
</script>

<template>
	<DemoContainer class="Sandbox">
		<template #default="{isFullscreen}">
			<div class="sandbox" :class="{fullscreen: isFullscreen}">
				<InputComplex
					class="parameters"
					:modelValue="modelValue"
					:scheme="scheme"
					@update:modelValue="update"
				/>
				<slot :modelValue="modelValue" />
			</div>
		</template>
	</DemoContainer>
</template>

<style lang="stylus" scoped>

.sandbox
	display flex
	gap 2rem
	align-items start

.sandbox.fullscreen
	width 960px

.parameters
	flex-grow 1
</style>
