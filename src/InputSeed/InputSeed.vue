<script setup lang="ts">
import {InputNumber} from '../InputNumber'
import {fromNumber, InputShuffle} from '../InputShuffle'
import type {InputSeedProps} from './types'

const props = withDefaults(defineProps<InputSeedProps>(), {
	range: 1_000_000,
})

const model = defineModel<number>({required: true})

const generate = (prev: number) => fromNumber(0, props.range)(prev)
</script>

<template>
	<div class="TqInputSeed">
		<InputShuffle v-model="model" :generate="generate" />
		<InputNumber
			v-model="model"
			class="number"
			:precision="0"
			:menuItems="menuItems"
			:disabled="disabled"
		/>
	</div>
</template>

<style lang="stylus" scoped>
.TqInputSeed
	display flex
	gap var(--tq-gap-control)

.number
	flex 1 1 0
	min-width 0
</style>
