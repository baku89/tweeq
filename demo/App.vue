<script setup lang="ts">
import Tq, {useTweeq} from 'tweeq'
import {ref} from 'vue'

useTweeq('com.baku89.tweeq-demo', {
	colorMode: 'auto',
	accentColor: '#0000ff',
})

const value = ref(100)
</script>

<template>
	<Tq.InputNumber v-model="value" />
</template>
