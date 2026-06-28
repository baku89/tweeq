<script lang="ts" setup>
import {Icon} from '../Icon'
import {IconIndicatorProps} from './types'

defineProps<IconIndicatorProps>()

defineEmits<{
	'update:active': [boolean]
}>()
</script>

<template>
	<div
		class="IconIndicator"
		:class="{active: active, inactive: active === false, inline}"
		@click="$emit('update:active', !active)"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.IconIndicator
	--size var(--tq-input-height)
	height var(--size)
	width var(--size)
	display flex
	align-items center
	justify-content center
	hover-transition(color)
	border-radius 9999px
	color var(--tq-color-text)

	// Inline variant: shrink to the nested icon size so it sits naturally next
	// to text instead of occupying a full input slot.
	&.inline
		--size var(--tq-icon-size)

	&.inactive
		color var(--tq-color-text-mute)
	&.active
		color var(--tq-color-accent)

	.icon
		display block
		height calc(var(--size) - 2px)
		width calc(var(--size) - 2px)
</style>
