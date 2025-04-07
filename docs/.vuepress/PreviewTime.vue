<script setup lang="ts">
import {formatTimecode} from '../../src/InputTime/utils'

const props = defineProps<{
	modelValue: {
		time: number
	}
}>()
</script>

<template>
	<div class="PreviewTime">
		<div class="time">
			{{ formatTimecode(props.modelValue.time, 24) }}
		</div>
	</div>
</template>

<style lang="stylus" scoped>
.PreviewTime
	aspect-ratio 1
	font-size 2rem
	text-align center
	background black
	color white
	display flex
	align-items center
	justify-content center
	border-radius var(--tq-radius-popup)

.time
	font-family 'Geist Mono', monospace
</style>
