import {defineStore} from 'pinia'
import {ref} from 'vue'

import {TimeFormat} from './types'

export const useInputTimeContext = defineStore('tq.inputTime', () => {
	const format = ref<TimeFormat>('timecode')

	return {format}
})

export function formatTimecode(frames: number, frameRate: number) {
	let sign = ''

	if (frames < 0) {
		sign = '-'
		frames = -frames
	}

	const h = Math.floor(frames / (frameRate * 3600))
	const m = Math.floor((frames % (frameRate * 3600)) / (frameRate * 60))
	const s = Math.floor((frames % (frameRate * 60)) / frameRate)
	const f = frames % frameRate

	if (h > 0) {
		return sign + [h, pad(m), pad(s), pad(f)].join(':')
	} else {
		return sign + [pad(m), pad(s), pad(f)].join(':')
	}

	function pad(n: number) {
		return n.toString().padStart(2, '0')
	}
}

export function replaceTimecodeWithFrames(
	expr: string,
	frameRate: number
): string {
	// Comma-separated timecode
	expr = expr.replaceAll(/([0-9+\-.]+:)+[0-9+\-.]+/gi, (match: string) => {
		return parseTimecode(match, 24)?.toString() ?? '0'
	})

	// Frames
	expr = expr.replaceAll(/[0-9+\-.]+f(rames?)?/gi, (match: string) => {
		return parseTimecode(match, frameRate)?.toString() ?? '0'
	})

	// Seconds
	expr = expr.replaceAll(/[0-9+\-.]+s(ec(ond)?s?)?/gi, (match: string) => {
		return parseTimecode(match, frameRate)?.toString() ?? '0'
	})

	// Minutes
	expr = expr.replaceAll(/[0-9+\-.]+m(in(ute)?s?)?/gi, (match: string) => {
		return parseTimecode(match, frameRate)?.toString() ?? '0'
	})

	// Hours
	expr = expr.replaceAll(/[0-9+\-.]+h((ou)?r)?s?/gi, (match: string) => {
		return parseTimecode(match, frameRate)?.toString() ?? '0'
	})

	return expr
}

export function parseTimecode(timecode: string, frameRate: number) {
	timecode = timecode.trim().toLowerCase()

	let sign = 1
	if (timecode.startsWith('-')) {
		sign = -1
		timecode = timecode.slice(1)
	}

	if (timecode.includes(':')) {
		const digits = timecode.split(':').map(Number).reverse()

		let frames = 0

		for (let i = 0; i < digits.length; i++) {
			const multiplier =
				i === 0 ? 1 : i === 1 ? frameRate : frameRate * Math.pow(60, i - 1)
			frames += digits[i] * multiplier
		}

		return sign * frames
	}

	// Matches with "s", "sec", "secs", "second", "seconds"
	if (/[0-9+\-.]s(ec(ond)?s?)?$/.test(timecode)) {
		const seconds = parseFloat(timecode)
		return isNaN(seconds) ? null : sign * Math.round(seconds * frameRate)
	}

	// Matches with "m", "min", "mins", "minute", "minutes"
	if (/[0-9+\-.]m(in(ute)?s?)?$/.test(timecode)) {
		const minutes = parseFloat(timecode)
		return isNaN(minutes) ? null : sign * Math.round(minutes * frameRate * 60)
	}

	// Matches with "h", "hr", "hrs", "hour", "hours"
	if (/[0-9+\-.]h((ou)?r)?s?$/.test(timecode)) {
		const hours = parseFloat(timecode)
		return isNaN(hours) ? null : sign * Math.round(hours * frameRate * 3600)
	}

	const frames = parseInt(timecode)

	return isNaN(frames) ? null : sign * frames
}
