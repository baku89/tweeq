/** A copy of `items` with the item at `from` moved to `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
	const moved = [...items]
	const [item] = moved.splice(from, 1)
	moved.splice(to, 0, item)
	return moved
}

/**
 * Which index a dragged item belongs at: the slot it would be nearest to, were
 * the other items stacked without it. Depends only on where the item is, not on
 * where it was, so rows of different heights can't make it flip back and forth.
 *
 * @param heights Height of each item, in the current order
 * @param from Index of the dragged item
 * @param gap Space between items
 * @param top Where the dragged item's top edge is now, relative to the first slot's
 */
export function dropIndex(heights: readonly number[], from: number, gap: number, top: number) {
	let best = 0
	let bestDistance = Infinity
	let slot = 0
	let index = 0
	for (let i = 0; i < heights.length; i++) {
		if (i === from) continue
		const distance = Math.abs(slot - top)
		if (distance < bestDistance) {
			bestDistance = distance
			best = index
		}
		slot += heights[i] + gap
		index++
	}
	return Math.abs(slot - top) < bestDistance ? index : best
}
