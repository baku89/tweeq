export interface ShowOptions<T = any> {
	readonly title?: string
	onInput?: (value: T) => void
}
