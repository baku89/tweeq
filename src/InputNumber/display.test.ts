import {describe, expect, it} from 'vitest'

import {displayedRange, type NumberDisplay, scaledBy} from './display'

describe('scaledBy', () => {
	const percent = scaledBy(100)

	it('shows a value, and has what is shown come back to it', () => {
		expect(percent.to(0.5)).toBe(50)
		expect(percent.from(50)).toBe(0.5)
	})

	it('leaves nothing behind of floating point', () => {
		expect(percent.to(0.07)).toBe(7)
		expect(percent.from(61.2)).toBe(0.612)
	})
})

describe('displayedRange', () => {
	const percent = scaledBy(100)

	it('says what is said in terms of what is shown', () => {
		expect(displayedRange({min: 0, max: 1, step: 0.01, default: 0.5}, percent)).toEqual({
			min: 0,
			max: 100,
			step: 1,
			default: 50,
		})
	})

	it('says nothing of what was not said', () => {
		expect(displayedRange({}, percent)).toEqual({})
		expect(displayedRange({min: 0}, percent)).toEqual({min: 0})
	})

	it('turns around a range that is shown backwards', () => {
		const negated: NumberDisplay = {to: v => -v, from: v => -v}
		expect(displayedRange({min: 0, max: 1, step: 1}, negated)).toEqual({
			min: -1,
			max: -0,
			step: 1,
		})
	})

	it('goes by a function that is not a scale', () => {
		const squared: NumberDisplay = {to: v => v * v, from: Math.sqrt}
		expect(displayedRange({min: 2, max: 3}, squared)).toEqual({min: 4, max: 9})
	})
})
