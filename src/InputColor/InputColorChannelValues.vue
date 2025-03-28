<script setup lang="ts">
import {computed, ref} from 'vue'

import {InputDropdown} from '../InputDropdown'
import {InputGroup} from '../InputGroup'
import {InputNumber} from '../InputNumber'
import {InputString} from '../InputString'
import * as V from '../validator'
import {type ColorChannel, type ColorSpace, HSVA} from './types'
import {hsv2rgb, setHSVAChannel} from './utils'

interface Props {
	colorCode: string
	hsva: HSVA
	alpha?: boolean
}

const props = withDefaults(defineProps<Props>(), {alpha: true})

const emit = defineEmits<{
	'update:colorCode': [string]
	'update:hsva': [HSVA]
}>()

const colorSpace = ref<ColorSpace>('hsv')

const rgb = computed(() => hsv2rgb(props.hsva))

function onUpdateChannel(channel: ColorChannel, value: number) {
	const newColor = setHSVAChannel(props.hsva, channel, value)

	emit('update:hsva', newColor)
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
				:modelValue="rgb.r * 255"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				inline-position="start"
				@update:modelValue="onUpdateChannel('r', $event / 255)"
			/>
			<InputNumber
				:modelValue="rgb.g * 255"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				inline-position="middle"
				@update:modelValue="onUpdateChannel('g', $event / 255)"
			/>
			<InputNumber
				:modelValue="rgb.b * 255"
				:min="0"
				:max="255"
				:precision="0"
				:bar="false"
				:inline-position="props.alpha ? 'middle' : 'end'"
				@update:modelValue="onUpdateChannel('b', $event / 255)"
			/>
			<InputNumber
				v-if="props.alpha"
				:modelValue="hsva.a * 100"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				inline-position="end"
				@update:modelValue="onUpdateChannel('a', $event / 100)"
			/>
		</InputGroup>
		<InputGroup v-else-if="colorSpace === 'hsv'" class="channel">
			<InputNumber
				:modelValue="hsva.h * 360"
				:min="0"
				:max="360"
				:precision="0"
				:bar="false"
				suffix="°"
				inline-position="start"
				@update:modelValue="onUpdateChannel('h', $event / 360)"
			/>
			<InputNumber
				:modelValue="hsva.s * 100"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				inline-position="middle"
				@update:modelValue="onUpdateChannel('s', $event / 100)"
			/>
			<InputNumber
				:modelValue="hsva.v * 100"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				:inline-position="props.alpha ? 'middle' : 'end'"
				@update:modelValue="onUpdateChannel('v', $event / 100)"
			/>
			<InputNumber
				v-if="props.alpha"
				:modelValue="hsva.a * 100"
				:min="0"
				:max="100"
				:precision="0"
				:bar="false"
				suffix="%"
				inline-position="end"
				@update:modelValue="onUpdateChannel('a', $event / 100)"
			/>
		</InputGroup>
		<InputString
			v-else-if="colorSpace === 'hex'"
			font="monospace"
			class="channel"
			:modelValue="colorCode"
			:validator="V.colorCode"
			@update:modelValue="emit('update:colorCode', $event)"
		/>
	</InputGroup>
</template>

<style lang="stylus" scoped>

.color-space
	width 4.5em
	flex-shrink 0

.channel
	flex-grow 1
</style>
