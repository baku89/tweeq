<script setup lang="ts">
import {computed, ref, useTemplateRef, watch} from 'vue'

import {Icon} from '../Icon'
import {Popover} from '../Popover'
import type {PaneExpandableProps} from './types'

const props = withDefaults(defineProps<PaneExpandableProps>(), {
	openIcon: 'mdi:close',
	placement: 'bottom-end',
	arrow: true,
	persistent: false,
})

const emit = defineEmits<{
	'update:open': [boolean]
	expand: []
	collapse: []
}>()

defineSlots<{default: () => any}>()

const $button = useTemplateRef<HTMLElement>('$button')

// Internal flag is the single source of truth. We can't detect "controlled" by
// `props.open === undefined`: a Boolean prop that's absent is cast to `false` by
// Vue, not left undefined. Instead we always keep the flag and mirror a bound
// `open` prop into it — uncontrolled users simply never change the prop, so the
// watch fires once (false) and the button drives the flag from there.
const internalOpen = ref(false)
watch(() => props.open, value => (internalOpen.value = value), {immediate: true})

const open = computed<boolean>({
	get: () => internalOpen.value,
	set(value) {
		if (internalOpen.value === value) return
		internalOpen.value = value
		emit('update:open', value)
		if (value) emit('expand')
		else emit('collapse')
	},
})

// Tracks hover over the round button. While open, the icon swaps to the
// collapse affordance (openIcon) only on hover — when not hovering, the button
// keeps showing its resting `icon`, so an expanded pane reads as itself rather
// than as a chevron.
const hovering = ref(false)

// Hover opens; it deliberately does NOT close on leave. A click on the button
// explicitly toggles. Dismissal is otherwise the native popover light-dismiss
// (an outside pointerdown) or Esc. A persistent pane opts out of both: it never
// hovers open and never light-dismisses, so the click is the only toggle.
function onPointerEnter() {
	hovering.value = true
	if (props.persistent) return
	open.value = true
}

function onPointerLeave() {
	hovering.value = false
}

// While open, reveal the collapse icon only on hover; otherwise keep `icon`.
const displayIcon = computed(() =>
	open.value && hovering.value ? props.openIcon : props.icon
)

// The button sits outside the popover, so a click on it while open ALSO triggers
// the native light-dismiss (which closes it and stamps this). Without the guard
// the click handler would immediately reopen what the dismiss just closed.
let lastDismissAt = 0

function onClick() {
	if (performance.now() - lastDismissAt < 200) return
	open.value = !open.value
}

function onPopoverUpdateOpen(value: boolean) {
	if (!value) lastDismissAt = performance.now()
	open.value = value
}
</script>

<template>
	<div class="TqPaneExpandable">
		<button
			ref="$button"
			class="button"
			:class="{open}"
			type="button"
			@pointerenter="onPointerEnter"
			@pointerleave="onPointerLeave"
			@click="onClick"
		>
			<Icon class="icon" :icon="displayIcon" />
		</button>
		<Popover
			:reference="$button ?? null"
			:open="open"
			:placement="placement"
			:arrow="arrow"
			:light-dismiss="!persistent"
			exit-transition
			@update:open="onPopoverUpdateOpen"
		>
			<div class="content">
				<slot />
			</div>
		</Popover>
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

// Single root so a class / positioning from the consumer falls through cleanly
// (the Popover is position:fixed, so it doesn't affect this box's size).
.TqPaneExpandable
	display inline-flex

// A subtle, frosted, round button. Background is the semi-transparent surface
// colour; backdrop-filter blurs whatever sits behind it (e.g. the preview).
.button
	display grid
	place-items center
	width 2rem
	height 2rem
	border-radius 9999px
	background var(--tq-color-surface)
	backdrop-filter blur(var(--tq-popup-blur))
	border 1px solid var(--tq-color-border)
	color var(--tq-color-text-mute)
	cursor pointer
	hover-transition(color, background, border-color)

	&:hover, &.open
		color var(--tq-color-text)

// An integer icon size (--tq-icon-size = 18px) so it centres on a whole-pixel
// grid inside the 2rem button; a fractional size (e.g. 1.1rem → 17.6px) rounds
// its left/right gutters unevenly and the glyph drifts a pixel off-centre.
.icon
	width var(--tq-icon-size)
	height var(--tq-icon-size)

// A ParameterGrid dropped straight into the pane sizes to its content rather
// than a hard-coded width: the label/icon column takes its intrinsic width (it
// never wraps, see TqParameter) while the value column keeps a usable minimum
// and grows to fit wider controls. Consumers no longer set a panel width.
.content :deep(.TqParameterGrid)
	grid-template-columns max-content minmax(var(--tq-input-comfortable-width), 1fr)
</style>
