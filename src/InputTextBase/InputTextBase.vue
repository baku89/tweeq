<script lang="ts" setup>
import {computed, ref, useTemplateRef} from 'vue'

import {Icon} from '../Icon'
import {Menu, type MenuItem} from '../Menu'
import {Popover} from '../Popover'
import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
} from '../types'

export interface InputTextBaseProps extends InputBoxProps {
	ignoreInput?: boolean
	hover?: boolean
	active?: boolean
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
	leftIcon?: string
	rightIcon?: string
	/**
	 * When set, the right-click menu offers "Reset to Default" (emits `reset`).
	 * It's only the presence that matters here — the wrapper holds the value.
	 */
	default?: unknown
	/** Extra right-click menu items appended below "Reset to Default". */
	menuItems?: MenuItem[]
}

const model = defineModel<string>({required: true})

const props = defineProps<InputTextBaseProps>()

const emit = defineEmits<{
	focus: [e: FocusEvent]
	blur: [e: FocusEvent]
	keydown: [e: KeyboardEvent]
	confirm: []
	reset: []
	'update:focused': [value: boolean]
}>()

// Right-click context menu, shared by every InputTextBase-based field. Opens at
// the cursor via a coordinate-placed Popover.
const $root = useTemplateRef('$root')
const menuOpen = ref(false)
const menuPosition = ref<[number, number]>([0, 0])

const contextMenuItems = computed<MenuItem[]>(() => {
	const items: MenuItem[] = []
	if (props.default !== undefined) {
		items.push({
			label: 'Reset to Default',
			icon: 'mdi:restore',
			perform: () => emit('reset'),
		})
	}
	if (props.menuItems?.length) {
		if (items.length > 0) items.push({separator: true})
		items.push(...props.menuItems)
	}
	return items
})

function onContextMenu(e: MouseEvent) {
	if (contextMenuItems.value.length === 0) return
	e.preventDefault()
	menuPosition.value = [e.clientX, e.clientY]
	menuOpen.value = true
}

const slots = defineSlots<{
	back: () => any
	front: () => any
	inactiveContent: () => any
}>()

defineExpose({
	select: (start?: number, end?: number) => {
		if (start === undefined) {
			$input.value?.select()
		} else {
			$input.value?.setSelectionRange(start, end ?? start + 1)
			$input.value?.focus()
		}
	},
})

const hasInactiveContent = computed(() => !!slots.inactiveContent)

const $input = useTemplateRef('$input')

function onInput(e: Event) {
	model.value = (e.target as HTMLInputElement).value
}

function onFocus(e: FocusEvent) {
	emit('update:focused', true)
	emit('focus', e)
}

function onBlur(e: FocusEvent) {
	emit('update:focused', false)
	emit('blur', e)
}
</script>

<template>
	<div
		ref="$root"
		class="TqInputTextBase"
		:class="{
			active,
			invalid,
			hover,
		}"
		:theme="theme"
		:font="font"
		:align="align"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		@contextmenu="onContextMenu"
	>
		<slot name="back" />
		<input
			ref="$input"
			class="input"
			type="text"
			:class="{ignore: ignoreInput, 'has-inactive-content': hasInactiveContent}"
			:value="model"
			:disabled="disabled || undefined"
			@focus="onFocus"
			@blur="onBlur"
			@input="onInput"
			@keydown="emit('keydown', $event)"
			@keydown.enter="emit('confirm')"
		/>

		<div v-if="hasInactiveContent" class="inactive-content">
			<slot name="inactiveContent" />
		</div>

		<Icon v-if="leftIcon" class="icon left" :icon="leftIcon" />
		<Icon v-if="rightIcon" class="icon right" :icon="rightIcon" />

		<slot name="front" />

		<!-- Teleported out of this box: its container-type / overflow would
			otherwise become the containing block for the fixed popover and clip it. -->
		<Popover
			v-if="menuOpen"
			:reference="$root"
			:placement="menuPosition"
			:open="menuOpen"
			teleport=".TqViewport"
			@update:open="menuOpen = $event"
		>
			<Menu :items="contextMenuItems" @close="menuOpen = false" />
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqInputTextBase
	position relative
	height var(--tq-input-height)
	border-radius var(--tq-radius-input)
	background var(--tq-color-input)
	color var(--tq-color-text)
	hover-transition(background, box-shadow)
	flex-grow 1
	overflow hidden
	container-type inline-size

	use-input-font()
	use-input-align()
	use-input-position()
	use-input-theme()

	// Hover
	&:hover, &.hover
		background var(--tq-color-input-hover)

	// Focused
	&:focus-within, &.active
		z-index 1
		box-shadow 0 0 0 1px var(--tq-color-accent)

	// Disabled
	&:has(.input:disabled)
		background transparent
		--tq-color-accent var(--tq-color-text-border)
		--tq-color-accent-soft var(--tq-color-border-subtle)
		--tq-color-text var(--tq-color-text-mute)
		box-shadow inset 0 0 0 1px var(--tq-color-border)

	// Invalid
	&.invalid
		--tq-color-text var(--tq-color-error)

.input, .inactive-content
	position absolute
	inset 0 .5em
	overflow-x visible

	.TqInputTextBase:has(.icon.left) &
		left calc(var(--tq-icon-size))

	.TqInputTextBase:has(.icon.right) &
		right calc(var(--tq-icon-size))

.input
	height var(--tq-input-height)

	@container (max-width: 100px)
		&
			padding-inline 0

	&.has-inactive-content:not(:focus)
		opacity 0

	&.ignore
		pointer-events none

.inactive-content
	pointer-events none

	& > *
		pointer-events auto


	:focus + &
		display none


.icon
	margin calc((var(--tq-input-height) - var(--tq-icon-size)) / 2)
	color var(--tq-color-text-mute)
	transform scale(0.8)
	opacity .7
	position absolute
	z-index 100
	pointer-events none
	top 0

	&.left
		left 2px

	&.right
		right 2px
</style>
