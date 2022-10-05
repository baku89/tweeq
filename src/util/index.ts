import {clamp} from 'lodash'

export function toFixedWithNoTrailingZeros(value: number, precision: number) {
	return value
		.toFixed(precision)
		.replace(/\.(.*?)[0]+$/, '.$1')
		.replace(/\.$/, '')
}

export function fit(
	value: number,
	srcLower: number,
	srcUpper: number,
	dstLower: number,
	dstUpper: number
) {
	const t = (value - srcLower) / (srcUpper - srcLower)
	return clamp(t * (dstUpper - dstLower) + dstLower, dstLower, dstUpper)
}

export function fitTo01(value: number, lower: number, upper: number) {
	return (value - lower) / (upper - lower)
}

export function fit01(value: number, lower: number, upper: number) {
	return lower + value * (upper - lower)
}

export const unsignedMod = (x: number, y: number) => ((x % y) + y) % y

export const smoothstep = (min: number, max: number, value: number) => {
	const x = Math.max(0, Math.min(1, (value - min) / (max - min)))
	return x * x * (3 - 2 * x)
}
