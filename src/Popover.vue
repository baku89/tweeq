<script lang="ts" setup>
import {
	onClickOutside,
	useElementBounding,
	useElementSize,
	useEventListener,
	useWindowSize,
} from '@vueuse/core'
import {scalar, vec2} from 'linearly'
import {computed, ref, watch} from 'vue'

type PlacementDirection = 'top' | 'right' | 'bottom' | 'left'
type PlacementAlign = 'start' | 'end'
type Placement =
	| vec2
	| PlacementDirection
	| `${PlacementDirection}-${PlacementAlign}`

interface Props {
	reference: HTMLElement | null
	open: boolean
	placement?: Placement
	closeTrigger?: 'onClickOutside' | null
}

const props = withDefaults(defineProps<Props>(), {
	open: false,
	placement: 'bottom-start',
	closeTrigger: 'onClickOutside',
})

const emit = defineEmits<{
	'update:open': [boolean]
}>()

const $reference = computed(() => props.reference)
const $popover = ref<null | HTMLElement>(null)

const refBound = useElementBounding($reference)

let refBoundUpdateTimer: NodeJS.Timeout | null = null
watch(
	() => props.open,
	open => {
		if (open) {
			refBound.update()
			refBoundUpdateTimer = setInterval(refBound.update, 200)
		} else {
			refBoundUpdateTimer && clearInterval(refBoundUpdateTimer)
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

let disposeOnClickOutside: (() => void) | undefined

watch(
	() => props.closeTrigger,
	closeTrigger => {
		disposeOnClickOutside && disposeOnClickOutside()

		if (closeTrigger === 'onClickOutside') {
			disposeOnClickOutside = onClickOutside(
				$popover,
				() => emit('update:open', false),
				{
					ignore: [$reference],
				}
			)
		}
	},
	{immediate: true}
)

useEventListener('keydown', e => {
	if (e.key === 'Escape' && props.open) {
		emit('update:open', false)
	}
})
</script>

<template>
	<teleport to="body">
		<div
			v-if="open"
			ref="$popover"
			class="Popover"
			:style="{left: offset[0] + 'px', top: offset[1] + 'px'}"
		>
			<slot />
		</div>
	</teleport>
</template>

<style lang="stylus" scoped>
.Popover
	overflow visible
	position fixed
	z-index 1100
</style>
