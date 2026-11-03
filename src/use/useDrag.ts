import {
	type MaybeRef,
	unrefElement,
	useElementBounding,
	useEventListener,
	usePointerLock,
} from '@vueuse/core'
import {vec2} from 'linearly'
import {
	Component,
	computed,
	reactive,
	type Ref,
	toRefs,
	unref,
	watchEffect,
} from 'vue'

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
	 * Per-pointerdown gate. When it returns false the press is ignored entirely
	 * (no capture, no click, no drag), so the event falls through to whatever is
	 * underneath — e.g. a focused <input> placing its text caret. Use it to make
	 * only certain regions of the target draggable.
	 * @default () => true
	 */
	shouldDrag?: (event: PointerEvent) => boolean

	onClick?: (state: DragState, event: PointerEvent) => void
	onDrag?: (state: DragState, event: PointerEvent) => void
	onDragStart?: (state: DragState, event: PointerEvent) => void
	onDragEnd?: (state: DragState, event: PointerEvent) => void
}

export function useDrag(
	target: Ref<HTMLElement | SVGElement | Component | null>,
	{
		disabled,
		lockPointer = false,
		pointerType = ['mouse', 'pen', 'touch'],
		dragDelaySeconds = 0.5,
		shouldDrag,
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

	const targetEl = computed<HTMLElement | SVGElement | null>(
		() => unrefElement(target.value) ?? null
	)

	const bound = useElementBounding(targetEl)

	const {lock, unlock} = usePointerLock(targetEl as any)

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

	useEventListener(targetEl, 'pointerdown', onPointerDown)
	useEventListener(targetEl, 'pointermove', onPointerMove)
	useEventListener(targetEl, 'pointerup', onPointerUp)
	useEventListener(targetEl, 'pointercancel', onPointerUp)
	useEventListener(targetEl, 'pointerleave', onPointerUp)

	// A lock granted after the drag already ended (the grant is async; a quick
	// flick can release before it lands) must not outlive the drag.
	useEventListener(document, 'pointerlockchange', () => {
		if (
			!pointerdown &&
			document.pointerLockElement &&
			document.pointerLockElement === targetEl.value
		) {
			document.exitPointerLock()
		}
	})

	function fireDragStart(event: PointerEvent) {
		if (
			unref(lockPointer) &&
			target.value &&
			targetEl.value &&
			'requestPointerLock' in targetEl.value
		) {
			// The grant is asynchronous; a rejection (headless, no focus, a lock exited
			// by Esc moments ago) is not an error for the drag itself.
			lock(event).catch(() => {})
			state.pointerLocked = true
		}

		state.dragging = true
		state.initial = state.previous
		onDragStart?.(state, event)
	}

	function onPointerDown(event: PointerEvent) {
		// Ignore when disabled
		if (unref(disabled)) return
		// Ignore non-left click
		if (event.button !== 0 || !event.isPrimary) return
		// Ignore non-pointer type
		if (!pointerType.includes(event.pointerType as PointerType)) return
		// Let the press fall through when the region opts out (e.g. a focused
		// input's text area, so the click lands a caret instead of dragging)
		if (shouldDrag && !shouldDrag(event)) return

		pointerdown = true

		// Initialize pointer position
		state.xy = state.previous = state.initial = [event.clientX, event.clientY]
		bound.update()

		if (dragDelaySeconds === 0) {
			// Start drag immediately
			fireDragStart(event)
		} else {
			dragDelayTimer = setTimeout(
				() => fireDragStart(event),
				dragDelaySeconds * 1000
			)
		}

		// Capture on the (stable) target element, not event.target: a pressed child
		// can re-render or unmount mid-drag (e.g. a grab zone that only exists while
		// the value is at an edge), which would implicitly release capture and let
		// the drag break the moment the pointer leaves the element's box.
		targetEl.value?.setPointerCapture(event.pointerId)
	}

	function onPointerMove(event: PointerEvent) {
		if (!pointerdown) return

		if (event.movementX !== undefined && event.movementY !== undefined) {
			// movement properties ignores the zoom level of browser,
			// so we need to scale it by the zoom
			const zoomLevel = window.outerWidth / window.innerWidth
			const movement = vec2.scale(
				[event.movementX, event.movementY],
				1 / zoomLevel
			)

			state.xy = vec2.add(state.xy, movement)
		} else {
			state.xy = [event.clientX, event.clientY]
		}

		state.delta = vec2.sub(state.xy, state.previous)
		bound.update()

		if (vec2.squaredLength(state.delta) === 0) return

		if (!state.dragging) {
			// Determine whether dragging has started. The mouse threshold is a few
			// px, not 1: a 1px threshold reads the incidental jitter of an ordinary
			// click as a drag, which both nudges the value and (for lockPointer
			// inputs like InputColor) flashes pointer lock. tweak and pointer lock
			// both begin here, at this one threshold.
			const d = vec2.dist(state.initial, state.xy)
			const minDragDistance = event.pointerType === 'mouse' ? 3 : 5
			if (d >= minDragDistance) {
				clearTimeout(dragDelayTimer)
				fireDragStart(event)
			}
		}

		if (state.dragging) {
			onDrag?.(state, event)
		}

		state.previous = state.xy
	}

	function onPointerUp(event: PointerEvent) {
		if (state.pointerLocked) {
			// usePointerLock's unlock() is a no-op until it has *seen* the lock get
			// granted; a release that lands before the grant would leave the lock
			// on (hidden cursor, every click swallowed). Exit directly as well, and
			// the pointerlockchange guard below catches a grant that lands later.
			unlock().catch(() => {})
			if (document.pointerLockElement) document.exitPointerLock()
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
		targetEl.value?.releasePointerCapture(event.pointerId)
	}

	return toRefs(state)
}
