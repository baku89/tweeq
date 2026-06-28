export interface InputShuffleProps<T> {
	/**
	 * Produce the next value when the button is pressed. Receives the current
	 * value (e.g. so a generator can avoid repeating it). Pair with one of the
	 * `seed*` helpers for the common cases (ranged number, enum pick, string).
	 */
	generate: (prev: T) => T
	/** Override the default dice icon (e.g. a key for a password generator). */
	icon?: string
}
