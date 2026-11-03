import {describe, expect, it} from 'vitest'

import {dropIndex, moveItem} from './utils'

describe('moveItem', () => {
	it('moves down and up without touching the original', () => {
		const items = ['a', 'b', 'c', 'd']
		expect(moveItem(items, 0, 2)).toEqual(['b', 'c', 'a', 'd'])
		expect(moveItem(items, 3, 1)).toEqual(['a', 'd', 'b', 'c'])
		expect(items).toEqual(['a', 'b', 'c', 'd'])
	})
})

describe('dropIndex', () => {
	const rows = [20, 20, 20, 20]

	it('stays put until the item is nearer the next slot', () => {
		expect(dropIndex(rows, 1, 4, 24)).toBe(1)
		expect(dropIndex(rows, 1, 4, 35)).toBe(1)
		expect(dropIndex(rows, 1, 4, 37)).toBe(2)
	})

	it('reaches both ends, and stops there', () => {
		expect(dropIndex(rows, 1, 4, -100)).toBe(0)
		expect(dropIndex(rows, 1, 4, 72)).toBe(3)
		expect(dropIndex(rows, 1, 4, 500)).toBe(3)
	})

	it('gives the same answer from any starting index', () => {
		for (const top of [0, 13, 30, 50, 70]) {
			const answers = rows.map((_, from) => dropIndex(rows, from, 4, top))
			expect(new Set(answers).size).toBe(1)
		}
	})

	it('settles when a tall row swaps with a short one', () => {
		// Moved to the slot it asked for, the item must ask for the same slot again.
		const heights = [60, 20, 20]
		const top = 30
		const to = dropIndex(heights, 0, 0, top)
		const moved = moveItem(heights, 0, to)
		expect(dropIndex(moved, to, 0, top)).toBe(to)
	})

	it('handles a single item', () => {
		expect(dropIndex([20], 0, 4, 50)).toBe(0)
	})
})
