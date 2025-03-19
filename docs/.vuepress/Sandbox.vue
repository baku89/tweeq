<script setup lang="ts" generic="T extends Record<string, any>">
import {InputComplex, Viewport} from 'tweeq'
import {shallowRef} from 'vue'

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
	<ClientOnly>
		<Viewport class="Sandbox">
			<InputComplex
				:modelValue="modelValue"
				:update="update"
				:scheme="scheme"
			/>
		</Viewport>
	</ClientOnly>
</template>

<style lang="stylus" scoped>
.Sandbox
	padding 2rem 0
</style>
