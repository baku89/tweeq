<script lang="ts" setup>
import {useElementSize} from '@vueuse/core'
import {computed, shallowRef} from 'vue'

interface Props {
	min?: number
	max?: number
	step?: number
}

const props = defineProps<Props>()

const $el = shallowRef<HTMLElement | null>(null)

const {width} = useElementSize($el)

const scaleGap = computed(() => {
	if (
		props.max === undefined ||
		props.min === undefined ||
		props.step === undefined ||
		width.value === 0
	) {
		return 0
	}

	const gap = (props.step / (props.max - props.min)) * width.value

	return gap < 10 ? 0 : gap
})

const style = computed(() => {
	if (scaleGap.value === 0) return {}

	return {
		backgroundImage:
			'linear-gradient(to right, var(--tq-color-input-scale) 1px, transparent 1px)',
		backgroundSize: `${scaleGap.value}px 100%`,
	}
})
</script>

<template>
	<div ref="$el" class="InputNumberScales" :style="style" />
</template>

<style lang="stylus" scoped>
.InputNumberScales

	position absolute
	inset 0
	pointer-events none
</style>
