export interface ShowOptions<T = any> {
	readonly title?: string
	onInput?: (value: T) => void
	/** What the button that confirms says. */
	readonly confirmLabel?: string
	/** Cancelling comes to null, and not to the value it opened with. */
	readonly nullOnCancel?: boolean
}
