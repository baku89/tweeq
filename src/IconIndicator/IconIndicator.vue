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
		:class="{active: active, inactive: active === false}"
		@click="$emit('update:active', !active)"
	>
		<Icon v-if="icon" class="icon" :icon="icon" />
	</div>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.IconIndicator
	height var(--tq-input-height)
	width var(--tq-input-height)
	display flex
	align-items center
	justify-content center
	hover-transition(color)
	border-radius 9999px
	color var(--tq-color-text)

	&.inactive
		color var(--tq-color-text-mute)
	&.active
		color var(--tq-color-accent)

	.icon
		display block
		height calc(var(--tq-input-height) - 2px)
		width calc(var(--tq-input-height) - 2px)
</style>
