import chroma from 'chroma-js'
import {clamp} from 'lodash-es'

import {unsignedMod} from '../util'
import {ColorChannel, HSV, HSVA, RGB} from './types'

export function tweakHSVAChannel(
	color: HSVA,
	channel: ColorChannel,
	delta: number
) {
	return setHSVAChannel(color, channel, value => value + delta)
}

export function setHSVAChannel(
	color: HSVA,
	channel: ColorChannel,
	value: number | ((oldValue: number) => number)
) {
	let newColor = {...color}

	const f = typeof value === 'number' ? () => value : value

	if (channel === 'h') {
		newColor.h = unsignedMod(f(newColor.h), 1)
	} else if (channel === 's') {
		newColor.s = clamp(f(newColor.s), 0, 1)
	} else if (channel === 'v') {
		newColor.v = clamp(f(newColor.v), 0, 1)
	} else if (channel === 'a') {
		newColor.a = clamp(f(newColor.a), 0, 1)
	} else {
		const rgb = hsv2rgb(color)

		if (channel === 'r') {
			rgb.r = clamp(f(rgb.r), 0, 1)
		} else if (channel === 'g') {
			rgb.g = clamp(f(rgb.g), 0, 1)
		} else if (channel === 'b') {
			rgb.b = clamp(f(rgb.b), 0, 1)
		}

		newColor = {...rgb2hsv(rgb), a: color.a}

		if (isNaN(newColor.h)) {
			newColor.h = color.h
		}
		if (isNaN(newColor.s)) {
			newColor.s = color.s
		}
	}

	return newColor
}

/**
 * Converts an RGB color value to HSV. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes r, g, and b are contained in the set [0, 1] and
 * returns h, s, and v in the set [0, 1].
 * @see https://gist.github.com/mjackson/5311256
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSV representation
 */
export function rgb2hsv({r, g, b}: RGB): HSV {
	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)

	const v = max

	const d = max - min
	const s = max === 0 ? NaN : d / max

	let h: number
	if (max === min) {
		h = NaN // achromatic
	} else {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0)
				break
			case g:
				h = (b - r) / d + 2
				break
			default:
				// case b:
				h = (r - g) / d + 4
				break
		}

		h /= 6
	}

	return {h, s, v}
}

/**
 * Converts an HSV color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
 * Assumes h, s, and v are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  v       The value
 * @return  Array           The RGB representation
 */
export function hsv2rgb({h, s, v}: HSV): RGB {
	let r, g, b

	const i = Math.floor(h * 6)
	const f = h * 6 - i
	const p = v * (1 - s)
	const q = v * (1 - f * s)
	const t = v * (1 - (1 - f) * s)

	switch (i % 6) {
		case 0:
			r = v
			g = t
			b = p
			break
		case 1:
			r = q
			g = v
			b = p
			break
		case 2:
			r = p
			g = v
			b = t
			break
		case 3:
			r = p
			g = q
			b = v
			break
		case 4:
			r = t
			g = p
			b = v
			break
		default:
			// case 5:
			r = v
			g = p
			b = q
			break
	}

	return {r, g, b}
}

export function getHSVAChannel(value: HSVA, channel: ColorChannel) {
	if (
		channel === 'h' ||
		channel === 's' ||
		channel === 'v' ||
		channel === 'a'
	) {
		return value[channel]
	}

	const rgb = hsv2rgb(value)
	return rgb[channel]
}

export function hsva2hex(value: HSVA): string {
	const {r, g, b} = hsv2rgb(value)
	return chroma(r * 255, g * 255, b * 255, value.a).hex()
}

export function css2hsva(value: string): HSVA {
	if (!chroma.valid(value)) {
		return {h: 0, s: 0, v: 0, a: 1}
	}

	const [r8bit, g8bit, b8bit, a] = chroma(value).rgba()
	const {h, s, v} = rgb2hsv({r: r8bit / 255, g: g8bit / 255, b: b8bit / 255})

	return {
		h: isNaN(h) ? 0 : h,
		s: isNaN(s) ? 0 : s,
		v,
		a,
	}
}
