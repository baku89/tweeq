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
	/** The level of the line to draw, and where. Not used for `inside`. */
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
		if (below !== undefined && below.depth === depth) {
			if (below.id !== undefined) {
				drops.push({target: below.id, position: 'before', depth, y: lineY})
			}
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
