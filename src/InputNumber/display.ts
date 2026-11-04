/**
 * How a number is shown, where that is not what it is: a ratio as a percentage, a linear gain as
 * decibels. Everything about a field goes by what it shows, as that is what is being dragged.
 */
export interface NumberDisplay {
	/** What to show for a value. */
	to(value: number): number
	/** The value for what is shown. It is expected to undo `to`. */
	from(shown: number): number
}

/** Past this many digits, a difference is only what floating point leaves behind. */
const DIGITS = 12

const settled = (value: number): number => Number(value.toPrecision(DIGITS))

/** Shown as `factor` times what it is, like 100 for a percentage. */
export const scaledBy = (factor: number): NumberDisplay => ({
	to: value => settled(value * factor),
	from: shown => settled(shown / factor),
})

export interface DisplayedRange {
	readonly min?: number
	readonly max?: number
	readonly step?: number
	readonly default?: number
}

/**
 * What is said in terms of values, in terms of what is shown. Being shown backwards turns a range
 * around, and a step is how far it goes from where it is, around 0 for want of anywhere else.
 */
export function displayedRange(
	{min, max, step, default: initial}: DisplayedRange,
	{to}: NumberDisplay
): DisplayedRange {
	const ends = [min, max].map(end => (end === undefined ? undefined : to(end)))
	const backwards = min !== undefined && max !== undefined && ends[0]! > ends[1]!
	const [shownMin, shownMax] = backwards ? [ends[1], ends[0]] : ends
	return {
		...(shownMin === undefined ? {} : {min: shownMin}),
		...(shownMax === undefined ? {} : {max: shownMax}),
		...(step === undefined ? {} : {step: Math.abs(to(step) - to(0))}),
		...(initial === undefined ? {} : {default: to(initial)}),
	}
}
