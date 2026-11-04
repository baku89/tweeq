/**
 * How far to move something at `center` so that `reach` around it is on a screen
 * of `size`. What is too big to fit stays centered on the screen.
 */
export function inwardOffset(
	center: readonly [number, number],
	reach: number,
	size: readonly [number, number]
): [number, number] {
	const along = (at: number, length: number) =>
		reach * 2 >= length
			? length / 2 - at
			: Math.max(reach - at, Math.min(0, length - reach - at))
	return [along(center[0], size[0]), along(center[1], size[1])]
}
