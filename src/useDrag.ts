import {MaybeRef, unrefElement} from '@vueuse/core'
import {vec2} from 'linearly'
import {reactive, Ref, ref, toRefs, unref, watch} from 'vue'

interface DragState {
	xy: vec2
	previous: vec2
	initial: vec2
	delta: vec2
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
	 * @default 0.5
	 */
	dragDelaySeconds?: number

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
		onClick,
		onDrag,
		onDragStart,
		onDragEnd,
	}: UseDragOptions = {}
) {
	const lockPointerRef =
		typeof lockPointer === 'boolean' ? ref(lockPointer) : lockPointer

	const state = reactive<Omit<DragState, 'event'>>({
		// All coordinates are relative to the viewport
		xy: vec2.zero,
		previous: vec2.zero,
		initial: vec2.zero,
		delta: vec2.zero,

		dragging: false,
		pointerLocked: false,
	})

	let dragDelayTimer = -1

	function setup(el: HTMLElement) {
		el.addEventListener('pointerdown', onPointerDown)

		function fireDragStart(event: PointerEvent) {
			if (lockPointerRef.value && 'requestPointerLock' in el) {
				el.requestPointerLock()
				state.pointerLocked = true
			} else {
				state.pointerLocked = false
			}

			state.dragging = true
			state.initial = state.previous
			onDragStart?.(state, event)
		}

		function onPointerDown(event: PointerEvent) {
			if (unref(disabled)) return
			if (event.button === 2) return // Ignore right click
			if (!event.isPrimary) return
			if (!pointerType.includes(event.pointerType as PointerType)) return

			// Initialzize pointer position
			state.xy = state.previous = state.initial = [event.clientX, event.clientY]

			if (dragDelaySeconds <= 0) {
				fireDragStart(event)
			} else {
				dragDelayTimer = setTimeout(fireDragStart, dragDelaySeconds * 1000)
			}

			el.setPointerCapture(event.pointerId)

			window.addEventListener('pointermove', onPointerMove)
			window.addEventListener('pointerup', onPointerUp)
		}

		function onPointerMove(event: PointerEvent) {
			if (unref(disabled)) return
			if (!event.isPrimary) return

			if (event.movementX !== undefined && event.movementY !== undefined) {
				state.xy = vec2.add(state.xy, [event.movementX, event.movementY])
			} else {
				state.xy = [event.clientX, event.clientY]
			}

			state.delta = vec2.sub(state.xy, state.previous)

			if (vec2.squaredLength(state.delta) === 0) return

			if (state.dragging) {
				onDrag?.(state, event)
			} else {
				// Determine whether dragging has started
				const d = vec2.dist(state.initial, state.xy)
				const minDragDistance = event.pointerType === 'mouse' ? 3 : 7
				if (d >= minDragDistance) {
					fireDragStart(event)
					clearTimeout(dragDelayTimer)
				}
			}

			state.previous = vec2.clone(state.xy)
		}

		function onPointerUp(event: PointerEvent) {
			if (unref(disabled)) return
			if (!event.isPrimary) return

			if (lockPointerRef.value && 'exitPointerLock' in document) {
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
