import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {markRaw} from 'vue'

import {hideTooltip, showTooltip, tooltipState} from './tooltip'

const element = () => markRaw({}) as unknown as HTMLElement
const content = {content: 'Hide', placement: 'top'} as never

// Each test's clock starts well after the last one's ended, so that a tooltip that
// closed in one is not still fresh in the next.
let clocks = 0
const startClock = () => {
	vi.useFakeTimers()
	vi.setSystemTime(Date.now() + 60_000 * ++clocks)
}

describe('showTooltip', () => {
	beforeEach(startClock)

	afterEach(() => {
		tooltipState.open = false
		vi.useRealTimers()
	})

	it('waits before the first, and not before the next, while the first has only just closed', () => {
		const first = element()
		showTooltip(first, content)
		expect(tooltipState.open).toBe(false)
		vi.advanceTimersByTime(600)
		expect(tooltipState.open).toBe(true)
		hideTooltip(first)
		vi.runAllTimers()
		expect(tooltipState.open).toBe(false)
		// Across a gap between two options, which takes the pointer a moment.
		vi.advanceTimersByTime(100)
		showTooltip(element(), content)
		expect(tooltipState.open).toBe(true)
	})

	it('waits again once the pointer has been away for a while', () => {
		const first = element()
		showTooltip(first, content)
		vi.runAllTimers()
		hideTooltip(first)
		vi.runAllTimers()
		vi.advanceTimersByTime(1000)
		showTooltip(element(), content)
		expect(tooltipState.open).toBe(false)
		vi.advanceTimersByTime(600)
		expect(tooltipState.open).toBe(true)
	})
})

describe('hideTooltip', () => {
	beforeEach(startClock)

	afterEach(() => {
		tooltipState.open = false
		vi.useRealTimers()
	})

	const opened = () => {
		const owner = element()
		showTooltip(owner, content)
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
