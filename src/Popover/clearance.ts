export interface Box {
	left: number
	top: number
	right: number
	bottom: number
}

/** An element around a popover's reference, and whether it can be seen. */
export interface Surrounding extends Box {
	painted: boolean
}

/**
 * How far around its reference a bar can reach and still be what the reference
 * sits on, such as a toolbar or a row. Anything further is a panel the reference
 * is merely inside of, which a popover is free to lie over.
 */
export const SURFACE_REACH = 12

/**
 * How much further than the reference a popover has to stand off along an axis,
 * to be clear of what the reference sits on. `surroundings` go from the nearest
 * outward, and end at the first one that reaches too far on either side.
 */
export function clearanceOf(
	reference: Box,
	surroundings: Iterable<Surrounding>,
	horizontal: boolean
): number {
	let clearance = 0
	for (const box of surroundings) {
		const before = horizontal
			? reference.top - box.top
			: reference.left - box.left
		const after = horizontal
			? box.bottom - reference.bottom
			: box.right - reference.right
		if (before > SURFACE_REACH || after > SURFACE_REACH) break
		if (box.painted) clearance = Math.max(clearance, before, after)
	}
	return clearance
}

const isClear = (color: string) =>
	color === 'transparent' || /[,/]\s*0(\.0+)?\)$/.test(color)

/** Whether an element shows anything of its own, rather than only laying out. */
const isPainted = (style: CSSStyleDeclaration) =>
	!isClear(style.backgroundColor) ||
	style.backgroundImage !== 'none' ||
	style.boxShadow !== 'none'

/**
 * Where a pseudo-element painted around `box` reaches to, as a selected row's
 * highlight is, if it is one placed by its insets.
 */
function pseudoAround(
	element: Element,
	which: '::before' | '::after',
	box: Box
): Surrounding | null {
	const style = getComputedStyle(element, which)
	if (
		style.content === 'none' ||
		style.position !== 'absolute' ||
		!isPainted(style)
	) {
		return null
	}
	const inset = (value: string) => parseFloat(value) || 0
	return {
		left: box.left + inset(style.left),
		top: box.top + inset(style.top),
		right: box.right - inset(style.right),
		bottom: box.bottom - inset(style.bottom),
		painted: true,
	}
}

/** What is around `element`, from the nearest outward, read as it is asked for. */
export function* surroundingsOf(element: Element): Iterable<Surrounding> {
	for (let at = element.parentElement; at; at = at.parentElement) {
		const {left, top, right, bottom} = at.getBoundingClientRect()
		const box = {left, top, right, bottom}
		for (const which of ['::before', '::after'] as const) {
			const pseudo = pseudoAround(at, which, box)
			if (pseudo) yield pseudo
		}
		yield {...box, painted: isPainted(getComputedStyle(at))}
	}
}
