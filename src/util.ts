/**
 * Get the precision of a step
 * @param step - The step to get the precision of
 * @returns The precision of the step. If the step is 0, it returns 0
 */
export function precisionOf(step: number) {
	if (step === 0) return 0

	return Math.max(0, Math.ceil(-Math.log10(step)))
}

/**
 * Converts a number to a string with a fixed number of decimal places, while removing trailing zeros
 */
export function toFixed(value: number, precision: number) {
	// TODO: Fix this
	if (typeof value !== 'number') {
		// eslint-disable-next-line no-console
		console.error('Error', value)
		throw new Error('Error')
	}

	return value
		.toFixed(precision)
		.replace(/\.(.*?)[0]+$/, '.$1')
		.replace(/\.$/, '')
}

/**
 * Get the number of digits after the decimal point
 * @example getNumberPresigion('1.234') // 3
 * @example getNumberPresigion('1.234000') // 6
 * @example getNumberPresigion('1') // 0
 */
export function getNumberPresition(value: string) {
	const floats = /\.[0-9]*$/.exec(value)
	return floats ? floats[0].length - 1 : 0
}

export const unsignedMod = (x: number, y: number) => ((x % y) + y) % y

export function isDecendantElementOf(child: Element, parent: Element) {
	let node: Element | null = child
	while (node) {
		if (node === parent) return true
		node = node.parentElement
	}

	return false
}

export function toPercent(value: number): string {
	return `${value * 100}%`
}

export function nodeContains(parent: Node, child: Node) {
	return parent === child || parent.contains(child)
}

// CSS `anchor-name` is a comma-separated list, but several features (Popover,
// MultiSelectPopup, Tooltip) each set it on a reference element via inline
// style. If two of them target the SAME element, the last writer clobbers the
// others' name, breaking whichever popover still points at the lost name via
// `position-anchor` (it falls back to the top-left corner). To let them
// coexist, anchor names are refcounted per element and the property is rebuilt
// from the live set.
const anchorNameCounts = new WeakMap<
	HTMLElement | SVGElement,
	Map<string, number>
>()

function applyAnchorNames(el: HTMLElement | SVGElement) {
	const names = anchorNameCounts.get(el)
	if (!names || names.size === 0) {
		el.style.removeProperty('anchor-name')
	} else {
		el.style.setProperty('anchor-name', [...names.keys()].join(', '))
	}
}

/**
 * Add a CSS `anchor-name` to an element additively, returning a disposer that
 * removes just this one. Multiple callers can anchor to the same element at
 * once without overwriting each other.
 */
export function addAnchorName(
	el: HTMLElement | SVGElement,
	name: string
): () => void {
	let names = anchorNameCounts.get(el)
	if (!names) anchorNameCounts.set(el, (names = new Map()))
	names.set(name, (names.get(name) ?? 0) + 1)
	applyAnchorNames(el)

	let disposed = false
	return () => {
		if (disposed) return
		disposed = true
		const current = anchorNameCounts.get(el)
		if (!current) return
		const count = (current.get(name) ?? 0) - 1
		if (count > 0) current.set(name, count)
		else current.delete(name)
		applyAnchorNames(el)
	}
}
