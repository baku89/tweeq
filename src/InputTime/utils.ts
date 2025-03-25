import {defineStore} from 'pinia'
import {ref} from 'vue'

import {TimeFormat} from './types'

export const useInputTimeContext = defineStore('tq.inputTime', () => {
	const format = ref<TimeFormat>('timecode')

	return {format}
})

export function formatTimecode(frames: number, frameRate: number) {
	const h = Math.floor(frames / (frameRate * 3600))
	const m = Math.floor((frames % (frameRate * 3600)) / (frameRate * 60))
	const s = Math.floor((frames % (frameRate * 60)) / frameRate)
	const f = frames % frameRate

	if (h > 0) {
		return [h, pad(m), pad(s), pad(f)].join(':')
	}

	return [pad(m), pad(s), pad(f)].join(':')

	function pad(n: number) {
		return n.toString().padStart(2, '0')
	}
}

export function parseTimecode(timecode: string, frameRate: number) {
	timecode = timecode.trim().toLowerCase()

	if (timecode.includes(':')) {
		const digits = timecode.split(':').map(Number).reverse()

		let frames = 0

		for (let i = 0; i < digits.length; i++) {
			frames += digits[i] * Math.pow(60, i)
		}

		return frames
	}

	// Matches with "s", "sec", "secs", "second", "seconds"
	if (/s(ec(ond)?s?)?$/.test(timecode)) {
		const seconds = parseFloat(timecode)
		return isNaN(seconds) ? null : Math.round(seconds * frameRate)
	}

	// Matches with "m", "min", "mins", "minute", "minutes"
	if (/m(in(ute)?s?)?$/.test(timecode)) {
		const minutes = parseFloat(timecode)
		return isNaN(minutes) ? null : Math.round(minutes * frameRate * 60)
	}

	// Matches with "h", "hr", "hrs", "hour", "hours"
	if (/h((ou)?r)?s?$/.test(timecode)) {
		const hours = parseFloat(timecode)
		return isNaN(hours) ? null : Math.round(hours * frameRate * 3600)
	}

	const frames = parseInt(timecode)

	return isNaN(frames) ? null : frames
}
