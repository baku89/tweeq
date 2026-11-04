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
	/** The left icon can be pressed, which emits `leftIconClick`. */
	leftIconPressable?: boolean
	rightIcon?: string
	/** The right icon can be pressed, which emits `rightIconClick`. */
	rightIconPressable?: boolean
	/** Shown while the input is empty. */
	placeholder?: string
	/**
	 * When set, the right-click menu offers "Reset to Default" (emits `reset`).
	 * It's only the presence that matters here — the wrapper holds the value.
	 */
	default?: unknown
	/** Extra right-click menu items appended below "Reset to Default". */
	menuItems?: MenuItem[]
	/**
	 * What there is a reason to choose rather than to arrive at, listed from a chevron at the
	 * right, which is in place of `rightIcon`. A value, or what depends on more than this field.
	 */
	presets?: MenuItem[]
	/**
	 * Grow with its lines. Enter still confirms, and Shift+Enter breaks the line.
	 * With `inactiveContent`, it stays one line tall until it has focus.
	 */
	multiline?: boolean
	/** What any space goes in as, however it got there, for what cannot have one, such as a name. */
	spaceAs?: string
}

const model = defineModel<string>({required: true})

const props = defineProps<InputTextBaseProps>()

const emit = defineEmits<{
	focus: [e: FocusEvent]
	blur: [e: FocusEvent]
	keydown: [e: KeyboardEvent]
	confirm: []
	reset: []
	leftIconClick: []
	rightIconClick: []
	'update:focused': [value: boolean]
}>()

// Right-click context menu, shared by every InputTextBase-based field. Opens at
// the cursor via a coordinate-placed Popover.
const $root = useTemplateRef('$root')
const menuPosition = ref<[number, number]>([0, 0])
const openMenu = ref<'context' | 'presets' | null>(null)

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
	openMenu.value = 'context'
}

const hasPresets = computed(() => (props.presets?.length ?? 0) > 0)

function onPresetsClick(e: MouseEvent) {
	e.stopPropagation()
	openMenu.value = openMenu.value === 'presets' ? null : 'presets'
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
	blur: () => $input.value?.blur(),
})

const hasInactiveContent = computed(() => !!slots.inactiveContent)

const $input = useTemplateRef<HTMLInputElement | HTMLTextAreaElement>('$input')

function onPaste(e: ClipboardEvent) {
	const text = e.clipboardData?.getData('text') ?? ''
	if (props.spaceAs === undefined || !/\s/.test(text)) return
	e.preventDefault()
	insertText(text.trim().replace(/\s+/g, props.spaceAs))
}

/**
 * What got in some other way, by whatever was being typed with, such as a full-width
 * space. Not while it is being composed, where a space is what chooses a word.
 */
function replaceSpaces(input: HTMLInputElement | HTMLTextAreaElement): void {
	const {spaceAs} = props
	if (spaceAs === undefined || !/\s/.test(input.value)) return
	const caret = input.selectionStart ?? input.value.length
	const before = input.value.slice(0, caret).replace(/\s/g, spaceAs)
	input.value = before + input.value.slice(caret).replace(/\s/g, spaceAs)
	input.setSelectionRange(before.length, before.length)
}

function onInput(e: Event) {
	const input = e.target as HTMLInputElement
	if (!(e as InputEvent).isComposing) replaceSpaces(input)
	model.value = input.value
}

function onCompositionEnd(e: CompositionEvent) {
	const input = e.target as HTMLInputElement
	replaceSpaces(input)
	model.value = input.value
}

function onFocus(e: FocusEvent) {
	emit('update:focused', true)
	emit('focus', e)
}

function onBlur(e: FocusEvent) {
	emit('update:focused', false)
	emit('blur', e)
}

/** Where the caret is, and so that an undo takes it back out, as any typing would. */
const insertText = (text: string): void => void document.execCommand('insertText', false, text)

function onKeydown(e: KeyboardEvent) {
	const isSpace = /^\s$/.test(e.key) && !e.isComposing && !e.metaKey && !e.ctrlKey
	if (props.spaceAs !== undefined && isSpace) {
		e.preventDefault()
		insertText(props.spaceAs)
		return
	}
	// Stop a focused field's typing (incl. single-key shortcuts like "v") from
	// reaching app-wide shortcut handlers. Let Escape / Enter / Tab and modifier
	// combos (cmd/ctrl+…) through, so dialog dismissal and global shortcuts still
	// work while a field is focused.
	if (
		!e.metaKey &&
		!e.ctrlKey &&
		e.key !== 'Escape' &&
		e.key !== 'Enter' &&
		e.key !== 'Tab'
	) {
		e.stopPropagation()
	}
	if (props.multiline && e.key === 'Enter' && !e.shiftKey) e.preventDefault()
	emit('keydown', e)
}

function onLeftIconClick(e: MouseEvent) {
	if (!props.leftIconPressable) return
	e.stopPropagation()
	emit('leftIconClick')
}

function onRightIconClick(e: MouseEvent) {
	if (!props.rightIconPressable) return
	e.stopPropagation()
	emit('rightIconClick')
}

function onEnter(e: KeyboardEvent) {
	if (props.multiline && e.shiftKey) return
	emit('confirm')
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
			multiline,
		}"
		:theme="theme"
		:font="font"
		:align="align"
		:inline-position="inlinePosition"
		:block-position="blockPosition"
		@contextmenu="onContextMenu"
	>
		<slot name="back" />
		<component
			:is="multiline ? 'textarea' : 'input'"
			ref="$input"
			class="input"
			:type="multiline ? undefined : 'text'"
			:rows="multiline ? 1 : undefined"
			:class="{ignore: ignoreInput, 'has-inactive-content': hasInactiveContent}"
			:value="model"
			:placeholder="placeholder"
			:disabled="disabled || undefined"
			@focus="onFocus"
			@blur="onBlur"
			@input="onInput"
			@keydown="onKeydown"
			@keydown.enter="onEnter"
			@paste="onPaste"
			@compositionend="onCompositionEnd"
		/>

		<div v-if="hasInactiveContent" class="inactive-content">
			<slot name="inactiveContent" />
		</div>

		<Icon
			v-if="leftIcon"
			class="icon left"
			:class="{pressable: leftIconPressable}"
			:icon="leftIcon"
			@click="onLeftIconClick"
		/>
		<Icon
			v-if="hasPresets"
			class="icon right pressable presets"
			:class="{open: openMenu === 'presets'}"
			icon="mdi:chevron-down"
			@pointerdown.stop
			@click="onPresetsClick"
		/>
		<Icon
			v-else-if="rightIcon"
			class="icon right"
			:class="{pressable: rightIconPressable}"
			:icon="rightIcon"
			@click="onRightIconClick"
		/>

		<slot name="front" />

		<!-- Teleported out of this box: its container-type / overflow would
			otherwise become the containing block for the fixed popover and clip it. -->
		<Popover
			v-if="openMenu"
			:reference="$root"
			:placement="openMenu === 'presets' ? 'bottom-end' : menuPosition"
			:open="true"
			teleport=".TqViewport"
			@update:open="openMenu = $event ? openMenu : null"
		>
			<Menu
				:items="openMenu === 'presets' ? (presets ?? []) : contextMenuItems"
				@close="openMenu = null"
			/>
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

	// Past the icon, which is centered in a square as tall as the input.
	.TqInputTextBase:has(.icon.left) &
		left var(--tq-input-height)

	.TqInputTextBase:has(.icon.right) &
		right var(--tq-input-height)

	// What is centered stays in the middle of the input, whichever side has an icon.
	.TqInputTextBase[align=center]:has(.icon.left) &
		right var(--tq-input-height)

	.TqInputTextBase[align=center]:has(.icon.right) &
		left var(--tq-input-height)

.input
	height var(--tq-input-height)

	&::placeholder
		color var(--tq-color-text-mute)

	@container (max-width: 100px)
		&
			padding-inline 0

	&.has-inactive-content:not(:focus)
		opacity 0

	&.ignore
		pointer-events none

.TqInputTextBase.multiline
	height auto
	min-height var(--tq-input-height)

	.input
		position static
		display block
		width 100%
		height auto
		min-height var(--tq-input-height)
		max-height 40vh
		padding calc((var(--tq-input-height) - 1lh) / 2) .5em
		field-sizing content
		resize none

		&.has-inactive-content:not(:focus)
			height var(--tq-input-height)
			overflow hidden

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

	&.pressable
		pointer-events auto
		cursor pointer
		hover-transition(opacity, color)

		&:hover
			color var(--tq-color-text)
			opacity 1

	&.left
		left 2px

	&.right
		right 2px
</style>
