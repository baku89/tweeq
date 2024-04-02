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
		<div class="input">
			<slot :modelValue="modelValue" :update="update" />
		</div>
	</div>
</template>

<style lang="stylus">
@import '../../src/setup.styl'

.Example
	position relative
	padding 2rem 0
	setup()

	.input
		max-width 100%
		width 15rem
</style>
