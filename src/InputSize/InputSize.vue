<script setup lang="ts">
import {scalar, vec2} from 'linearly'
import {ref} from 'vue'

import {Icon} from '../Icon'
import {InputVec} from '../InputVec'
import {InputEmits, InputProps} from '../types'

const keepRatio = ref(true)

const props = defineProps<InputProps<vec2>>()
const emit = defineEmits<InputEmits<vec2>>()

let valueOnEdit = props.modelValue

function onUpdate(value: vec2) {
	const bothChanged =
		props.modelValue[0] !== value[0] && props.modelValue[1] !== value[1]

	if (bothChanged) {
		const prevRatio = props.modelValue[0] / props.modelValue[1]
		const newRatio = value[0] / value[1]

		if (!scalar.approx(prevRatio, newRatio)) {
			keepRatio.value = false
		}
	}

	const index = props.modelValue[0] !== value[0] ? 0 : 1

	if (keepRatio.value) {
		let ds = value[index] / valueOnEdit[index]
		if (!isFinite(ds)) ds = 1

		value = valueOnEdit.map((v, i) =>
			i !== index ? v * ds : value[index]
		) as unknown as vec2
	}

	emit('update:modelValue', value)
}

function recordValueOnEdit() {
	valueOnEdit = props.modelValue
	emit('focus')
}
</script>

<template>
	<div class="TqInputSize">
		<InputVec
			:modelValue="modelValue"
			:icon="['mdi:arrow-left-right', 'mdi:arrow-up-down']"
			@update:modelValue="onUpdate"
			@focus="recordValueOnEdit"
			@confirm="emit('confirm')"
			@blur="emit('blur')"
		/>
		<Icon
			class="chain"
			:class="{active: keepRatio}"
			:icon="keepRatio ? 'radix-icons:link-1' : 'radix-icons:link-none-1'"
			@click="keepRatio = !keepRatio"
		/>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputSize
	position relative

.chain
	position absolute
	top 0
	left 50%
	transform translateX(-50%) scale(0.8)
	width var(--tq-input-height)
	height var(--tq-input-height)
	color var(--tq-color-text-subtle)
	z-index 1

	&:hover
		color 'color-mix(in srgb, var(--tq-color-text-mute), transparent 50%)' % ''

	&.active
		color var(--tq-color-accent)

		&:hover
			color var(--tq-color-accent-hover)

:deep(.InputNumber:not(:first-child))
	.icon.left
		left calc(var(--tq-input-height) * .3)
</style>
