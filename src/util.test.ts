import {describe, expect, it} from 'vitest'

import {decimalsOf, toFixed} from './util'

describe('decimalsOf', () => {
	it('counts the decimal places a number needs', () => {
		expect(decimalsOf(40)).toBe(0)
		expect(decimalsOf(1.5)).toBe(1)
		expect(decimalsOf(-0.125)).toBe(3)
		expect(decimalsOf(1e21)).toBe(0)
		expect(decimalsOf(1e-7)).toBe(7)
		expect(decimalsOf(1.5e-7)).toBe(8)
		expect(decimalsOf(Infinity)).toBe(0)
		expect(decimalsOf(NaN)).toBe(0)
	})

	it('keeps a value intact when used as the precision', () => {
		expect(toFixed(1.5, decimalsOf(1.5))).toBe('1.5')
	})
})
