<script lang="ts" setup>
import {ref, watch} from 'vue'

import {Icon} from '../Icon'
import {InputEmits} from '../types'
import InputColorChannelPad from './InputColorChannelPad.vue'
import InputColorChannelSlider from './InputColorChannelSlider.vue'
import InputColorChannelValues from './InputColorChannelValues.vue'
import InputColorPresets from './InputColorPresets.vue'
import {DefaultColorPickers, HSVA, type InputColorProps} from './types'
import {css2hsva, hsva2hex} from './utils'

const props = withDefaults(defineProps<InputColorProps>(), {
	alpha: true,
	pickers: () => DefaultColorPickers,
})

const emit = defineEmits<InputEmits<string>>()

const local = ref<HSVA>(css2hsva(props.modelValue))
let emittedModel: string | null = null

watch(
	() => props.modelValue,
	model => {
		if (model !== emittedModel) {
			local.value = css2hsva(model)
		}
	},
	{flush: 'sync'}
)

function onUpdateLocal(value: HSVA) {
	local.value = value
	emittedModel = hsva2hex(value)
	emit('update:modelValue', emittedModel)
}

function onUpdateColorCode(value: string) {
	local.value = css2hsva(value)
	emittedModel = value
	emit('update:modelValue', value)
}

// EyeDropper
const isEyeDropperSupported = 'EyeDropper' in window

async function pickColor() {
	const eyeDropper = new (window as any)['EyeDropper']()
	const newValue: string = (await eyeDropper.open()).sRGBHex

	emit('update:modelValue', newValue)
}
</script>

<template>
	<div class="InputColorPicker">
		<template v-for="([type, ch], i) in pickers">
			<InputColorChannelPad
				v-if="type === 'pad'"
				:key="i"
				:modelValue="local"
				:axes="ch"
				@update:modelValue="onUpdateLocal"
			/>
			<InputColorChannelSlider
				v-if="type === 'slider' && !(!alpha && ch === 'a')"
				:key="i"
				:modelValue="local"
				:axis="ch"
				@update:modelValue="onUpdateLocal"
			/>
			<InputColorChannelValues
				v-if="type === 'values'"
				:key="i"
				:colorCode="modelValue"
				:hsva="local"
				:alpha="alpha"
				@update:colorCode="onUpdateColorCode"
				@update:hsva="onUpdateLocal"
			/>
		</template>
		<InputColorPresets
			:presets="presets"
			@update:modelValue="emit('update:modelValue', $event)"
		/>
		<button v-if="isEyeDropperSupported" class="eyeDropper" @click="pickColor">
			<Icon icon="material-symbols:colorize" />
		</button>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.InputColorPicker
	padding 0
	display grid
	gap var(--tq-input-gap)


.eyeDropper
	display block
	margin 0 auto
</style>
