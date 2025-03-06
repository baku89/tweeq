<script lang="ts" setup>
import {
	useElementBounding,
	useElementSize,
	useEventListener,
	useWindowSize,
} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {computed, shallowRef, watch} from 'vue'

import type {Placement, PopoverProps} from './types'

const props = withDefaults(defineProps<PopoverProps>(), {
	open: false,
	placement: 'bottom-start',
	lightDismiss: true,
})

const emit = defineEmits<{
	'update:open': [boolean]
	close: []
}>()

const $reference = computed(() => props.reference)
const $popover = shallowRef<null | HTMLElement>(null)

const refBound = useElementBounding($reference)

let refBoundUpdateTimer: ReturnType<typeof setTimeout> | null = null
watch(
	() => props.open,
	open => {
		if (open) {
			refBound.update()
			refBoundUpdateTimer = setInterval(refBound.update, 200)
		} else {
			if (refBoundUpdateTimer) clearInterval(refBoundUpdateTimer)
		}
	}
)

const popoverSize = useElementSize($popover)
const windowSize = useWindowSize()

const offset = computed<vec2>(() => {
	if (!$reference.value) throw new Error('Cannot align the popover')

	if (!$popover.value) return [0, 0]

	if (typeof props.placement === 'object') return props.placement

	let placement = props.placement
	let x = 0
	let y = 0

	const ww = windowSize.width.value
	const wh = windowSize.height.value

	const rLeft = refBound.left.value
	const rRight = refBound.right.value
	const rTop = refBound.top.value
	const rBottom = refBound.bottom.value
	const rWidth = refBound.width.value
	const rHeight = refBound.height.value

	const pWidth = popoverSize.width.value
	const pHeight = popoverSize.height.value

	// Flip detection
	if (placement.startsWith('left')) {
		if (rLeft < pHeight && ww - rRight > pWidth) {
			placement = placement.replace('left', 'right') as Exclude<Placement, vec2>
		}
	} else if (placement.startsWith('right')) {
		if (ww - rRight < pHeight && rLeft > pWidth) {
			placement = placement.replace('right', 'left') as Exclude<Placement, vec2>
		}
	}

	if (placement.startsWith('top')) {
		if (rTop < pHeight && wh - rBottom > pHeight) {
			placement = placement.replace('top', 'bottom') as Exclude<Placement, vec2>
		}
	} else if (placement.startsWith('bottom')) {
		if (wh - rBottom < pHeight && rTop > pHeight) {
			placement = placement.replace('bottom', 'top') as Exclude<Placement, vec2>
		}
	}

	// X
	if (placement.startsWith('left')) {
		x = rLeft - pWidth
	} else if (placement.startsWith('right')) {
		x = rRight
	} else if (/^(top|bottom)-start$/.test(placement)) {
		x = rLeft
	} else if (/^(top|bottom)$/.test(placement)) {
		x = rLeft - (pWidth - rWidth) / 2
	} else if (/^(top|bottom)-end$/.test(placement)) {
		x = rLeft - (rWidth - rWidth)
	}
	x = scalar.clamp(x, 0, ww - pWidth)

	// Y
	if (placement.startsWith('top')) {
		y = rTop - pHeight
	} else if (placement.startsWith('bottom')) {
		y = rBottom
	} else if (/^(left|right)-start$/.test(placement)) {
		y = rTop
	} else if (/^(left|right)$/.test(placement)) {
		y = rTop - (pHeight - rHeight) / 2
	} else if (/^(left|right)-end$/.test(placement)) {
		y = rTop - (rHeight - rHeight)
	}
	y = scalar.clamp(y, 0, wh - pHeight)

	return [x, y]
})

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
</script>

<template>
	<div
		v-if="open"
		ref="$popover"
		class="Popover"
		:style="{left: offset[0] + 'px', top: offset[1] + 'px'}"
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
