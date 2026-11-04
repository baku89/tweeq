<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {computed, useTemplateRef} from 'vue'

import {BindIcon} from '../BindIcon'
import {Popover} from '../Popover'
import {
	enterTooltip,
	leaveTooltip,
	TOOLTIP_ANCHOR_NAME,
	tooltipReference,
	tooltipState,
} from './tooltip'

const reference = computed(() => tooltipReference.value)

// Interactive tooltips (ones with `actions`) stay open while hovered. Listen on
// the whole popover — balloon padding and arrow included — rather than on the
// content box, so resting the pointer on its rim doesn't count as leaving.
const $content = useTemplateRef<HTMLElement>('$content')
const $popover = computed(
	() => $content.value?.closest<HTMLElement>('[popover]') ?? null
)

useEventListener($popover, 'mouseenter', enterTooltip)
useEventListener($popover, 'mouseleave', leaveTooltip)

// A click on (or inside) an element marked `data-tooltip-action="name"` runs
// the handler the tooltip's owner registered under that name.
function onClick(e: MouseEvent) {
	const actions = tooltipState.actions
	if (!actions || !(e.target instanceof Element)) return
	const name = e.target
		.closest<HTMLElement>('[data-tooltip-action]')
		?.getAttribute('data-tooltip-action')
	if (name && Object.hasOwn(actions, name)) actions[name]()
}

// Sync back the native popover's own close (Esc / programmatic), so the shared
// state never gets stuck open.
function onUpdateOpen(open: boolean) {
	if (!open) tooltipState.open = false
}
</script>

<template>
	<Popover
		:reference="reference"
		:open="tooltipState.open"
		:anchor-name="TOOLTIP_ANCHOR_NAME"
		:placement="tooltipState.placement"
		:light-dismiss="false"
		passive
		arrow
		teleport=".TqViewport"
		@update:open="onUpdateOpen"
	>
		<div ref="$content" @click="onClick">
			<!-- Structured: bold title + muted description (replaces "Title — sub"). -->
			<div
				v-if="tooltipState.title || tooltipState.description"
				class="TqTooltipContent structured"
			>
				<div v-if="tooltipState.title" class="title">
					{{ tooltipState.title }}
				</div>
				<div v-if="tooltipState.description" class="description">
					{{ tooltipState.description }}
				</div>
			</div>
			<!-- eslint-disable-next-line vue/no-v-html -->
			<div
				v-else-if="tooltipState.html"
				class="TqTooltipContent html"
				:class="{interactive: !!tooltipState.actions}"
				v-html="tooltipState.content"
			/>
			<div v-else class="TqTooltipContent plain">
				<span>{{ tooltipState.content }}</span>
				<BindIcon
					v-if="tooltipState.shortcut"
					class="shortcut"
					:icon="tooltipState.shortcut"
				/>
			</div>
		</div>
	</Popover>
</template>

<style lang="stylus" scoped>
.TqTooltipContent
	line-height 1.4
	text-align left

// Plain string tooltips read as a caption.
.plain
	display flex
	align-items center
	gap 1em
	max-width 24em
	white-space pre-line

// As a menu shows them.
.shortcut
	opacity .5

// Rich (html) tooltips carry their own structured layout (e.g. a grid), so
// keep them left-aligned and give them room.
.html
	max-width 26em

	// Clickable parts of an interactive tooltip (`actions`): the marked element
	// reads as a button. The negative margin lets the hover fill reach past the
	// text without shifting the layout.
	&.interactive :deep([data-tooltip-action])
		margin -0.2em -0.4em
		padding 0.2em 0.4em
		border-radius var(--tq-radius-input)
		cursor pointer

		&:hover
			background var(--tq-color-input-hover)

		&:active
			background var(--tq-color-accent-soft)

// Title + description: a bold caption with a muted explanatory line beneath.
.structured
	max-width 24em
	white-space pre-line

	.title
		font-weight bold

	.description
		color var(--tq-color-text-mute)
</style>
