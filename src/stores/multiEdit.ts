export interface MultiEditTarget {
	readonly id: symbol
	getValue(): any
	setValue(value: any): void
	confirm(): void
}

/** Each going where the one after it was, and the last to where the first was. */
export const rotated = <T>(values: readonly T[]): T[] =>
	values.length === 0 ? [] : [values.at(-1)!, ...values.slice(0, -1)]

export type MultiEditBatch = (write: () => void) => void

/**
 * One edit of several values: however long it goes on, each target's new value is
 * worked out from what it was when the edit began, and all of them are written at
 * once. Targets can join part way through, starting from what they are by then.
 */
export function createMultiEdit(
	targets: () => readonly MultiEditTarget[],
	batch: MultiEditBatch = write => write()
) {
	const base = new Map<symbol, any>()

	function baseOf(target: MultiEditTarget) {
		if (!base.has(target.id)) base.set(target.id, target.getValue())
		return base.get(target.id)
	}

	return {
		/** Start over from what the targets are now. */
		begin() {
			base.clear()
			targets().forEach(baseOf)
		},
		update(updator: (values: any[]) => any[]) {
			const current = targets()
			const values = updator(current.map(baseOf))
			batch(() => current.forEach((target, i) => target.setValue(values[i])))
		},
		/** The edit is over, and whatever comes next starts from what they are by then. */
		commit() {
			targets().forEach(target => target.confirm())
			base.clear()
		},
	}
}
