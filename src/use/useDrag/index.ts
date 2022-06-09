import {unrefElement} from '@vueuse/core'
import {vec2} from 'gl-matrix'
import {reactive, Ref, toRefs, watch} from 'vue'

interface DragState {
	xy: vec2
	previous: vec2
	initial: vec2
	delta: vec2
	dragging: boolean
}

type PointerType = 'mouse' | 'pen' | 'touch'

const defaultHandler = () => null

interface UseDragOptions {
	lockPointer?: boolean
	pointerType?: PointerType[]
	minDragDistance?: number
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
		minDragDistance = navigator.maxTouchPoints > 0 ? 7 : 3,
		dragDelaySeconds = 0.5,
		onClick = defaultHandler,
		onDrag = defaultHandler,
		onDragStart = defaultHandler,
		onDragEnd = defaultHandler,
	}: UseDragOptions = {}
) {
	const state = reactive<DragState>({
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

		function fireDragStart() {
			if (lockPointer && 'requestPointerLock' in el) {
				el.requestPointerLock()
			}

			state.dragging = true
			state.initial = vec2.clone(state.previous)
			onDragStart(state)
		}

		function onPointerDown(e: PointerEvent) {
			if (e.button === 2) return // Ignore right click
			if (!pointerType.includes(e.pointerType as PointerType)) return

			// Initialzize pointer position
			state.xy = vec2.fromValues(e.clientX, e.clientY)
			state.previous = vec2.clone(state.xy)
			state.initial = vec2.clone(state.xy)

			// Fire onDragstart and onDrag immediately
			if (minDragDistance === 0) {
				fireDragStart()
			} else {
				dragDelayTimer = setTimeout(fireDragStart, dragDelaySeconds * 1000)
			}

			window.addEventListener('pointermove', onPointerMove)
			window.addEventListener('pointerup', onPointerUp, {once: true})
		}

		function onPointerMove(e: PointerEvent) {
			if ('movementX' in e) {
				const movement = vec2.fromValues(e.movementX, e.movementY)
				state.xy = vec2.add(vec2.create(), state.xy, movement)
			} else {
				state.xy = vec2.fromValues(e.clientX, e.clientY)
			}

			state.delta = vec2.sub(vec2.create(), state.xy, state.previous)

			if (vec2.squaredLength(state.delta) === 0) return

			if (state.dragging) {
				onDrag(state)
			} else {
				// Determine whether dragging has started
				const d = vec2.dist(state.initial, state.xy)
				if (d >= minDragDistance) {
					fireDragStart()
					clearTimeout(dragDelayTimer)
				}
			}

			state.previous = vec2.clone(state.xy)
		}

		function onPointerUp() {
			if (lockPointer && 'exitPointerLock' in document) {
				document.exitPointerLock()
			}

			if (state.dragging) {
				onDragEnd(state)
			} else {
				onClick()
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
