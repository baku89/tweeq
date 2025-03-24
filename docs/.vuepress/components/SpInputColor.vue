<script setup lang="ts">
import chroma from 'chroma-js'
import {InputColorProps, InputEmits, Popover} from 'tweeq'
import {computed, ref, useTemplateRef} from 'vue'

const props = defineProps<InputColorProps & {label: string}>()

const emit = defineEmits<InputEmits<string>>()

const withoutAlpha = computed(() => {
	if (!chroma.valid(props.modelValue)) {
		return props.modelValue
	}

	return chroma(props.modelValue).alpha(1).hex().replace('#', '')
})

const alpha = computed(() => {
	if (!chroma.valid(props.modelValue)) {
		return 1
	}

	return chroma(props.modelValue).alpha()
})

function onInputText(e: any) {
	emit('update:modelValue', e.target.value)
}

function onInputColor(e: any) {
	const newValue = '#' + e.target.color

	const newColor = chroma(newValue).alpha(alpha.value).hex()

	emit('update:modelValue', newColor)
}

function onInputAlpha(e: any) {
	const alpha = e.target.value as number

	if (!chroma.valid(props.modelValue)) {
		return
	}

	const newColor = chroma(props.modelValue).alpha(alpha)

	emit('update:modelValue', newColor.hex())
}

const open = ref(false)

const $button = useTemplateRef('$button')
</script>

<template>
	<div class="SpInputColor">
		<sp-theme system="spectrum" color="light" scale="medium">
			<sp-field-label>{{ label }}</sp-field-label>
			<div class="input">
				<button
					ref="$button"
					class="button"
					:style="{color: modelValue}"
					@click="open = !open"
				/>
				<sp-textfield
					class="textfield"
					:label="label"
					:value="modelValue"
					editable
					@input="onInputText"
				/>
			</div>
		</sp-theme>
		<Popover
			:open="open"
			:reference="$button"
			placement="bottom-start"
			class="popover"
			@update:open="open = $event"
		>
			<sp-theme system="spectrum" color="light" scale="medium">
				<sp-color-area :color="withoutAlpha" @input="onInputColor" />
				<sp-color-slider :color="withoutAlpha" @input="onInputColor" />
				<sp-slider
					v-if="props.alpha"
					:value="alpha"
					:step="0.01"
					:min="0"
					:max="1"
					:format-options="{style: 'unit', unit: '%'}"
					@input="onInputAlpha"
					>Alpha</sp-slider
				>
			</sp-theme>
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
@import '../../../src/InputColor/common.styl'

.SpInputColor
	margin 8px 0

.input
	display flex
	gap 4px

.button
	aspect-ratio 1
	height 32px
	border 1px solid rgb(105, 105, 105)
	border-radius 5px
	background-checkerboard()

.textfield
	flex-grow 1

.popover
	border 1px solid rgb(105, 105, 105)
	margin -1px
	padding 8px
	border-radius 8px
	background white
	margin 0

	sp-theme
		display flex
		flex-direction column
		gap 8px
</style>
