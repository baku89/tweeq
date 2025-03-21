<script setup lang="ts" generic="T extends Record<string, any>">
import {InputComplex} from 'tweeq'
import {shallowRef} from 'vue'

import DemoContainer from './DemoContainer.vue'

interface Props {
	initialValue: T
	scheme: any
}

const props = defineProps<Props>()

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
					:modelValue="modelValue"
					:update="update"
					:scheme="scheme"
				/>
			</div>
		</template>
	</DemoContainer>
</template>

<style lang="stylus" scoped>
.sandbox.fullscreen
	width 480px
</style>
