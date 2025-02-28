<script lang="ts" setup>
import {uniqueId} from 'lodash-es'
import {ref} from 'vue'

import {SvgIcon} from '../SvgIcon'

interface Props {
	modelValue: boolean
	label?: string
}

defineProps<Props>()

const emit = defineEmits<{
	'update:modelValue': [boolean]
}>()

const id = ref(uniqueId('InputCheckbox_'))

function onInput(e: InputEvent) {
	const value = (e.target as HTMLInputElement).checked
	emit('update:modelValue', value)
}
</script>

<template>
	<div class="InputCheckbox">
		<div class="checkbox">
			<input
				:id="id"
				:checked="!!modelValue"
				class="input"
				type="checkbox"
				@input="onInput($event as InputEvent)"
			/>
			<SvgIcon mode="block" class="checkmark">
				<path d="M5,19l8,6L27,9" />
			</SvgIcon>
		</div>
		<label v-if="label" class="label" :for="id">
			{{ label }}
		</label>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.InputCheckbox
	display flex
	align-items center

.checkbox
	position relative
	input-style()
	width var(--tq-input-height)

	&:focus-within
		background var(--tq-color-input-hover)

.input
	display block
	width var(--tq-input-height)
	height var(--tq-input-height)
	margin 0 !important
	opacity 0

.checkmark
	position absolute
	top 0
	left 0
	width 100%
	height 100%
	color var(--tq-color-accent)
	pointer-events none
	text-align center
	line-height var(--tq-input-height)
	stroke-dasharray 32
	stroke-dashoffset 32
	stroke-width 3px
	stroke-linecap round
	stroke-linejoin round

	input:checked + &
		stroke-dashoffset 0


// Label
.label
	margin-left 9px
</style>
