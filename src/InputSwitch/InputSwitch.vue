<script lang="ts" setup>
import {uniqueId} from 'lodash-es'
import {ref} from 'vue'

import {useDrag} from '../useDrag'
import {InputSwitchProps} from './types'

const props = defineProps<InputSwitchProps>()

const emit = defineEmits<{
	'update:modelValue': [boolean]
}>()

const id = ref(uniqueId('InputSwitch_'))

const $track = ref<HTMLDivElement | null>(null)
const $input = ref<HTMLInputElement | null>(null)

useDrag($track, {
	onClick() {
		$input.value?.focus()
		emit('update:modelValue', !props.modelValue)
	},
	onDragEnd({initial: [ix], xy: [x]}) {
		const dx = x - ix
		$input.value?.focus()
		emit('update:modelValue', dx > 0)
	},
})

function onInput(e: InputEvent) {
	const value = (e.target as HTMLInputElement).checked
	emit('update:modelValue', value)
}

function onKeyDown(e: KeyboardEvent) {
	const key = e.key.toLowerCase()

	if (key === ' ') {
		update(!props.modelValue)
	} else if (key === 't' || key === '1' || key === 'y' || key === 'p') {
		update(true)
	} else if (key === 'f' || key === '0' || key === 'n' || key === 'm') {
		update(false)
	}

	function update(value: boolean) {
		e.preventDefault()
		emit('update:modelValue', value)
	}
}
</script>

<template>
	<div class="InputSwitch">
		<div ref="$track" class="track" :class="{on: modelValue}">
			<div class="handle" />
			<input
				:id="id"
				ref="$input"
				:checked="!!modelValue"
				class="input"
				type="checkbox"
				@keydown="onKeyDown($event)"
				@input="onInput($event as InputEvent)"
			/>
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

	&.on
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

	.on &
		left calc(100% - var(--tq-input-height) + 4px)
		background-color var(--tq-color-background)

.input
	display block
	position absolute
	inset 0
	accent-color red
	opacity 0
	pointer-events none
</style>
