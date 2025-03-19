<script lang="ts" setup>
import {uniqueId} from 'lodash-es'
import {ref} from 'vue'

import InputSwitchOverlay from '../InputSwitch/InputSwitchOverlay.vue'
import {useInputSwitch} from '../InputSwitch/utils'
import {SvgIcon} from '../SvgIcon'
import {InputCheckboxProps} from './types'

const props = defineProps<InputCheckboxProps>()

const emit = defineEmits<{
	'update:modelValue': [boolean]
}>()

const id = ref(uniqueId('InputCheckbox_'))

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
	<div class="InputCheckbox">
		<div ref="$track" class="checkbox">
			<input
				:id="id"
				ref="$input"
				:checked="!!modelValue"
				class="input"
				type="checkbox"
			/>
			<SvgIcon mode="block" class="mark">
				<path class="subtle" d="M5,19l8,6L27,9" />
			</SvgIcon>
			<InputSwitchOverlay :modelValue="tweakingValue" />
		</div>
		<label v-if="label" :for="id">
			{{ label }}
		</label>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputCheckbox
	display flex
	align-items center
	gap 1em

.checkbox
	position relative
	background var(--tq-color-input)
	border-radius var(--tq-input-border-radius)
	width var(--tq-input-height)
	active-transition(background)
	button-focus-style()

	&:hover
		background var(--tq-color-input-hover)

	&:has(:checked)
		background var(--tq-color-accent)
		&:hover
			background var(--tq-color-accent-hover)

.input
	display block
	width var(--tq-input-height)
	height var(--tq-input-height)
	margin 0 !important
	opacity 0

.mark
	position absolute
	top 0
	left 0
	width 100%
	height 100%
	color var(--tq-color-accent)
	pointer-events none
	text-align center
	line-height var(--tq-input-height)
	stroke-width 4px
	stroke-linecap round
	stroke-linejoin round
	stroke var(--tq-color-border)

	input:checked + &
		stroke var(--tq-color-background)
</style>
