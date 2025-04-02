<script lang="ts" setup>
import {clamp, random} from 'lodash-es'
import {ref} from 'vue'

import {SvgIcon} from '../SvgIcon'
import type {InputSeedProps} from './types'

const props = withDefaults(defineProps<InputSeedProps>(), {
	min: 0,
	max: 1,
})

const emit = defineEmits<{
	'update:modelValue': [value: number]
}>()

const iconRot = ref(0)
const iconNum = ref(3)

function shuffle() {
	iconRot.value += 90
	const v = random(props.min, props.max, true)

	const t = (v - props.min) / (props.max - props.min)
	iconNum.value = clamp(Math.floor(t * 6) + 1, 1, 6)

	emit('update:modelValue', v)
}
</script>

<template>
	<button class="TqInputSeed" @click="shuffle">
		<SvgIcon
			mode="block"
			class="icon"
			:style="{transform: `rotate(${iconRot}deg)`}"
		>
			<circle v-show="iconNum === 1" cx="16" cy="16" r="1" />
			<g v-show="iconNum === 2">
				<circle cx="11" cy="21" r="1" />
				<circle cx="21" cy="11" r="1" />
			</g>
			<g v-show="iconNum === 3">
				<circle cx="16" cy="16" r="1" />
				<circle cx="10" cy="22" r="1" />
				<circle cx="22" cy="10" r="1" />
			</g>
			<g v-show="iconNum === 4">
				<circle cx="10" cy="22" r="1" />
				<circle cx="22" cy="10" r="1" />
				<circle cx="10" cy="10" r="1" />
				<circle cx="22" cy="22" r="1" />
			</g>
			<g v-show="iconNum === 5">
				<circle cx="16" cy="16" r="1" />
				<circle cx="10" cy="22" r="1" />
				<circle cx="22" cy="10" r="1" />
				<circle cx="10" cy="10" r="1" />
				<circle cx="22" cy="22" r="1" />
			</g>
			<g v-show="iconNum === 6">
				<circle cx="10" cy="10" r="1" />
				<circle cx="10" cy="16" r="1" />
				<circle cx="10" cy="22" r="1" />
				<circle cx="22" cy="10" r="1" />
				<circle cx="22" cy="16" r="1" />
				<circle cx="22" cy="22" r="1" />
			</g>
			<path
				d="M24,29H8c-2.8,0-5-2.2-5-5V8c0-2.8,2.2-5,5-5h16c2.8,0,5,2.2,5,5v16C29,26.8,26.8,29,24,29z"
			/>
		</SvgIcon>
	</button>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputSeed
	display block
	padding 0
	width var(--tq-input-height)
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	background-size 100% 100%
	color var(--tq-color-accent)
	text-align center
	cursor pointer

	hover-transition(background, color)

	&:focus
		background var(--tq-color-accent-hover)

	&:hover
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.icon
	width var(--tq-input-height)
	height var(--tq-input-height)
	transition transform 0.3s cubic-bezier(0.19, 1.6, 0.42, 1)
</style>
