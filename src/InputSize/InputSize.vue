<script setup lang="ts">
import {scalar, vec2} from 'linearly'
import {ref} from 'vue'

import {Icon} from '../Icon'
import {InputVec} from '../InputVec'
import {InputEmits, InputProps} from '../types'

const model = defineModel<vec2>({required: true})

defineProps<InputProps>()
const emit = defineEmits<InputEmits>()

const keepRatio = ref(true)

let valueOnEdit = model.value

function onUpdate(value: vec2) {
	const bothChanged = model.value[0] !== value[0] && model.value[1] !== value[1]

	if (bothChanged) {
		const prevRatio = model.value[0] / model.value[1]
		const newRatio = value[0] / value[1]

		if (!scalar.approx(prevRatio, newRatio)) {
			keepRatio.value = false
		}
	}

	const index = model.value[0] !== value[0] ? 0 : 1

	if (keepRatio.value) {
		let ds = value[index] / valueOnEdit[index]
		if (!isFinite(ds)) ds = 1

		value = valueOnEdit.map((v, i) =>
			i !== index ? v * ds : value[index]
		) as unknown as vec2
	}

	model.value = value
}

function recordValueOnEdit() {
	valueOnEdit = model.value
	emit('focus')
}
</script>

<template>
	<div class="TqInputSize">
		<InputVec
			:modelValue="model"
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

:deep(.TqInputNumber:not(:first-child))
	.icon.left
		left calc(var(--tq-input-height) * .3)
</style>
