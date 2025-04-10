<script setup lang="ts">
import {Icon as Iconify} from '@iconify/vue'
import {computed} from 'vue'

const props = defineProps<{
	icon: string
}>()

const icon = computed(() => {
	if (props.icon.startsWith('char:')) {
		return {
			type: 'char',
			value: props.icon.slice(5),
		}
	}

	if (props.icon.startsWith('fill:')) {
		return {
			type: 'fill',
			value: props.icon.slice(5),
		}
	}

	return {
		type: 'iconify',
		value: props.icon,
	}
})

defineOptions({
	inheritAttrs: false,
})
</script>

<template>
	<Iconify
		v-if="icon.type === 'iconify'"
		class="TqIcon iconify"
		:icon="icon.value"
		v-bind="$attrs"
	/>
	<div v-else-if="icon.type === 'char'" class="TqIcon char" v-bind="$attrs">
		{{ icon.value }}
	</div>
	<svg
		v-else-if="icon.type === 'fill'"
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		class="TqIcon fill"
		v-bind="$attrs"
	>
		<path fill="currentColor" :d="icon.value" />
	</svg>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqIcon
	width var(--tq-icon-size)
	height var(--tq-icon-size)

.char
	line-height 100%
	font-size 1.2em
	text-align center
	display flex
	align-items center
	justify-content center
</style>
