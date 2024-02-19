<script setup lang="ts">
import Tq, {useTweeq} from 'tweeq'
import {ref} from 'vue'

useTweeq('com.baku89.tweeq-demo', {
	colorMode: 'auto',
	accentColor: '#0000ff',
})

const value = ref(45)

function onInput(v: number) {
	value.value = v // scalar.quantize(v, 45)
}
</script>

<template>
	<div style="padding: 10rem">
		<Tq.InputRotery
			:modelValue="value"
			:step="0.1"
			@update:modelValue="onInput"
		/>
	</div>
</template>
