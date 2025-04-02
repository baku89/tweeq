<script lang="ts" setup>
import {uniqueId} from 'lodash-es'
import {ref, useTemplateRef} from 'vue'

import {InputEmits} from '../types'
import {InputSwitchProps} from './types'
import {useInputSwitch} from './utils'

const model = defineModel<boolean>({required: true})

const props = defineProps<InputSwitchProps>()

const emit = defineEmits<InputEmits>()

const id = ref(uniqueId('InputSwitch_'))

const track = useTemplateRef('track')
const input = useTemplateRef('input')

const {tweakingValue, subfocus} = useInputSwitch({
	track,
	input,
	props,
	emit,
})
</script>

<template>
	<div class="TqInputSwitch">
		<div ref="track" class="track" :class="{subfocus}">
			<input
				:id="id"
				ref="input"
				:checked="!!model"
				class="input"
				type="checkbox"
			/>
			<div class="handle" :class="{tweaking: tweakingValue !== null}" />
		</div>
		<label v-if="label" :for="id">
			{{ label }}
		</label>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputSwitch
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

	&:has(.input:focus),
	&.subfocus
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
	background-color var(--tq-color-text-subtle)
	active-transition(left, width, background-color)
	pointer-events none

	&.tweaking
		width calc(var(--tq-input-height) - 4px)

	:checked + &
		left calc(100% - var(--tq-input-height) + 4px)
		background-color var(--tq-color-background)

		&.tweaking
			left calc(100% - var(--tq-input-height))
.input
	position absolute
	opacity 0
	pointer-events none

	&:focus
		pointer-events auto
</style>
