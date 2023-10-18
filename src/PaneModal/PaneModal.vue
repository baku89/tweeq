<script setup lang="ts">
import {ref} from 'vue'

defineSlots<{
	default: void
}>()

const $root = ref<HTMLElement | null>(null)

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
	transform translateY(-0.5rem)
	opacity 0

	&:popover-open
		@starting-style
			&
				transform translateY(-0.5rem)
				opacity 0

			&::backdrop
				backdrop-filter blur(0px)

		opacity 1
		transform translateY(0%)

		&::backdrop
			backdrop-filter blur(4px)
</style>
