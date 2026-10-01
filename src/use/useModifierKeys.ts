import {reactive, type Ref, toRefs} from 'vue'

interface ModifierKeys {
	shift: boolean
	alt: boolean
	control: boolean
	meta: boolean
}

type ModifierEvent = KeyboardEvent | MouseEvent

const state = reactive<ModifierKeys>({
	shift: false,
	alt: false,
	control: false,
	meta: false,
})

function sync(e: ModifierEvent) {
	// Assign only on change so idle pointer moves don't trigger anything.
	if (state.shift !== e.shiftKey) state.shift = e.shiftKey
	if (state.alt !== e.altKey) state.alt = e.altKey
	if (state.control !== e.ctrlKey) state.control = e.ctrlKey
	if (state.meta !== e.metaKey) state.meta = e.metaKey
}

function reset() {
	state.shift = state.alt = state.control = state.meta = false
}

let listening = false

function listen() {
	if (listening || typeof window === 'undefined') return
	listening = true
	const options = {capture: true, passive: true}
	for (const type of ['keydown', 'keyup'] as const) {
		window.addEventListener(type, sync, options)
	}
	// Pointer events carry the real modifier state too. Tracking keydown/keyup
	// alone leaves a modifier "held" for good whenever its keyup never reaches
	// the page (a system shortcut such as a screenshot takes the keyboard, a
	// native dialog opens mid-press); the next pointer event puts it right.
	for (const type of ['pointerdown', 'pointermove', 'pointerup'] as const) {
		window.addEventListener(type, sync, options)
	}
	window.addEventListener('blur', reset)
}

/**
 * The modifier keys held right now, shared by every caller. Unlike
 * `useMagicKeys()`, which only follows keydown/keyup, this resyncs from every
 * pointer event, so a missed keyup can't leave a modifier stuck.
 */
export function useModifierKeys(): {
	[K in keyof ModifierKeys]: Readonly<Ref<boolean>>
} {
	listen()
	return toRefs(state)
}
