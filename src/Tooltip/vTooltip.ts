import type {Directive} from 'vue'

import {
	closeTooltip,
	hideTooltip,
	showTooltip,
	TOOLTIP_ANCHOR_NAME,
	updateTooltip,
} from './tooltip'

// `v-tooltip="'text'"` or `v-tooltip="{content, html}"`.
export type TooltipValue =
	| string
	| {content?: string; html?: boolean}
	| undefined
	| null

function parse(value: TooltipValue) {
	if (typeof value === 'string') return {content: value, html: false}
	return {content: value?.content ?? '', html: value?.html ?? false}
}

interface Record {
	value: TooltipValue
	enter: () => void
	leave: () => void
}

const records = new WeakMap<HTMLElement, Record>()

export const vTooltip: Directive<HTMLElement, TooltipValue> = {
	mounted(el, binding) {
		const record: Record = {
			value: binding.value,
			enter: () => {
				const {content, html} = parse(record.value)
				if (!content) return
				// Register the anchor now, before the show delay, so CSS anchor()
				// is resolved by the time the tooltip appears (no first-frame flash
				// at the viewport corner).
				el.style.setProperty('anchor-name', TOOLTIP_ANCHOR_NAME)
				showTooltip(el, content, html)
			},
			leave: () => {
				el.style.removeProperty('anchor-name')
				hideTooltip(el)
			},
		}
		el.addEventListener('mouseenter', record.enter)
		el.addEventListener('mouseleave', record.leave)
		el.addEventListener('focus', record.enter)
		el.addEventListener('blur', record.leave)
		records.set(el, record)
	},
	updated(el, binding) {
		const record = records.get(el)
		if (!record) return
		record.value = binding.value
		const {content, html} = parse(binding.value)
		updateTooltip(el, content, html)
	},
	unmounted(el) {
		const record = records.get(el)
		if (record) {
			el.removeEventListener('mouseenter', record.enter)
			el.removeEventListener('mouseleave', record.leave)
			el.removeEventListener('focus', record.enter)
			el.removeEventListener('blur', record.leave)
			records.delete(el)
		}
		closeTooltip(el)
	},
}
