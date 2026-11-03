/** A row of a tree on screen, in order from the top. */
export interface TreeRow {
	/** What identifies it, if it can be dragged or dropped next to. */
	readonly id?: string
	readonly depth: number
	readonly top: number
	readonly bottom: number
	readonly open: boolean
	readonly expandable: boolean
}

export type TreeDropPosition = 'before' | 'after' | 'inside'

export interface TreeDrop {
	readonly target: string
	readonly position: TreeDropPosition
	/** The level it lands at, and the gap it opens. Only the level, for `inside`. */
	readonly depth: number
	readonly y: number
}

/**
 * Where a drag at `x`, `y` could land, best first, as in a file tree. Over the
 * middle of a row that has nothing showing inside it, it is that row. Otherwise it
 * is the gap nearest to `y`, at the level `x` is at among those that gap allows:
 * the gap below the end of a subtree can belong to any level it closes.
 *
 * @param x From where depth 0 starts
 * @param indent The width of one level
 */
export function treeDropsAt(
	rows: readonly TreeRow[],
	x: number,
	y: number,
	indent: number
): TreeDrop[] {
	if (rows.length === 0) return []
	const index = rows.findIndex(row => y < row.bottom)
	const at = index < 0 ? rows.length - 1 : index
	const row = rows[at]!
	const fraction = (y - row.top) / (row.bottom - row.top)

	const drops: TreeDrop[] = []
	const hasChildrenShowing = row.open && (rows[at + 1]?.depth ?? -1) > row.depth
	if (
		row.expandable &&
		!hasChildrenShowing &&
		row.id !== undefined &&
		fraction > 0.25 &&
		fraction < 0.75
	) {
		drops.push({target: row.id, position: 'inside', depth: row.depth, y: row.top})
	}

	const gap = fraction < 0.5 ? at : at + 1
	const above = rows[gap - 1]
	const below = rows[gap]
	const deepest = above === undefined ? 0 : above.depth + (above.open && above.expandable ? 1 : 0)
	const shallowest = below === undefined ? 0 : Math.min(below.depth, deepest)
	const wanted = Math.floor(x / indent)
	const lineY = below?.top ?? above?.bottom ?? y

	const depths: number[] = []
	for (let depth = deepest; depth >= shallowest; depth--) depths.push(depth)
	depths.sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted))

	for (const depth of depths) {
		// What cannot be dropped next to, such as a row to add with, leaves the row
		// above it to go by.
		if (below?.depth === depth && below.id !== undefined) {
			drops.push({target: below.id, position: 'before', depth, y: lineY})
			continue
		}
		for (let i = gap - 1; i >= 0; i--) {
			const candidate = rows[i]!
			if (candidate.depth < depth) break
			if (candidate.depth === depth) {
				if (candidate.id !== undefined) {
					drops.push({target: candidate.id, position: 'after', depth, y: lineY})
				}
				break
			}
		}
	}
	return drops
}

/** Where what a row holds ends: the index after it, and after all that is deeper. */
export function subtreeEnd(rows: readonly TreeRow[], index: number): number {
	const depth = rows[index]?.depth ?? 0
	let end = index + 1
	while (end < rows.length && rows[end]!.depth > depth) end++
	return end
}

/**
 * How far each row moves out of the way while the rows from `from` to `to` are
 * dragged: those below them close up, and those below `y`, in the rows as they were,
 * open a gap. With no `y`, nothing is going anywhere, and they all stay. The rows
 * being dragged go by the pointer, and are 0 here.
 */
export function shiftsOf(
	rows: readonly TreeRow[],
	from: number,
	to: number,
	y: number | null
): number[] {
	const first = rows[from]
	const last = rows[to - 1]
	if (y === null || first === undefined || last === undefined) return rows.map(() => 0)
	const after = rows[to]
	const before = rows[from - 1]
	const gap = after ? after.top - last.bottom : before ? first.top - before.bottom : 0
	const height = last.bottom - first.top + gap
	return rows.map((row, i) =>
		i >= from && i < to
			? 0
			: (row.top >= last.bottom ? -height : 0) + (row.top >= y ? height : 0)
	)
}
