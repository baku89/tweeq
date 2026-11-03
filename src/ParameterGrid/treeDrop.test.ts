import {describe, expect, it} from 'vitest'

import {shiftsOf, subtreeEnd, type TreeRow, treeDropsAt} from './treeDrop'

const HEIGHT = 20
const INDENT = 18

/** Rows from `[id, depth, open?, expandable?]`, stacked from y = 0. */
const rows = (...spec: [string | undefined, number, boolean?, boolean?][]): TreeRow[] =>
	spec.map(([id, depth, open = false, expandable = false], i) => ({
		...(id === undefined ? {} : {id}),
		depth,
		top: i * HEIGHT,
		bottom: (i + 1) * HEIGHT,
		open,
		expandable,
	}))

const best = (r: TreeRow[], x: number, y: number) => {
	const [drop] = treeDropsAt(r, x, y, INDENT)
	return drop && `${drop.position} ${drop.target}`
}
const all = (r: TreeRow[], x: number, y: number) =>
	treeDropsAt(r, x, y, INDENT).map(d => `${d.position} ${d.target}`)

describe('treeDropsAt', () => {
	const flat = rows(['x', 0], ['y', 0], ['z', 0])

	it('finds the gap nearest to the pointer', () => {
		expect(best(flat, 0, 21)).toBe('before y')
		expect(best(flat, 0, 39)).toBe('before z')
		expect(best(flat, 0, 59)).toBe('after z')
		expect(best(flat, 0, 500)).toBe('after z')
		expect(best(flat, 0, 1)).toBe('before x')
	})

	it('goes inside a closed row that can open, by its middle', () => {
		const r = rows(['x', 0], ['z', 0, false, true])
		expect(best(r, 0, 30)).toBe('inside z')
		expect(best(r, 0, 22)).toBe('before z')
		expect(best(r, 0, 38)).toBe('after z')
	})

	it('offers the gap as well, for when it cannot go inside', () => {
		const r = rows(['x', 0], ['z', 0, false, true])
		expect(all(r, 0, 28)).toEqual(['inside z', 'before z'])
	})

	it('does not go inside what shows its children, but among them', () => {
		const r = rows(['z', 0, true, true], ['a', 1])
		expect(all(r, 0, 10)).not.toContain('inside z')
		expect(best(r, 0, 12)).toBe('before a')
		expect(best(r, INDENT, 25)).toBe('before a')
		expect(best(r, INDENT, 39)).toBe('after a')
	})

	it('can go inside what is open with nothing in it', () => {
		expect(best(rows(['z', 0, true, true]), 0, 10)).toBe('inside z')
	})

	it('picks the level by where the pointer is, below the end of a subtree', () => {
		const r = rows(['z', 0, true, true], ['a', 1], ['w', 0])
		expect(best(r, INDENT * 1.5, 39)).toBe('after a')
		expect(best(r, 0, 39)).toBe('before w')
	})

	it('reaches the end of an open subtree at the very bottom', () => {
		const r = rows(['z', 0, true, true], ['a', 1])
		expect(best(r, 0, 39)).toBe('after z')
		expect(best(r, INDENT, 39)).toBe('after a')
	})

	it('offers nothing next to rows that have no id', () => {
		const r = rows(['y', 0, true, true], [undefined, 1], [undefined, 1], ['z', 0])
		expect(all(r, INDENT, 40)).toEqual([])
	})

	it('falls back to the levels that have one', () => {
		const r = rows(['y', 0, true, true], [undefined, 1], ['z', 0])
		expect(all(r, INDENT, 39)).toEqual(['before z'])
	})

	it('has nothing for nothing', () => {
		expect(treeDropsAt([], 0, 0, INDENT)).toEqual([])
	})
})

describe('subtreeEnd', () => {
	it('goes past what is deeper', () => {
		const r = rows(['a', 0], ['b', 1], ['c', 2], ['d', 1], ['e', 0])
		expect(subtreeEnd(r, 0)).toBe(4)
		expect(subtreeEnd(r, 1)).toBe(3)
		expect(subtreeEnd(r, 4)).toBe(5)
	})
})

describe('shiftsOf', () => {
	const r = rows(['a', 0], ['b', 0], ['c', 0], ['d', 0])

	it('leaves everything with nowhere to go', () => {
		expect(shiftsOf(r, 1, 2, null)).toEqual([0, 0, 0, 0])
	})

	it('leaves everything where it would land where it was', () => {
		expect(shiftsOf(r, 1, 2, r[2]!.top)).toEqual([0, 0, 0, 0])
	})

	it('closes up below it, and opens up above where it lands', () => {
		expect(shiftsOf(r, 0, 1, r[2]!.top)).toEqual([0, -HEIGHT, 0, 0])
		expect(shiftsOf(r, 3, 4, r[1]!.top)).toEqual([0, HEIGHT, HEIGHT, 0])
	})

	it('counts the gap between rows, wherever the row is', () => {
		const spaced = r.map((row, i) => ({...row, top: i * 30, bottom: i * 30 + 20}))
		expect(shiftsOf(spaced, 0, 1, spaced[2]!.top)).toEqual([0, -30, 0, 0])
		expect(shiftsOf(spaced, 3, 4, spaced[2]!.top)).toEqual([0, 0, 30, 0])
	})

	it('moves by all that is dragged', () => {
		expect(shiftsOf(r, 0, 2, r[3]!.top)).toEqual([0, 0, -2 * HEIGHT, 0])
	})
})
