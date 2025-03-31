<script setup lang="ts">
import chroma from 'chroma-js'
import {InputColorProps, InputEmits, Popover} from 'tweeq'
import {computed, ref, useTemplateRef} from 'vue'

const model = defineModel<string>({required: true})

const props = defineProps<InputColorProps & {label: string}>()

defineEmits<InputEmits>()

const withoutAlpha = computed(() => {
	if (!chroma.valid(model.value)) {
		return model.value
	}

	return chroma(model.value).alpha(1).hex().replace('#', '')
})

const alpha = computed(() => {
	if (!chroma.valid(model.value)) {
		return 1
	}

	return chroma(model.value).alpha()
})

function onInputText(e: any) {
	model.value = e.target.value
}

function onInputColor(e: any) {
	const newValue = '#' + e.target.color

	const newColor = chroma(newValue).alpha(alpha.value).hex()

	model.value = newColor
}

function onInputAlpha(e: any) {
	const alpha = e.target.value as number

	if (!chroma.valid(model.value)) {
		return
	}

	const newColor = chroma(model.value).alpha(alpha)

	model.value = newColor.hex()
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
					:style="{color: model}"
					@click="open = !open"
				/>
				<sp-textfield
					class="textfield"
					:label="label"
					:value="withoutAlpha"
					editable
					@input="onInputText"
				/>
				<template v-if="props.alpha">
					<sp-number-field
						:value="alpha"
						format-options='{"style": "percent"}'
						hide-stepper
						@input="onInputAlpha"
					/>
				</template>
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
					:format-options="{style: 'percent', unit: '%'}"
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
