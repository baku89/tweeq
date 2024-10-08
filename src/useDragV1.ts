import {unrefElement} from '@vueuse/core'
import {vec2} from 'linearly'
import {reactive, Ref, ref, toRefs, watch} from 'vue'

interface DragData {
	pos: vec2
	prevPos: vec2
	startPos: vec2
	delta: vec2
	top: number
	right: number
	bottom: number
	left: number
	origin: vec2
	isMousedown: boolean
	isDragging: boolean
}

interface DraggableOptions {
	disableClick?: boolean
	lockPointer?: boolean
	enabled?: Ref<boolean>
	pointerType?: PointerEvent['pointerType'][]
	onClick?: () => void
	onDrag?: (drag: DragData) => void
	onDragStart?: (drag: DragData) => void
	onDragEnd?: (drag?: DragData) => void
}

export default function useDraggable(
	target: Ref<null | HTMLElement>,
	options: DraggableOptions = {}
) {
	const drag = reactive({
		// All coordinates are relative to the viewport
		pos: vec2.zero,
		prevPos: vec2.zero,
		startPos: vec2.zero,
		delta: vec2.zero,

		top: 0,
		right: 0,
		bottom: 0,
		left: 0,

		// Viewport position
		origin: vec2.zero,

		isMousedown: false,
		isDragging: false,
	}) as DragData

	const enabled = options.enabled ?? ref(true)

	function setup(el: HTMLElement) {
		el.addEventListener('pointerdown', onPointerDown)

		function updatePosAndOrigin(e: PointerEvent) {
			if (e.movementX !== undefined) {
				drag.pos = vec2.add(drag.pos, [e.movementX, e.movementY])
			} else {
				drag.pos = [e.clientX, e.clientY]
			}

			const {left, top, right, bottom} = el.getBoundingClientRect()

			drag.origin = vec2.lerp([left, top], [right, bottom], 0.5)

			drag.top = top
			drag.right = right
			drag.bottom = bottom
			drag.left = left
		}

		function onPointerDown(e: PointerEvent) {
			// Ignore non-left click
			if (
				!enabled.value ||
				e.button !== 0 ||
				(options.pointerType && !options.pointerType.includes(e.pointerType))
			) {
				return
			}

			// Initialzize pointer position
			drag.pos = [e.clientX, e.clientY]

			updatePosAndOrigin(e)
			drag.isMousedown = true
			drag.prevPos = drag.startPos = drag.pos

			// Fire onDragstart and onDrag
			if (options.disableClick) {
				startDrag()
				options.onDrag?.(drag)
			}

			window.addEventListener('pointermove', onPointerDrag)
			window.addEventListener('pointerup', onPointerUp, {once: true})
		}

		function startDrag() {
			if (options.lockPointer && 'requestPointerLock' in el) {
				el.requestPointerLock()
			}

			drag.isDragging = true
			options.onDragStart?.(drag)
		}

		function onPointerDrag(e: PointerEvent) {
			updatePosAndOrigin(e)
			drag.delta = vec2.sub(drag.pos, drag.prevPos)

			if (!drag.isDragging) {
				// Determine whether dragging has start
				const d = vec2.dist(drag.startPos, drag.pos)
				if (d <= (navigator.maxTouchPoints > 0 ? 6 : 2)) {
					return
				}
				startDrag()
			}

			options.onDrag?.(drag)
			drag.prevPos = drag.pos
		}

		function onPointerUp() {
			if (options.lockPointer && 'exitPointerLock' in document) {
				document.exitPointerLock()
			}
			if (drag.isDragging) {
				options.onDragEnd?.(drag)
			} else {
				options.onClick?.()
			}

			// Reset
			drag.isMousedown = false
			drag.isDragging = false
			drag.pos = drag.startPos = drag.delta = vec2.zero
			window.removeEventListener('pointermove', onPointerDrag)
		}
	}

	// Hooks
	watch(
		target,
		() => {
			const el = unrefElement(target)
			if (!el) return
			setup(el)
		},
		{immediate: true, flush: 'post'}
	)

	return toRefs(drag)
}
