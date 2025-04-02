<script lang="ts" setup>
import {uniqueId} from 'lodash-es'
import {ref, useTemplateRef} from 'vue'

import Icon from '../Icon/Icon.vue'
import InputSwitchOverlay from '../InputSwitch/InputSwitchOverlay.vue'
import {useInputSwitch} from '../InputSwitch/utils'
import {InputEmits} from '../types'
import {InputCheckboxProps} from './types'

const model = defineModel<boolean>({required: true})

const props = defineProps<InputCheckboxProps>()

const emit = defineEmits<InputEmits>()

const id = ref(uniqueId('InputCheckbox_'))

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
	<div class="TqInputCheckbox">
		<div
			ref="track"
			class="checkbox"
			:class="{subfocus}"
			:block-position="props.blockPosition"
			:inline-position="props.inlinePosition"
		>
			<input
				:id="id"
				ref="input"
				:checked="model"
				class="input"
				type="checkbox"
			/>
			<Icon :icon="props.icon || 'mdi:check-bold'" class="mark" />
			<InputSwitchOverlay :modelValue="tweakingValue" />
		</div>
		<label v-if="label" :for="id">
			{{ label }}
		</label>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputCheckbox
	display flex
	align-items center
	gap 1em

.checkbox
	position relative
	background var(--tq-color-input)
	border-radius var(--tq-radius-input)
	width var(--tq-input-height)
	active-transition(background)

	use-input-position()

	&:has(.input:focus-visible),
	&.subfocus
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
	pointer-events none

.mark
	position absolute
	top calc((var(--tq-input-height) - var(--tq-icon-size)) / 2)
	left calc((var(--tq-input-height) - var(--tq-icon-size)) / 2)
	color set-alpha(--tq-color-text-subtle, .3)
	pointer-events none

	input:checked + &
		color var(--tq-color-background)
</style>
