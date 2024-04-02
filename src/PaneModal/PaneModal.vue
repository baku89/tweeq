<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {ref} from 'vue'

defineSlots<{
	default: void
}>()

const emit = defineEmits<{
	close: []
}>()

const $root = ref<HTMLElement | null>(null)

useEventListener($root, 'toggle', (e: ToggleEvent) => {
	if (e.newState !== 'open') {
		emit('close')
	}
})

defineExpose({
	toggleShow: (force?: boolean) => {
		$root.value?.togglePopover(force)
	},
})
</script>

<template>
	<div ref="$root" class="PaneModal" popover>
		<slot />
	</div>
</template>

<style scoped lang="stylus">
@import '../common.styl'

.PaneModal
	popup-style()
	position fixed
	inset 0
	margin auto
	padding var(--tq-pane-padding)
	transition opacity var(--tq-hover-transition-duration), transform var(--tq-hover-transition-duration), display var(--tq-hover-transition-duration)
	transition-behavior allow-discrete
	transform translateY(calc(var(--tq-rem) / -2))
	opacity 0

	&:popover-open
		@starting-style
			&
				transform translateY(calc(var(--tq-rem) / -2))
				opacity 0

			&::backdrop
				backdrop-filter blur(0px)

		opacity 1
		transform translateY(0%)

		&::backdrop
			backdrop-filter blur(4px)
</style>
