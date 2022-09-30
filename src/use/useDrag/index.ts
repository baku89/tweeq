import {unrefElement} from '@vueuse/core'
import {vec2} from 'gl-matrix'
import {reactive, Ref, toRefs, watch} from 'vue'

interface DragState {
	xy: vec2
	previous: vec2
	initial: vec2
	delta: vec2
	dragging: boolean
	event: PointerEvent
}

type PointerType = 'mouse' | 'pen' | 'touch'

interface UseDragOptions {
	lockPointer?: boolean
	pointerType?: PointerType[]
	dragDelaySeconds?: number

	onClick?: () => void
	onDrag?: (state: DragState) => void
	onDragStart?: (state: DragState) => void
	onDragEnd?: (state: DragState) => void
}

export function useDrag(
	target: Ref<null | HTMLElement>,
	{
		lockPointer = false,
		pointerType = ['mouse', 'pen', 'touch'],
		dragDelaySeconds = 0.5,
		onClick,
		onDrag,
		onDragStart,
		onDragEnd,
	}: UseDragOptions = {}
) {
	const state = reactive<Omit<DragState, 'event'>>({
		// All coordinates are relative to the viewport
		xy: vec2.create(),
		previous: vec2.create(),
		initial: vec2.create(),
		delta: vec2.create(),

		dragging: false,
	})

	let dragDelayTimer = -1

	function setup(el: HTMLElement) {
		el.addEventListener('pointerdown', onPointerDown)

		function fireDragStart(event: PointerEvent) {
			if (lockPointer && 'requestPointerLock' in el) {
				el.requestPointerLock()
			}

			state.dragging = true
			state.initial = vec2.clone(state.previous)
			onDragStart?.({...state, event})
		}

		function onPointerDown(event: PointerEvent) {
			if (event.button === 2) return // Ignore right click
			if (!event.isPrimary) return
			if (!pointerType.includes(event.pointerType as PointerType)) return

			// Initialzize pointer position
			state.xy = vec2.fromValues(event.clientX, event.clientY)
			state.previous = vec2.clone(state.xy)
			state.initial = vec2.clone(state.xy)

			dragDelayTimer = setTimeout(fireDragStart, dragDelaySeconds * 1000)

			window.addEventListener('pointermove', onPointerMove)
			window.addEventListener('pointerup', onPointerUp, {once: true})
		}

		function onPointerMove(event: PointerEvent) {
			if (!event.isPrimary) return

			if ('movementX' in event) {
				const movement = vec2.fromValues(event.movementX, event.movementY)
				state.xy = vec2.add(vec2.create(), state.xy, movement)
			} else {
				state.xy = vec2.fromValues(event.clientX, event.clientY)
			}

			state.delta = vec2.sub(vec2.create(), state.xy, state.previous)

			if (vec2.squaredLength(state.delta) === 0) return

			if (state.dragging) {
				onDrag?.({...state, event})
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
			if (lockPointer && 'exitPointerLock' in document) {
				document.exitPointerLock()
			}

			if (state.dragging) {
				onDragEnd?.({...state, event})
			} else {
				onClick?.()
			}

			// Reset
			clearTimeout(dragDelayTimer)
			state.dragging = false
			state.xy = vec2.create()
			state.initial = vec2.create()
			state.delta = vec2.create()
			window.removeEventListener('pointermove', onPointerMove)
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
