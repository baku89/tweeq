import {describe, expect, it} from 'vitest'

import {inwardOffset} from './inwardOffset'

describe('inwardOffset', () => {
	const size = [1000, 600] as const

	it('leaves alone what is far enough from the edges', () => {
		expect(inwardOffset([500, 300], 100, size)).toEqual([0, 0])
		expect(inwardOffset([100, 500], 100, size)).toEqual([0, 0])
	})

	it('moves inward from each edge, on its own axis', () => {
		expect(inwardOffset([30, 300], 100, size)).toEqual([70, 0])
		expect(inwardOffset([990, 300], 100, size)).toEqual([-90, 0])
		expect(inwardOffset([500, 20], 100, size)).toEqual([0, 80])
		expect(inwardOffset([990, 590], 100, size)).toEqual([-90, -90])
	})

	it('centers what cannot fit', () => {
		expect(inwardOffset([100, 100], 400, size)).toEqual([300, 200])
	})
})
