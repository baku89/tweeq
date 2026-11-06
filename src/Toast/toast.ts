import {defineStore} from 'pinia'
import {shallowRef} from 'vue'

/** Something to do about what a toast says, as a button on it. Doing it dismisses the toast. */
export interface ToastAction {
	label: string
	tooltip?: string
	perform: () => void
}

export interface ToastOptions {
	message: string
	icon?: string
	/** How it is to be taken: `warning` colors its icon, for something that went other than asked. */
	tone?: 'info' | 'warning'
	actions?: ToastAction[]
	/**
	 * How long it stays, in milliseconds, unless the pointer is over it. 0 has it stay until it
	 * is dismissed.
	 */
	duration?: number
}

export interface Toast extends ToastOptions {
	readonly id: number
}

/** Long enough to be read, and not so long that it is in the way of what comes next. */
export const TOAST_DURATION = 6000
/** As many as are shown at once; the oldest goes for a newer one. */
const MAX_TOASTS = 3

let nextId = 0

/**
 * Light, dismissable notices, out of the way at the top of the app, that go by themselves.
 * ToastRoot shows them, and TweeqProvider has it, as App and Viewport do.
 */
export const useToastStore = defineStore('toast', () => {
	const toasts = shallowRef<readonly Toast[]>([])

	/** Show `options`, and say which one it is, for it to be dismissed by that. */
	function show(options: ToastOptions): number {
		const toast: Toast = {...options, id: nextId++}
		toasts.value = [...toasts.value, toast].slice(-MAX_TOASTS)
		return toast.id
	}

	/** Take away the toast `id`, or all of them. */
	function dismiss(id?: number) {
		toasts.value =
			id === undefined ? [] : toasts.value.filter(toast => toast.id !== id)
	}

	return {toasts, show, dismiss}
})
