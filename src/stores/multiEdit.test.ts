import {describe, expect, it} from 'vitest'

import {createMultiEdit, type MultiEditTarget} from './multiEdit'

function target(value: number) {
	const t = {
		id: Symbol(),
		value,
		confirmed: 0,
		getValue: () => t.value,
		setValue(next: number) {
			t.value = next
		},
		confirm() {
			t.confirmed++
		},
	}
	return t satisfies MultiEditTarget
}

const add = (by: number) => (values: number[]) => values.map(v => v + by)

describe('createMultiEdit', () => {
	it('works out every update from what they were when it began', () => {
		const a = target(1)
		const edit = createMultiEdit(() => [a])
		edit.begin()
		edit.update(add(10))
		edit.update(add(20))
		expect(a.value).toBe(21)
	})

	it('begins by itself, at the first update', () => {
		const a = target(1)
		const edit = createMultiEdit(() => [a])
		edit.update(add(10))
		edit.update(add(20))
		expect(a.value).toBe(21)
	})

	it('holds nothing over from an edit that is over', () => {
		const a = target(1)
		const edit = createMultiEdit(() => [a])
		edit.update(add(10))
		edit.commit()
		a.value = 100
		edit.update(add(1))
		expect(a.value).toBe(101)
	})

	it('takes in what joins part way, from what that is by then', () => {
		const a = target(1)
		const b = target(5)
		const targets = [a]
		const edit = createMultiEdit(() => targets)
		edit.update(add(1))
		targets.push(b)
		edit.update(add(2))
		expect([a.value, b.value]).toEqual([3, 7])
	})

	it('writes everything in one batch', () => {
		const a = target(1)
		const b = target(2)
		let writes = 0
		const edit = createMultiEdit(
			() => [a, b],
			write => {
				writes++
				write()
			}
		)
		edit.update(add(1))
		expect(writes).toBe(1)
		expect([a.value, b.value]).toEqual([2, 3])
	})

	it('confirms each when it is committed', () => {
		const a = target(1)
		const b = target(2)
		createMultiEdit(() => [a, b]).commit()
		expect([a.confirmed, b.confirmed]).toEqual([1, 1])
	})
})
