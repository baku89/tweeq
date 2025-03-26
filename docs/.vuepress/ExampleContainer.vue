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
	<DemoContainer class="ExampleContainer">
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
.ExampleContainer
	display flex
	align-items center
	justify-content center

.sandbox
	display flex
	gap 2rem
	align-items start
	min-width 18rem
	max-width 18rem

.sandbox.fullscreen
	width 640px
	height 480px
	align-items center

.parameters
	flex-grow 1
</style>
