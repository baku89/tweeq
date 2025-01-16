import {type MaybeRef, unrefElement} from '@vueuse/core'
import {vec2} from 'linearly'
import {reactive, type Ref, toRefs, unref, watch} from 'vue'

interface DragState {
	xy: vec2
	previous: vec2
	initial: vec2
	delta: vec2
	origin: vec2
	top: number
	right: number
	bottom: number
	left: number
	dragging: boolean
	pointerLocked: boolean
}

type PointerType = 'mouse' | 'pen' | 'touch'

interface UseDragOptions {
	/**
	 * Whether dragging is disabled
	 * @default false
	 */
	disabled?: MaybeRef<boolean>

	/**
	 * Whether to lock the pointer when dragging
	 * @default false
	 */
	lockPointer?: MaybeRef<boolean>

	/**
	 * Which pointer types can start dragging
	 * @default ['mouse', 'pen', 'touch']
	 */
	pointerType?: PointerType[]

	/**
	 * The continuous press time until it is regarded as dragging
	 * Set to 0 to start dragging immediately
	 * @default 0.5
	 */
	dragDelaySeconds?: number

	/**
	 * Whether to disable click event and start dragging immediately
	 * @default false
	 */
	disableClick?: boolean

	onClick?: () => void
	onDrag?: (state: DragState, event: PointerEvent) => void
	onDragStart?: (state: DragState, event: PointerEvent) => void
	onDragEnd?: (state: DragState, event: PointerEvent) => void
}

export function useDrag(
	target: Ref<null | HTMLElement>,
	{
		disabled,
		lockPointer = false,
		pointerType = ['mouse', 'pen', 'touch'],
		dragDelaySeconds = 0.5,
		disableClick = false,
		onClick,
		onDrag,
		onDragStart,
		onDragEnd,
	}: UseDragOptions = {}
) {
	const state = reactive<DragState>({
		// All coordinates are relative to the viewport
		xy: vec2.zero,
		previous: vec2.zero,
		initial: vec2.zero,
		delta: vec2.zero,
		origin: vec2.zero,
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		dragging: false,
		pointerLocked: false,
	})

	let dragDelayTimer: ReturnType<typeof setTimeout> | undefined

	function setup(el: HTMLElement) {
		el.addEventListener('pointerdown', onPointerDown)

		function updateBounds(event: PointerEvent) {
			if (event.movementX !== undefined && event.movementY !== undefined) {
				state.xy = vec2.add(state.xy, [event.movementX, event.movementY])
			} else {
				state.xy = [event.clientX, event.clientY]
			}

			// Update bounds for V1 compatibility
			const rect = el.getBoundingClientRect()
			state.top = rect.top
			state.right = rect.right
			state.bottom = rect.bottom
			state.left = rect.left
			state.origin = vec2.lerp(
				[rect.left, rect.top],
				[rect.right, rect.bottom],
				0.5
			)
		}

		function fireDragStart(event: PointerEvent) {
			if (unref(lockPointer) && 'requestPointerLock' in el) {
				el.requestPointerLock()
				state.pointerLocked = true
			}

			state.dragging = true
			state.initial = state.previous
			onDragStart?.(state, event)

			// For V1 compatibility, call onDrag immediately if disableClick is true
			if (disableClick) {
				onDrag?.(state, event)
			}
		}

		function onPointerDown(event: PointerEvent) {
			if (unref(disabled)) return
			if (event.button !== 0) return // Ignore non-left click
			if (!event.isPrimary) return
			if (!pointerType.includes(event.pointerType as PointerType)) return

			// Initialize pointer position
			state.xy = state.previous = state.initial = [event.clientX, event.clientY]
			updateBounds(event)

			// Start drag immediately if disableClick is true or dragDelaySeconds is 0
			if (disableClick || dragDelaySeconds <= 0) {
				fireDragStart(event)
			} else {
				dragDelayTimer = setTimeout(
					() => fireDragStart(event),
					dragDelaySeconds * 1000
				)
			}

			el.setPointerCapture(event.pointerId)
			window.addEventListener('pointermove', onPointerMove)
			window.addEventListener('pointerup', onPointerUp)
		}

		function onPointerMove(event: PointerEvent) {
			if (unref(disabled)) return
			if (!event.isPrimary) return

			updateBounds(event)
			state.delta = vec2.sub(state.xy, state.previous)

			if (vec2.squaredLength(state.delta) === 0) return

			if (state.dragging) {
				onDrag?.(state, event)
			} else if (!disableClick) {
				// Determine whether dragging has started
				const d = vec2.dist(state.initial, state.xy)
				const minDragDistance = event.pointerType === 'mouse' ? 3 : 7
				if (d >= minDragDistance) {
					clearTimeout(dragDelayTimer)
					fireDragStart(event)
				}
			}

			state.previous = vec2.clone(state.xy)
		}

		function onPointerUp(event: PointerEvent) {
			if (unref(disabled)) return
			if (!event.isPrimary) return

			if (unref(lockPointer) && 'exitPointerLock' in document) {
				document.exitPointerLock()
			}
			state.pointerLocked = false

			if (state.dragging) {
				onDragEnd?.(state, event)
			} else {
				onClick?.()
			}

			// Reset
			clearTimeout(dragDelayTimer)
			state.dragging = false
			state.xy = state.initial = state.delta = vec2.zero
			window.removeEventListener('pointermove', onPointerMove)
			window.removeEventListener('pointerup', onPointerUp)
		}
	}

	// Hooks
	watch(
		target,
		() => {
			const el = unrefElement(target)
			if (el) setup(el)
		},
		{immediate: true, flush: 'post'}
	)

	return toRefs(state)
}
