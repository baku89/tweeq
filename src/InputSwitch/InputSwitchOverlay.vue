<script lang="ts" setup>
import {Icon} from '@iconify/vue'

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

	&.v-enter-from,
	&.v-leave-to
		inset 0 calc(var(--tq-input-height) * -1)

.icon
	position absolute
	width var(--tq-input-height)
	height var(--tq-input-height)
	color var(--tq-color-border)
	active-transition(color)

	&.active
		color var(--tq-color-accent)

	&.on
		right 0
</style>
