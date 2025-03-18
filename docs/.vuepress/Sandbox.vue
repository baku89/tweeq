<script setup lang="ts" generic="T extends Record<string, any>">
import {InputComplex, Scheme, Viewport} from 'tweeq'
import {shallowRef} from 'vue'

interface Props {
	initialValue: T
	scheme: Scheme<T>
}

const props = defineProps<Props>()

const modelValue = shallowRef(props.initialValue)

function update(value: T) {
	modelValue.value = value
}
</script>

<template>
	<Viewport class="Sandbox">
		<InputComplex :modelValue="modelValue" :update="update" :scheme="scheme" />
	</Viewport>
</template>

<style lang="stylus" scoped>
.Sandbox
	padding 2rem 0
</style>
