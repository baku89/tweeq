import {describe, expect, it} from 'vitest'

import {clearanceOf, type Surrounding} from './clearance'

const reference = {left: 100, top: 100, right: 132, bottom: 132}
const around = (by: number, painted = true): Surrounding => ({
	left: reference.left - by,
	top: reference.top - by,
	right: reference.right + by,
	bottom: reference.bottom + by,
	painted,
})

describe('clearanceOf', () => {
	it('stands off from the bar a reference sits on', () => {
		expect(clearanceOf(reference, [around(6)], true)).toBe(6)
	})

	it('has nothing to clear of what cannot be seen', () => {
		expect(clearanceOf(reference, [around(6, false)], true)).toBe(0)
	})

	it('goes on through what cannot be seen', () => {
		expect(clearanceOf(reference, [around(2, false), around(6)], true)).toBe(6)
	})

	it('lies over a panel the reference is only inside of', () => {
		const panel = {...around(6), bottom: 600}
		expect(clearanceOf(reference, [panel], true)).toBe(0)
	})

	it('stops at what reaches too far, whatever is beyond it', () => {
		expect(clearanceOf(reference, [around(40, false), around(6)], true)).toBe(0)
	})

	it('goes along the axis the popover opens on', () => {
		// A row, wide and low.
		const row = {left: 0, top: 94, right: 400, bottom: 138, painted: true}
		expect(clearanceOf(reference, [row], true)).toBe(6)
		expect(clearanceOf(reference, [row], false)).toBe(0)
	})
})
