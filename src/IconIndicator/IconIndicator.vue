<script lang="ts" setup>
import {Icon} from '@iconify/vue'

interface Props {
	active?: boolean
	icon: string
}

defineProps<Props>()

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
	color var(--tq-color-on-background)

	&.inactive
		color var(--tq-color-gray-on-background)
	&.active
		color var(--tq-color-accent)

	.icon
		display block
</style>
