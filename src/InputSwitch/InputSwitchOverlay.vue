<script lang="ts" setup>
import {Icon} from '../Icon'

defineProps<{
	modelValue: null | 'toggle' | boolean
}>()
</script>
<template>
	<Transition>
		<div v-if="modelValue !== null" class="overlay">
			<Icon
				class="icon off"
				:class="{active: modelValue === false}"
				icon="ic:baseline-radio-button-unchecked"
			/>
			<Icon
				class="icon on"
				:class="{active: modelValue === true}"
				icon="ic:baseline-check-circle"
			/>
		</div>
	</Transition>
</template>

<style lang="stylus" scoped>
@import '../common.styl'

.overlay
	position absolute
	pointer-events none
	inset 0 calc(var(--tq-input-height) * -1.2)
	active-transition(inset)
	padding calc((var(--tq-input-height) - var(--tq-icon-size)) / 2) 0

	&.v-enter-from,
	&.v-leave-to
		inset 0 calc(var(--tq-input-height) * -1)

.icon
	position absolute
	width var(--tq-icon-size)
	height var(--tq-icon-size)
	color var(--tq-color-border)
	active-transition(color)
	background var(--tq-color-background)
	border-radius 50%

	&.active
		color var(--tq-color-accent)

	&.on
		right 0
</style>
