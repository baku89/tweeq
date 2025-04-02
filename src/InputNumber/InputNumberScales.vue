<script lang="ts" setup>
import {useElementSize} from '@vueuse/core'
import {computed, useTemplateRef} from 'vue'

interface Props {
	min?: number
	max?: number
	step?: number
}

const props = defineProps<Props>()

const $el = useTemplateRef('$el')

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
		backgroundSize: `${scaleGap.value}px 100%`,
	}
})
</script>

<template>
	<div ref="$el" class="TqInputNumberScales" :style="style" />
</template>

<style lang="stylus" scoped>
.TqInputNumberScales
	background-image: linear-gradient(to right, var(--tq-color-border-subtle) 1px, transparent 1px)
	position absolute
	inset 0
	mask linear-gradient(to right, transparent 1px, black 1px, transparent calc(100% - 1px), black calc(100% - 1px))
	pointer-events none
</style>
