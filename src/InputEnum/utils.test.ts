import {describe, expect, it} from 'vitest'

import {fitsInRow} from './utils'

describe('fitsInRow', () => {
	it('takes a few short labels', () => {
		expect(fitsInRow(['Round', 'Butt'], false)).toBe(true)
	})

	it('does not take too many labels, or long ones', () => {
		expect(fitsInRow(['A', 'B', 'C', 'D'], false)).toBe(false)
		expect(fitsInRow(['Very long label', 'Another long one'], false)).toBe(false)
	})

	it('takes more with icons, which can stand for long labels', () => {
		expect(fitsInRow(['Very long label', 'Another long one', 'C', 'D', 'E'], true)).toBe(true)
		expect(fitsInRow(['A', 'B', 'C', 'D', 'E', 'F'], true)).toBe(false)
	})
})
