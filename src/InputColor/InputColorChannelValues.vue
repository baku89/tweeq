<script setup lang="ts">
import chroma from 'chroma-js'
import {computed, ref} from 'vue'

import {InputDropdown} from '../InputDropdown'
import {InputGroup} from '../InputGroup'
import {InputNumber} from '../InputNumber'
import {InputString} from '../InputString'
import {type Channels, type ColorChannel, type ColorSpace} from './types'

interface Props {
	modelValue: string
	channels: Channels
	alpha?: boolean
}

const props = withDefaults(defineProps<Props>(), {alpha: true})

const emit = defineEmits<{
	'update:modelValue': [string]
	updateChannels: [Partial<Channels>]
}>()

const colorSpace = ref<ColorSpace>('hsv')

const r = computed(() => props.channels.r * 255)
const g = computed(() => props.channels.g * 255)
const b = computed(() => props.channels.b * 255)
const a = computed(() => props.channels.a * 100)

const h = computed(() => props.channels.h * 360)
const s = computed(() => props.channels.s * 100)
const v = computed(() => props.channels.v * 100)

function onUpdateChannel(channel: ColorChannel, value: number) {
	let max = 255

	if (channel === 'h') {
		max = 360
	} else if (channel === 'a' || channel === 's' || channel === 'v') {
		max = 100
	}

	emit('updateChannels', {[channel]: value / max})
}

const colorCode = computed(() => {
	return props.modelValue
})

function colorCodeValidator(value: string) {
	if (value.startsWith('0x')) {
		value = value.slice(2)
	}

	if (chroma.valid(value)) {
		return value
	} else if (chroma.valid(`#${value}`)) {
		return `#${value}`
	} else if (/^[0-9a-f]$/.test(value)) {
		return `#${value.repeat(6)}`
	}
	return undefined
}
</script>

<template>
	<InputGroup class="InputColorChannelValues">
		<InputDropdown
			v-model="colorSpace"
			class="color-space"
			theme="minimal"
			:options="['rgb', 'hsv', 'hex']"
			:labelizer="s => s.toUpperCase()"
		/>
		<InputGroup v-if="colorSpace === 'rgb'" class="channel">
			<InputNumber
				:modelValue="r"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				horizontal-position="left"
				@update:modelValue="onUpdateChannel('r', $event)"
			/>
			<InputNumber
				:modelValue="g"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				horizontal-position="middle"
				@update:modelValue="onUpdateChannel('g', $event)"
			/>
			<InputNumber
				:modelValue="b"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				:horizontal-position="props.alpha ? 'middle' : 'right'"
				@update:modelValue="onUpdateChannel('b', $event)"
			/>
			<InputNumber
				v-if="props.alpha"
				:modelValue="a"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				horizontal-position="right"
				@update:modelValue="onUpdateChannel('a', $event)"
			/>
		</InputGroup>
		<InputGroup v-else-if="colorSpace === 'hsv'" class="channel">
			<InputNumber
				:modelValue="h"
				:min="0"
				:max="360"
				:precision="0"
				:bar="false"
				suffix="°"
				horizontal-position="left"
				@update:modelValue="onUpdateChannel('h', $event)"
			/>
			<InputNumber
				:modelValue="s"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				horizontal-position="middle"
				@update:modelValue="onUpdateChannel('s', $event)"
			/>
			<InputNumber
				:modelValue="v"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				:horizontal-position="props.alpha ? 'middle' : 'right'"
				@update:modelValue="onUpdateChannel('v', $event)"
			/>
			<InputNumber
				v-if="props.alpha"
				:modelValue="a"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				horizontal-position="right"
				@update:modelValue="onUpdateChannel('a', $event)"
			/>
		</InputGroup>
		<InputString
			v-else-if="colorSpace === 'hex'"
			font="monospace"
			class="channel"
			:modelValue="colorCode"
			:validator="colorCodeValidator"
			@update:modelValue="emit('update:modelValue', $event)"
		/>
	</InputGroup>
</template>

<style lang="stylus" scoped>

.color-space
	width 5em

.channel
	flex-grow 1
</style>
