<script setup lang="ts">
import {useEventListener} from '@vueuse/core'
import {useTemplateRef, watchEffect} from 'vue'

defineSlots<{
	default: void
}>()

const props = withDefaults(
	defineProps<{
		open: boolean
	}>(),
	{
		open: false,
	}
)

const emit = defineEmits<{
	close: []
	'update:open': [boolean]
}>()

const $root = useTemplateRef('$root')

useEventListener($root, 'toggle', (e: ToggleEvent) => {
	if (e.newState !== 'open') {
		close()
	}
})

useEventListener('keydown', e => {
	if (e.key === 'Escape' && props.open) {
		close()
	}
})

function close() {
	emit('update:open', false)
	emit('close')
}

watchEffect(() => {
	$root.value?.togglePopover(props.open)
})
</script>

<template>
	<div ref="$root" class="TqPaneModal" popover="auto">
		<slot />
	</div>
</template>

<style scoped lang="stylus">
@import '../common.styl'

.TqPaneModal
	popup-style()
	inset 0
	margin auto
	padding var(--tq-pane-padding)
	transition opacity var(-tq-transition-duration), transform var(-tq-transition-duration), overlay var(-tq-transition-duration) allow-discrete, display var(-tq-transition-duration) allow-discrete
	opacity 0
	transform translateY(calc(var(--tq-rem) / -2))

	&[popover]::backdrop
		backdrop-filter blur(0px)
		transition backdrop-filter var(-tq-transition-duration)

	&:popover-open
		opacity 1
		transform translateY(0)

		&::backdrop
			backdrop-filter blur(4px)

		@starting-style
			&
				transform translateY(calc(var(--tq-rem) / -2))
				opacity 0

			&::backdrop
				backdrop-filter blur(0px)
</style>
