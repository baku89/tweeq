export function toFixedWithNoTrailingZeros(value: number, precision: number) {
	return value
		.toFixed(precision)
		.replace(/\.(.*?)[0]+$/, '.$1')
		.replace(/\.$/, '')
}

export const unsignedMod = (x: number, y: number) => ((x % y) + y) % y

export const smoothstep = (min: number, max: number, value: number) => {
	var x = Math.max(0, Math.min(1, (value - min) / (max - min)))
	return x * x * (3 - 2 * x)
}
