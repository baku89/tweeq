import Color from 'colorjs.io'
import {describe, expect, it} from 'vitest'

import {buildSemanticColors, PALETTE, semanticHue} from './palette'

const NAMES = ['colorError', 'colorWarning', 'colorSuccess', 'colorInfo'] as const
const ACCENTS = ['#878787', '#C85168', '#0000ff', '#2fb36d', '#e5484d', '#ffc53d']

function oklch(hex: string) {
	return new Color(hex).to('oklch').coords
}

function contrast(a: string, b: string) {
	return new Color(a).contrast(new Color(b), 'WCAG21')
}

function distance(a: number, b: number) {
	return Math.abs(((b - a + 540) % 360) - 180)
}

describe('semanticHue', () => {
	it('ignores an accent without a hue', () => {
		expect(semanticHue(23, NaN, 0)).toBe(23)
		expect(semanticHue(23, 200, 0)).toBe(23)
	})

	it('leans toward a far accent, a little', () => {
		const hue = semanticHue(23, 155, 0.15)
		expect(hue).toBeGreaterThan(23)
		expect(hue).toBeLessThanOrEqual(31)
	})

	it('moves away from a near accent', () => {
		expect(distance(semanticHue(23, 11, 0.15), 11)).toBeCloseTo(24)
		expect(semanticHue(23, 11, 0.15)).toBeGreaterThan(23)
		expect(semanticHue(23, 35, 0.15)).toBeLessThan(23)
	})

	it('never leaves its band', () => {
		for (let accent = 0; accent < 360; accent += 5) {
			expect(distance(semanticHue(23, accent, 0.2), 23)).toBeLessThanOrEqual(20)
		}
	})
})

describe('buildSemanticColors', () => {
	for (const background of ['#111111', '#ffffff']) {
		for (const accent of ACCENTS) {
			it(`reads and stays distinct on ${background} with ${accent}`, () => {
				const colors = buildSemanticColors({background, accent})
				for (const name of NAMES) {
					expect(contrast(colors[name], background)).toBeGreaterThanOrEqual(4.5)
				}
				expect(new Set(NAMES.map(name => colors[name])).size).toBe(4)
			})
		}
	}

	it('keeps the palette as it is under a grey accent, where that reads', () => {
		const colors = buildSemanticColors({background: '#111111', accent: '#878787'})
		expect(colors.colorError).toBe(PALETTE.red)
		expect(colors.colorWarning).toBe(PALETTE.yellow)
	})

	it('keeps the vividness of the palette', () => {
		const {colorError} = buildSemanticColors({background: '#111111', accent: '#2fb36d'})
		expect(oklch(colorError)[1]).toBeGreaterThan(0.15)
	})

	it('has a visible icon on an error fill', () => {
		const colors = buildSemanticColors({background: '#111111', accent: '#878787'})
		expect(contrast(colors.colorOnError, colors.colorError)).toBeGreaterThan(3)
	})

	it('keeps the recording red canonical', () => {
		expect(buildSemanticColors({background: '#111111', accent: '#0000ff'}).colorRec).toBe('#e5484d')
	})
})
