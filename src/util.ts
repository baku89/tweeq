export function precisionOf(step: number) {
	return Math.max(0, Math.ceil(-Math.log10(step)))
}

/**
 * Converts a number to a string with a fixed number of decimal places, while removing trailing zeros
 */
export function toFixed(value: number, precision: number) {
	// TODO: Fix this
	// eslint-disable-next-line no-console
	if (value === undefined) console.error('Error')

	return (value ?? 0)
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
