import {
	type MaybeRef,
	useElementBounding,
	useEventListener,
	usePointerLock,
} from '@vueuse/core'
import {vec2} from 'linearly'
import {reactive, type Ref, toRefs, unref, watchEffect} from 'vue'

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
	width: number
	height: number
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

	onClick?: (state: DragState, event: PointerEvent) => void
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
		width: 0,
		height: 0,
		dragging: false,
		pointerLocked: false,
	})

	let dragDelayTimer: ReturnType<typeof setTimeout> | undefined
	let pointerdown = false

	const bound = useElementBounding(target)

	const {lock, unlock} = usePointerLock(target)

	watchEffect(
		() => {
			state.top = unref(bound.top)
			state.left = unref(bound.left)
			state.bottom = unref(bound.bottom)
			state.right = unref(bound.right)
			state.width = unref(bound.width)
			state.height = unref(bound.height)
			state.width = unref(bound.width)
			state.height = unref(bound.height)
		},
		{flush: 'sync'}
	)

	watchEffect(() => {
		state.origin = vec2.lerp(
			[state.left, state.top],
			[state.right, state.bottom],
			0.5
		)
	})

	useEventListener(target, 'pointerdown', onPointerDown)
	useEventListener(target, 'pointermove', onPointerMove)
	useEventListener(target, 'pointerup', onPointerUp)
	useEventListener(target, 'pointercancel', onPointerUp)
	useEventListener(target, 'pointerleave', onPointerUp)

	function fireDragStart(event: PointerEvent) {
		if (
			unref(lockPointer) &&
			target.value &&
			'requestPointerLock' in target.value
		) {
			lock(event)
			state.pointerLocked = true
		}

		state.dragging = true
		state.initial = state.previous
		onDragStart?.(state, event)

		if (disableClick) {
			onDrag?.(state, event)
		}
	}

	function onPointerDown(event: PointerEvent) {
		// Ignore when disabled
		if (unref(disabled)) return
		// Ignore non-left click
		if (event.button !== 0 || !event.isPrimary) return
		// Ignore non-pointer type
		if (!pointerType.includes(event.pointerType as PointerType)) return

		pointerdown = true

		// Initialize pointer position
		state.xy = state.previous = state.initial = [event.clientX, event.clientY]
		bound.update()

		// Start drag immediately if disableClick is true or dragDelaySeconds is 0
		if (disableClick || dragDelaySeconds <= 0) {
			fireDragStart(event)
		} else {
			dragDelayTimer = setTimeout(
				() => fireDragStart(event),
				dragDelaySeconds * 1000
			)
		}

		target.value?.setPointerCapture(event.pointerId)
	}

	function onPointerMove(event: PointerEvent) {
		if (!pointerdown) return

		if (event.movementX !== undefined && event.movementY !== undefined) {
			state.xy = vec2.add(state.xy, [event.movementX, event.movementY])
		} else {
			state.xy = [event.clientX, event.clientY]
		}

		state.delta = vec2.sub(state.xy, state.previous)
		bound.update()

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

		state.previous = state.xy
	}

	function onPointerUp(event: PointerEvent) {
		if (state.pointerLocked) {
			unlock()
		}
		state.pointerLocked = false

		if (pointerdown) {
			if (state.dragging) {
				onDragEnd?.(state, event)
			} else {
				onClick?.(state, event)
			}
		}

		// Reset
		clearTimeout(dragDelayTimer)
		pointerdown = false
		state.dragging = false
		state.xy = state.initial = state.delta = vec2.zero
		target.value?.releasePointerCapture(event.pointerId)
	}

	return toRefs(state)
}
