<script lang="ts" setup generic="T">
import {Icon} from '@iconify/vue'
import {useElementBounding, whenever} from '@vueuse/core'
import {search} from 'fast-fuzzy'
import {type vec2} from 'linearly'
import {computed, Ref, ref, shallowRef, watch} from 'vue'

import InputString from './InputString'
import Popover from './Popover.vue'
import {useThemeStore} from './stores/theme'
import {
	InputAlign,
	InputFont,
	InputProps,
	InputTheme,
	LabelizerProps,
	useLabelizer,
} from './types'
import {unsignedMod} from './util'

type Props = LabelizerProps<T> &
	InputProps & {
		modelValue: T
		icons?: string[]
		theme?: InputTheme
		font?: InputFont
		align?: InputAlign
	}

const props = withDefaults(defineProps<Props>(), {
	prefix: '',
	suffix: '',
})

const labelizer = useLabelizer(props)

const uiTheme = useThemeStore()

const emit = defineEmits<{
	'update:modelValue': [value: T]
	focus: [e: Event]
	blur: [e: Event]
}>()

defineOptions({
	inheritAttrs: false,
})

const open = ref(false)
const $root = shallowRef<HTMLElement | null>(null)

const rootBound = useElementBounding($root)

const display = ref(labelizer.value(props.modelValue))
const displayEdited = ref(false)

watch(
	() => [open.value, props.modelValue] as const,
	([open, modelValue]) => {
		if (open) return
		display.value = labelizer.value(modelValue)
		displayEdited.value = false
	}
)

const startValue = ref(props.modelValue) as Ref<T>

const filteredOptions = computed(() => {
	if (display.value === '' || !displayEdited.value) return props.options

	const ret = search(display.value, props.options as any[], {
		keySelector: labelizer.value,
	}) as T[]

	return ret
})

const popoverPlacement = computed<vec2 | 'bottom'>(() => {
	// 2px === border width + focus outline

	if (displayEdited.value) {
		return [rootBound.left.value - 2, rootBound.bottom.value]
	} else {
		let index = props.options.indexOf(startValue.value)

		if (index === -1) index = 0

		return [
			rootBound.left.value - 2,
			rootBound.top.value + -index * uiTheme.inputHeight - 2,
		]
	}
})

watch(filteredOptions, filteredOptions => {
	if (!filteredOptions.includes(props.modelValue)) {
		emit('update:modelValue', filteredOptions[0])
	}
})

let timeAtOpen: number | null = null

whenever(open, () => {
	startValue.value = props.modelValue
	timeAtOpen = new Date().getTime()
})

function onSelect(option: T, e: PointerEvent) {
	const elapsedFromOpen = new Date().getTime() - (timeAtOpen ?? 0)

	// Drag and release to close the dropdown
	if (e.type === 'pointerup' && e.isPrimary && elapsedFromOpen > 500) {
		open.value = false
	}
	emit('update:modelValue', option)
}

function onPressArrow(isUp: boolean) {
	const length = filteredOptions.value.length
	const index = filteredOptions.value.indexOf(props.modelValue)
	const newIndex = unsignedMod(index + (isUp ? -1 : 1), length)
	const option = filteredOptions.value[newIndex]
	emit('update:modelValue', option)
}

function onInputPointerdown(e: PointerEvent) {
	if (e.isPrimary) {
		open.value = true
	}
}

function onInputStringFocus(e: Event) {
	open.value = true
	emit('focus', e)
}

function onInput() {
	displayEdited.value = true
	open.value = true
}

function onInputStringBlur(e: Event) {
	open.value = false
	emit('blur', e)
}
</script>

<template>
	<div
		ref="$root"
		class="InputDropdown"
		:class="{open}"
		v-bind="$attrs"
		:align="align"
		:disabled="disabled"
	>
		<InputString
			v-model="display"
			class="input"
			:theme="theme"
			:font="font"
			:align="align"
			:forceUpdateOnFocusing="true"
			:horizontal-position="horizontalPosition"
			:vertical-position="verticalPosition"
			@pointerdown="onInputPointerdown"
			@focus="onInputStringFocus"
			@blur="onInputStringBlur"
			@input="onInput"
			@keydown.enter.prevent="open = !open"
			@keydown.up.prevent="onPressArrow(true)"
			@keydown.down.prevent="onPressArrow(false)"
		/>
		<Icon class="chevron" icon="mdi:unfold-more-horizontal" />
		<Popover
			v-model:open="open"
			:reference="$root"
			:placement="popoverPlacement"
			:lightDismiss="false"
		>
			<ul
				class="select"
				:style="{width: rootBound.width.value + 2 + 'px'}"
				:font="font"
				:align="align"
			>
				<li
					v-for="(item, index) in filteredOptions"
					:key="index"
					class="option"
					:class="{
						active: item === modelValue,
						startValue: item === startValue,
					}"
					@pointerup="onSelect(item, $event)"
					@pointerenter="onSelect(item, $event)"
				>
					<slot name="option" :item="item">
						<Icon
							v-if="icons && icons[index]"
							class="option-icon"
							:icon="icons[index]"
						/>
						{{ labelizer(item) }}
					</slot>
				</li>
			</ul>
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
@import './common.styl'

$right-arrow-width = 1em

.InputDropdown
	position relative
	display inline-block
	width 100%
	height var(--tq-input-height)

	&.open .input
		background var(--tq-color-accent-hover)

.input
	cursor default

.chevron
	position absolute
	top 0
	z-index 10
	right 2px
	width calc(.8 * var(--tq-input-height))
	height 100%
	pointer-events none
	color var(--tq-color-gray-on-background)
	opacity .4
	hover-transition(opacity)

	.InputDropdown:hover &,
	.InputDropdown:focus-within &
		opacity 1

.select
	margin 1px
	padding 0
	background set-alpha(--tq-color-input, .8)
	backdrop-filter blur(6px)
	border 1px solid var(--tq-color-border)
	border-radius var(--tq-input-border-radius)
	overflow hidden

	use-input-align()
	use-input-font()

.option
	padding 0 12px
	height var(--tq-input-height)
	line-height var(--tq-input-height)
	display flex
	gap 4px
	align-items center
	align-content center
	justify-content center
	color var(--tq-color-on-background)
	border-radius var(--tq-input-border-radius)

	&.startValue
		background var(--tq-color-input-vivid-accent)

	&.active
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.option-icon
	width calc(var(--tq-input-height) - 4px)
	height calc(var(--tq-input-height) - 4px)
</style>
