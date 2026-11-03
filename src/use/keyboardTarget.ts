/**
 * The EventTarget every Bndr keyboard in Tweeq listens to instead of `window`.
 *
 * Bndr keeps a set of the keys it saw go down and matches a hotkey against the
 * WHOLE set, so one lost keyup — the key that opened a native alert / confirm
 * / prompt (no keyup reaches the page while it is up), a keyup that landed in
 * an <input> focused by the keydown (Bndr ignores events from inputs), the
 * window losing focus mid-press — leaves a key "held" forever: no hotkey
 * matches any more, and e.g. Cmd+P falls through to the browser's print
 * dialog (seen in koma 2026-10-27). This target forwards window's key events
 * and repairs the set:
 *  - keyups are forwarded even from inputs (typing never triggers a hotkey,
 *    but a release is always delivered),
 *  - a modifier the event says is not held is released first,
 *  - a key with no keydown (auto-repeat) for STUCK_MS when another key goes
 *    down is released — a key really held repeats every few ms,
 *  - window blur / hidden / focus release everything,
 *  - so does a native alert / confirm / prompt when it returns (the usual way
 *    a keyup is lost: the hotkey itself opened the dialog).
 */

/** Longer than any OS "delay until repeat" (macOS max is ~2 s). */
const STUCK_MS = 2500

const MODIFIER_FLAG: Record<string, 'shiftKey' | 'altKey' | 'ctrlKey' | 'metaKey'> = {
	ShiftLeft: 'shiftKey',
	ShiftRight: 'shiftKey',
	AltLeft: 'altKey',
	AltRight: 'altKey',
	ControlLeft: 'ctrlKey',
	ControlRight: 'ctrlKey',
	MetaLeft: 'metaKey',
	MetaRight: 'metaKey',
}

function isEditable(t: EventTarget | null): boolean {
	if (!(t instanceof HTMLElement)) return false
	return (
		t instanceof HTMLInputElement ||
		t instanceof HTMLTextAreaElement ||
		t instanceof HTMLSelectElement ||
		t.isContentEditable
	)
}

let target: EventTarget | null = null

/**
 * Typed as an HTMLElement only because that is what `Bndr.keyboard()` accepts;
 * Bndr uses nothing of it but add / removeEventListener.
 */
export function keyboardTarget(): HTMLElement {
	return keyboardEventTarget() as unknown as HTMLElement
}

function keyboardEventTarget(): EventTarget {
	if (target) return target
	target = new EventTarget()
	if (typeof window === 'undefined') return target

	const t = target
	/** Keys Bndr has been told are down, by `code`, with the last keydown time. */
	const down = new Map<string, {key: string; at: number}>()

	function forward(e: KeyboardEvent, type = e.type) {
		const clone = new KeyboardEvent(type, {
			code: e.code,
			key: e.key,
			repeat: type === 'keydown' && e.repeat,
			shiftKey: e.shiftKey,
			altKey: e.altKey,
			ctrlKey: e.ctrlKey,
			metaKey: e.metaKey,
		})
		// Cancelling the clone must cancel the real event.
		Object.defineProperty(clone, 'preventDefault', {value: () => e.preventDefault()})
		Object.defineProperty(clone, 'stopPropagation', {value: () => e.stopPropagation()})
		t.dispatchEvent(clone)
	}

	function release(code: string) {
		const entry = down.get(code)
		if (!entry) return
		down.delete(code)
		t.dispatchEvent(new KeyboardEvent('keyup', {code, key: entry.key}))
	}

	function releaseAll() {
		for (const code of [...down.keys()]) release(code)
	}

	/** Modifiers the event says are up, and keys that stopped repeating long ago. */
	function repair(e: KeyboardEvent | MouseEvent, now: number, except?: string) {
		for (const [code, flag] of Object.entries(MODIFIER_FLAG)) {
			if (code !== except && down.has(code) && !e[flag]) release(code)
		}
		for (const [code, entry] of down) {
			if (code !== except && !(code in MODIFIER_FLAG) && now - entry.at > STUCK_MS) release(code)
		}
	}

	window.addEventListener('keydown', e => {
		const now = performance.now()
		repair(e, now, e.code)
		if (isEditable(e.target)) return // typing: not a hotkey, and not tracked
		const entry = down.get(e.code)
		if (entry) entry.at = now
		else down.set(e.code, {key: e.key, at: now})
		forward(e)
	})
	window.addEventListener('keyup', e => {
		repair(e, performance.now(), e.code)
		down.delete(e.code)
		forward(e) // even from an input: the release must always arrive
	})
	// A click tells the modifier state too (Bndr itself does this on pointermove
	// for command only).
	window.addEventListener('pointerdown', e => repair(e, performance.now()), {capture: true})
	window.addEventListener('blur', releaseAll)
	window.addEventListener('focus', releaseAll)
	document.addEventListener('visibilitychange', () => {
		if (document.hidden) releaseAll()
	})
	// While a native dialog is up the page gets no key events at all, so the
	// key that opened it never comes up. Release everything when it returns.
	for (const name of ['alert', 'confirm', 'prompt'] as const) {
		const native = window[name] as (...args: unknown[]) => unknown
		;(window as unknown as Record<string, unknown>)[name] = function (this: unknown, ...args: unknown[]) {
			try {
				return native.apply(window, args)
			} finally {
				releaseAll()
			}
		}
	}
	return target
}
