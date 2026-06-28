import {random} from 'lodash-es'

// Ready-made `generate` functions for InputShuffle's common shapes. Each returns
// a `(prev) => next` so it drops straight into `<InputShuffle :generate="…" />`.
//
// They re-roll to avoid handing back the value you already have — the same
// result never appears twice in a row (which pure pseudo-randomness would), so
// every press visibly changes something. The retry gives up after a few tries
// so a one-element space (nothing else to pick) just returns the repeat.
function distinct<T>(prev: T, roll: () => T, tries = 10): T {
	let next = roll()
	for (let i = 0; i < tries && next === prev; i++) {
		next = roll()
	}
	return next
}

/**
 * Random number in `[min, max)`. The default `step` of 1 lands on the integer
 * grid `min, min + 1, …`; any positive step snaps to its grid (e.g. `0.1`);
 * `step = 0` draws a continuous value. Never repeats the previous one.
 */
export function fromNumber(min: number, max: number, step = 1) {
	if (step <= 0) {
		return (prev: number) =>
			distinct(prev, () => min + Math.random() * (max - min))
	}
	const count = Math.max(1, Math.ceil((max - min) / step))
	return (prev: number) =>
		distinct(prev, () => min + random(0, count - 1) * step)
}

/** Random pick from `options`, never the current value when there's an alternative. */
export function fromEnum<T>(options: readonly T[]) {
	return (prev: T): T =>
		options.length === 0
			? prev
			: distinct(prev, () => options[random(0, options.length - 1)])
}

const DEFAULT_CHARSET =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

/** Random string — a password generator. Defaults to 12 alphanumeric chars. */
export function fromString(options: {length?: number; charset?: string} = {}) {
	const length = options.length ?? 12
	const charset = options.charset ?? DEFAULT_CHARSET
	const roll = () => {
		let str = ''
		for (let i = 0; i < length; i++) {
			str += charset[random(0, charset.length - 1)]
		}
		return str
	}
	return (prev: string) => distinct(prev, roll)
}
