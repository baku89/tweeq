<script setup lang="ts" generic="T extends Record<string, any>">
import {shallowRef} from 'vue'

import {InputComplex, Scheme} from '../../src'

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
	<div class="Sandbox">
		<InputComplex :modelValue="modelValue" :update="update" :scheme="scheme" />
	</div>
</template>

<style lang="stylus">
@import '../../src/setup.styl'

.Sandbox
	setup()
	position relative
	padding 2rem 0
</style>
