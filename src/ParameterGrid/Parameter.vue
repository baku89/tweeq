<script setup lang="ts">
import {Icon} from '../Icon'
import type {ParameterProps} from './types'
defineProps<ParameterProps>()

defineSlots<{
	default: void
	label: void
}>()
</script>
<template>
	<li class="TqParameter">
		<div class="label">
			<slot name="label">
				<Icon v-if="icon" class="icon" :icon="icon" />
				<template v-if="label">{{ label }}</template>
			</slot>
		</div>
		<div class="input">
			<slot />
		</div>
	</li>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.TqParameter
	display grid
	grid-column 1 / 3
	grid-template-columns subgrid

.label
	line-height var(--tq-input-height)
	align-items center
	display flex
	gap var(--tq-gap-related)
	color var(--tq-color-text-mute)
	text-wrap nowrap

	// Keep icons / toggles (incl. those injected via the #label slot) at their
	// intrinsic size when the label column gets narrow — only the text should
	// give. Without this, flex's default shrink squashes the visibility toggle
	// and parameter icon as the panel narrows.
	& > :deep(*)
		flex-shrink 0

.label
	height var(--tq-input-height)

.icon
	width calc(var(--tq-input-height) - 4px)
	height calc(var(--tq-input-height) - 4px)
	color var(--tq-color-text-subtle)

.input
	display grid
	gap var(--tq-gap-related)
	align-items center
	min-width 15rem
</style>
