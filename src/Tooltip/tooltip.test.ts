import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {markRaw} from 'vue'

import {hideTooltip, showTooltip, tooltipState} from './tooltip'

const element = () => markRaw({}) as unknown as HTMLElement

describe('hideTooltip', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		tooltipState.open = false
		vi.useRealTimers()
	})

	const opened = () => {
		const owner = element()
		showTooltip(owner, {content: 'Hide', placement: 'top'} as never)
		vi.runAllTimers()
		expect(tooltipState.open).toBe(true)
		return owner
	}

	it('closes the tooltip of the element that is left', () => {
		const owner = opened()
		hideTooltip(owner)
		vi.runAllTimers()
		expect(tooltipState.open).toBe(false)
	})

	it('closes when what is around that element is left along with it', () => {
		const owner = opened()
		hideTooltip(owner)
		hideTooltip(element())
		vi.runAllTimers()
		expect(tooltipState.open).toBe(false)
	})

	it('leaves it open when only something else is left', () => {
		opened()
		hideTooltip(element())
		vi.runAllTimers()
		expect(tooltipState.open).toBe(true)
	})
})
