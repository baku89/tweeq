<script setup lang="ts">
import {ref} from 'vue'

const props = withDefaults(defineProps<{initialValue?: number}>(), {
	initialValue: 0,
})

const modelValue = ref(props.initialValue)

function update(value: number) {
	modelValue.value = value
}
</script>

<template>
	<div class="Example">
		<slot :modelValue="modelValue" :update="update" />
	</div>
</template>

<style lang="stylus">
@import '../../src/setup.styl'

.Example
	setup()
	padding 2rem
</style>
