<script setup lang="ts">
import {Icon as Iconify} from '@iconify/vue'
import {computed, watchEffect} from 'vue'

import {rememberIcon} from './iconCache'

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

	if (props.icon.startsWith('stroke:')) {
		return {
			type: 'stroke',
			value: props.icon.slice(7),
		}
	}

	if (props.icon.startsWith('paint:')) {
		const [fill = 'none', stroke = 'none', d = ''] = props.icon.slice(6).split('|')
		return {type: 'paint', value: d, fill, stroke}
	}

	return {
		type: 'iconify',
		value: props.icon,
	}
})

// Persist iconify icons to localStorage so they're in memory (no async-resolve
// flash) on the next reload.
watchEffect(() => {
	if (icon.value.type === 'iconify') rememberIcon(icon.value.value)
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
	<svg
		v-else-if="icon.type === 'stroke'"
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		class="TqIcon fill"
		v-bind="$attrs"
	>
		<path
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linejoin="round"
			stroke-linecap="round"
			:d="icon.value"
		/>
	</svg>
	<!-- Its colors are what it says, so nothing around it may fade them. -->
	<svg
		v-else-if="icon.type === 'paint'"
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		class="TqIcon fill"
		v-bind="$attrs"
		style="opacity: 1"
	>
		<path :fill="icon.fill" :d="icon.value" />
		<path
			fill="none"
			stroke-linejoin="round"
			stroke-linecap="round"
			:stroke="icon.stroke === 'none' ? 'currentColor' : icon.stroke"
			:stroke-width="icon.stroke === 'none' ? 1 : 2"
			:stroke-opacity="icon.stroke === 'none' ? 0.35 : 1"
			:d="icon.value"
		/>
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
