<script lang="ts" setup>
import {uniqueId} from 'lodash-es'
import {ref} from 'vue'

import InputSwitchOverlay from './InputSwitchOverlay.vue'
import {InputSwitchProps} from './types'
import {useInputSwitch} from './utils'

const props = defineProps<InputSwitchProps>()

const emit = defineEmits<{
	'update:modelValue': [boolean]
}>()

const id = ref(uniqueId('InputSwitch_'))

const $track = ref<HTMLDivElement | null>(null)
const $input = ref<HTMLInputElement | null>(null)

const {tweakingValue} = useInputSwitch(
	$track,
	$input,
	() => props.modelValue,
	value => emit('update:modelValue', value)
)
</script>

<template>
	<div class="InputSwitch">
		<div ref="$track" class="track">
			<input
				:id="id"
				ref="$input"
				:checked="!!modelValue"
				class="input"
				type="checkbox"
			/>
			<div class="handle" />
			<InputSwitchOverlay :modelValue="tweakingValue" />
		</div>
		<label v-if="label" :for="id">
			{{ label }}
		</label>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputSwitch
	display flex
	align-items center
	gap 1em

.track
	position relative
	width calc(var(--tq-input-height) * 2)
	border-radius 9999px
	background-color var(--tq-color-input)
	active-transition(background-color)
	height var(--tq-input-height)

	&:hover
		background-color var(--tq-color-input-hover)

	&:has(:checked)
		background-color var(--tq-color-accent)

		&:hover
			background-color var(--tq-color-accent-hover)

	&:has(.input:focus)
		&:before
			content ''
			position absolute
			inset -3px
			border 1px solid var(--tq-color-accent)
			border-radius 999px

.handle
	position absolute
	top 4px
	left 4px
	width calc(var(--tq-input-height) - 8px)
	height calc(var(--tq-input-height) - 8px)
	border-radius 9999px
	background-color var(--tq-color-text-mute)
	active-transition(left, background-color)
	pointer-events none

	:checked + &
		left calc(100% - var(--tq-input-height) + 4px)
		background-color var(--tq-color-background)

.input
	position absolute
	opacity 0
	pointer-events none
</style>
