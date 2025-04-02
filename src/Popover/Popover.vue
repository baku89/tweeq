<script lang="ts" setup>
import {useEventListener} from '@vueuse/core'
import {computed, toRef, useTemplateRef, watch} from 'vue'
import {flip, shift, useFloating, autoUpdate, offset} from '@floating-ui/vue'

import type {PopoverProps} from './types'

const props = withDefaults(defineProps<PopoverProps>(), {
	open: false,
	placement: 'bottom-start',
	lightDismiss: true,
	offset: 0,
})

const emit = defineEmits<{
	'update:open': [boolean]
	close: []
}>()

const $popover = useTemplateRef('$popover')

useEventListener('keydown', e => {
	if (e.key === 'Escape' && props.open) {
		emit('close')
		emit('update:open', false)
	}
})

useEventListener($popover, 'toggle', e => {
	const {newState} = e as ToggleEvent
	if (newState === 'close') {
		emit('close')
	}
	emit('update:open', newState === 'open')
})

watch(
	() => [props.open, $popover.value] as const,
	([open, $popover]) => {
		if (!$popover) return

		$popover.togglePopover(open)
	}
)

const {floatingStyles} = useFloating(toRef(props, 'reference'), $popover, {
	placement: typeof props.placement === 'string' ? props.placement : undefined,
	strategy: 'fixed',
	whileElementsMounted: autoUpdate,
	middleware: [flip(), shift(), offset(props.offset)],
})

const styles = computed(() => {
	if (typeof props.placement === 'string') {
		return floatingStyles.value
	}

	return {left: props.placement[0] + 'px', top: props.placement[1] + 'px'}
})
</script>

<template>
	<div
		v-if="open"
		ref="$popover"
		class="Popover"
		:style="styles"
		:popover="lightDismiss ? 'auto' : 'manual'"
	>
		<slot />
	</div>
</template>

<style lang="stylus" scoped>
.Popover
	background transparent
	overflow visible
</style>
