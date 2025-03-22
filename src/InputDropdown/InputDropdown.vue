<script lang="ts" setup generic="T">
import {useCssVar, useElementBounding, whenever} from '@vueuse/core'
import {search} from 'fast-fuzzy'
import {type vec2} from 'linearly'
import {
	computed,
	onBeforeUnmount,
	type Ref,
	ref,
	useTemplateRef,
	watch,
} from 'vue'

import {Icon} from '../Icon'
import {InputString} from '../InputString'
import {Popover} from '../Popover'
import {type InputEmits, useLabelizer} from '../types'
import {unsignedMod} from '../util'
import type {InputDropdownProps} from './types'

const props = withDefaults(defineProps<InputDropdownProps<T>>(), {
	prefix: '',
	suffix: '',
	align: 'center',
})

const labelizer = useLabelizer(props)

const emit = defineEmits<InputEmits<T>>()

defineOptions({
	inheritAttrs: false,
})

const open = ref(false)
const $root = useTemplateRef('$root')
const $input = useTemplateRef('$input')

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

const valueAtStart = ref(props.modelValue) as Ref<T>

const filteredOptions = computed(() => {
	if (display.value === '' || !displayEdited.value) return props.options

	const ret = search(display.value, props.options as any[], {
		keySelector: labelizer.value,
	}) as T[]

	return ret
})

const inputHeight = useCssVar('--tq-input-height', $root)

const popoverPlacement = computed<vec2 | 'bottom'>(() => {
	// 2px === border width + focus outline

	if (displayEdited.value) {
		return [rootBound.left.value - 2, rootBound.bottom.value]
	} else {
		let index = props.options.indexOf(valueAtStart.value)

		if (index === -1) index = 0

		return [
			rootBound.left.value - 2,
			rootBound.top.value + -index * parseFloat(inputHeight.value ?? '0') - 2,
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
	valueAtStart.value = props.modelValue
	timeAtOpen = new Date().getTime()
	window.addEventListener('pointerup', onPointerupWhileOpen)
})

function onSelect(option: T) {
	emit('update:modelValue', option)
}

function onPointerupWhileOpen() {
	const elapsedFromOpen = new Date().getTime() - (timeAtOpen ?? 0)

	if (elapsedFromOpen > 500) {
		open.value = false
		emit('confirm')
		emit('blur')
		window.removeEventListener('pointerup', onPointerupWhileOpen)
	} else {
		$input.value?.select()
	}
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

function onInputStringFocus() {
	open.value = true
	emit('focus')
}

function onInputStringUpdate(value: string) {
	display.value = value

	displayEdited.value = true
	open.value = true
}

function onInputStringBlur() {
	if (!open.value) {
		emit('blur')
	}
}

// When the popover is closed by pressing Esc, revert to the value at the start
function onPopoverUpdateOpen(_open: boolean) {
	if (!_open) {
		open.value = false
		window.removeEventListener('pointerup', onPointerupWhileOpen)
		emit('update:modelValue', valueAtStart.value)
	}
}

onBeforeUnmount(() => {
	window.removeEventListener('pointerup', onPointerupWhileOpen)
})
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
			ref="$input"
			:modelValue="display"
			class="input"
			:theme="theme"
			:font="font"
			:align="align"
			:horizontal-position="horizontalPosition"
			:vertical-position="verticalPosition"
			:disabled="disabled"
			:invalid="invalid"
			@update:modelValue="onInputStringUpdate"
			@pointerdown="onInputPointerdown"
			@focus="onInputStringFocus"
			@blur="onInputStringBlur"
			@keydown.enter.prevent="open = !open"
			@keydown.up.prevent="onPressArrow(true)"
			@keydown.down.prevent="onPressArrow(false)"
			@keydown="onInputStringInput"
		/>
		<Icon class="chevron" icon="mdi:unfold-more-horizontal" />
		<Popover
			:open="open"
			:reference="$root"
			:placement="popoverPlacement"
			:lightDismiss="false"
			@update:open="onPopoverUpdateOpen"
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
						current: item === valueAtStart,
					}"
					@pointerenter="onSelect(item)"
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
@import '../common.styl'

$right-arrow-width = 1em
$chevron-width = calc(.7 * var(--tq-input-height))

.InputDropdown
	position relative
	display inline-block
	width 100%
	height var(--tq-input-height)

.input
	cursor default
	padding-right $chevron-width

.chevron
	position absolute
	top 0
	z-index 10
	right 2px
	width $chevron-width
	height 100%
	pointer-events none
	color var(--tq-color-text-subtle)
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
	opacity .1

	use-input-align()
	use-input-font()

.option
	padding 0 $chevron-width 0 .5em
	height var(--tq-input-height)
	line-height var(--tq-input-height)
	display flex
	gap 4px
	align-items center
	align-content center
	justify-content center
	color var(--tq-color-text)
	border-radius var(--tq-input-border-radius)

	&.current
		background var(--tq-color-accent-soft)

	&.active
		background var(--tq-color-accent)
		color var(--tq-color-on-accent)

.option-icon
	width calc(var(--tq-input-height) - 4px)
	height calc(var(--tq-input-height) - 4px)
</style>
