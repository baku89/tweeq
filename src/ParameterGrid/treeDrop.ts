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

/** How much room the rows from `from` to `to` take up, with the gap to the next. */
export function liftedHeight(rows: readonly TreeRow[], from: number, to: number): number {
	const first = rows[from]
	const last = rows[to - 1]
	if (first === undefined || last === undefined) return 0
	const after = rows[to]
	const before = rows[from - 1]
	const gap = after ? after.top - last.bottom : before ? first.top - before.bottom : 0
	return last.bottom - first.top + gap
}

/** Where the gap opened at `y` is, once the rows from `from` to `to` have closed up. */
export function gapTopOf(
	rows: readonly TreeRow[],
	from: number,
	to: number,
	y: number
): number {
	const last = rows[to - 1]
	return last !== undefined && y >= last.bottom ? y - liftedHeight(rows, from, to) : y
}

/**
 * The row that what is dropped will be inside, by where it is in `rows`, leaving out
 * the rows being dragged. Null at the top level.
 */
export function dropParentOf(
	rows: readonly TreeRow[],
	from: number,
	to: number,
	drop: TreeDrop
): number | null {
	if (drop.position === 'inside') {
		const index = rows.findIndex(row => row.id === drop.target)
		return index < 0 ? null : index
	}
	if (drop.depth === 0) return null
	for (let i = rows.length - 1; i >= 0; i--) {
		const row = rows[i]!
		if ((i >= from && i < to) || row.top >= drop.y) continue
		if (row.depth === drop.depth - 1) return i
		if (row.depth < drop.depth - 1) return null
	}
	return null
}

export interface GuideShift {
	readonly top: number
	readonly bottom: number
}

/**
 * How far the ends of the guide along each open row's children move, by where it is
 * in `rows`, so that it goes with the rows around it, and on past a gap at its end.
 */
export function guideShiftsOf(
	rows: readonly TreeRow[],
	from: number,
	to: number,
	drop: TreeDrop | null
): Map<number, GuideShift> {
	const y = drop === null || drop.position === 'inside' ? null : drop.y
	const shifts = shiftsOf(rows, from, to, y)
	const height = liftedHeight(rows, from, to)
	const guides = new Map<number, GuideShift>()
	rows.forEach((row, i) => {
		if (!row.open || !row.expandable || (i >= from && i < to)) return
		const end = subtreeEnd(rows, i)
		if (end === i + 1) return
		const bottom = rows[end - 1]!.bottom
		let reached = row.bottom + shifts[i]!
		for (let j = end - 1; j > i; j--) {
			if (j >= from && j < to) continue
			reached = rows[j]!.bottom + shifts[j]!
			break
		}
		const landsAtEnd =
			y !== null &&
			drop!.depth > row.depth &&
			y >= bottom &&
			y <= (rows[end]?.top ?? Infinity)
		guides.set(i, {
			top: shifts[i]!,
			bottom: reached + (landsAtEnd ? height : 0) - bottom,
		})
	})
	return guides
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
	const height = liftedHeight(rows, from, to)
	return rows.map((row, i) =>
		i >= from && i < to
			? 0
			: (row.top >= last.bottom ? -height : 0) + (row.top >= y ? height : 0)
	)
}
