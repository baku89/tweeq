<script setup lang="ts">
import {computed} from 'vue'

import {Popover} from '../Popover'
import {TOOLTIP_ANCHOR_NAME, tooltipReference, tooltipState} from './tooltip'

const reference = computed(() => tooltipReference.value)

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
		placement="top"
		:light-dismiss="false"
		arrow
		teleport=".TqViewport"
		@update:open="onUpdateOpen"
	>
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
			v-html="tooltipState.content"
		/>
		<div v-else class="TqTooltipContent plain">{{ tooltipState.content }}</div>
	</Popover>
</template>

<style lang="stylus" scoped>
.TqTooltipContent
	font-size 0.9em
	line-height 1.4

// Plain string tooltips read as a centred caption.
.plain
	max-width 18em
	text-align center
	white-space pre-line

// Rich (html) tooltips carry their own structured layout (e.g. a grid), so
// keep them left-aligned and give them room.
.html
	max-width 26em
	text-align left

// Title + description: a bold caption with a muted explanatory line beneath.
.structured
	max-width 20em
	text-align center
	white-space pre-line

	.title
		font-weight bold

	.description
		color var(--tq-color-text-mute)
		// Slightly tighter so the description reads as secondary.
		font-size 0.95em
</style>
