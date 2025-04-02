<script lang="ts" setup>
import {shallowRef, watch} from 'vue'

import {Icon} from '../Icon'
import {InputEmits} from '../types'
import InputColorChannelPad from './InputColorChannelPad.vue'
import InputColorChannelSlider from './InputColorChannelSlider.vue'
import InputColorChannelValues from './InputColorChannelValues.vue'
import InputColorPresets from './InputColorPresets.vue'
import {DefaultColorPickers, HSVA, type InputColorProps} from './types'
import {css2hsva, hsva2hex} from './utils'

withDefaults(defineProps<InputColorProps>(), {
	alpha: true,
	pickers: () => DefaultColorPickers,
})

defineEmits<InputEmits>()

const model = defineModel<string>({required: true})

const local = shallowRef<HSVA>(css2hsva(model.value))
let emittedModel: string | null = null

watch(
	model,
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
	model.value = emittedModel
}

function onUpdateColorCode(value: string) {
	local.value = css2hsva(value)
	emittedModel = value
	model.value = value
}

// EyeDropper
const isEyeDropperSupported = 'EyeDropper' in window

async function pickColor() {
	const eyeDropper = new (window as any)['EyeDropper']()
	model.value = (await eyeDropper.open()).sRGBHex
}
</script>

<template>
	<div class="TqInputColorPicker">
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
		<InputColorPresets :presets="presets" @update:modelValue="model = $event" />
		<button v-if="isEyeDropperSupported" class="eyeDropper" @click="pickColor">
			<Icon icon="material-symbols:colorize" />
		</button>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

.TqInputColorPicker
	padding 0
	display grid
	gap var(--tq-input-gap)


.eyeDropper
	display block
	margin 0 auto
</style>
