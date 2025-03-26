import {describe, expect, it} from 'vitest'

import {parseTimecode} from './utils'

describe('parseTimecode', () => {
	it('should parse timecode split by colon', () => {
		expect(parseTimecode('00:00:00', 24)).toBe(0)
		expect(parseTimecode('00:00:00', 30)).toBe(0)
		expect(parseTimecode('1:00', 24)).toBe(24)
		expect(parseTimecode('1:00', 30)).toBe(30)
		expect(parseTimecode('1:00:00', 60)).toBe(60 * 60)
		expect(parseTimecode('120:00', 60)).toBe(60 * 120)
	})

	it('should parse digits with unit', () => {
		expect(parseTimecode('100f', 24)).toBe(100)
		expect(parseTimecode('100F', 24)).toBe(100)
		expect(parseTimecode('100Frames', 24)).toBe(100)

		expect(parseTimecode('5s', 30)).toBe(150)
		expect(parseTimecode('5sec', 30)).toBe(150)
		expect(parseTimecode('5secs', 30)).toBe(150)
		expect(parseTimecode('5second', 30)).toBe(150)
		expect(parseTimecode('5seconds', 30)).toBe(150)

		expect(parseTimecode('10m', 30)).toBe(18000)
		expect(parseTimecode('10min', 30)).toBe(18000)
		expect(parseTimecode('10mins', 30)).toBe(18000)
		expect(parseTimecode('10minutes', 30)).toBe(18000)

		expect(parseTimecode('10h', 30)).toBe(1080000)
		expect(parseTimecode('10hr', 30)).toBe(1080000)
		expect(parseTimecode('10hrs', 30)).toBe(1080000)
		expect(parseTimecode('10hour', 30)).toBe(1080000)
		expect(parseTimecode('10hours', 30)).toBe(1080000)
	})

	it('should parse negative timecode', () => {
		expect(parseTimecode('-00:01:12', 24)).toBe(-36)

		expect(parseTimecode('-100f', 24)).toBe(-100)
		expect(parseTimecode('-100F', 24)).toBe(-100)
		expect(parseTimecode('-100Frames', 24)).toBe(-100)
	})
})
