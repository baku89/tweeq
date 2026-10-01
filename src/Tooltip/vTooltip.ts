import type {Directive} from 'vue'

import {
	clearTooltipAnchor,
	closeTooltip,
	hideTooltip,
	setTooltipAnchor,
	showTooltip,
	type TooltipActions,
	type TooltipContent,
	updateTooltip,
} from './tooltip'

// `v-tooltip="'text'"`, `v-tooltip="{content, html}"`, or the structured
// `v-tooltip="{title, description}"` (bold title + muted description — use this
// instead of an em-dash "Title — subtext" string).
//
// `actions` (with `html` content) makes parts of the tooltip clickable: an
// element with `data-tooltip-action="name"` runs `actions.name` on click, and
// the tooltip stays open while the pointer is over it.
export type TooltipValue =
	| string
	| {
			content?: string
			html?: boolean
			title?: string
			description?: string
			actions?: TooltipActions
	  }
	| undefined
	| null

function parse(value: TooltipValue): TooltipContent {
	if (typeof value === 'string') {
		return {
			content: value,
			html: false,
			title: '',
			description: '',
			actions: null,
		}
	}
	const actions = value?.actions
	return {
		content: value?.content ?? '',
		html: value?.html ?? false,
		title: value?.title ?? '',
		description: value?.description ?? '',
		actions: actions && Object.keys(actions).length > 0 ? actions : null,
	}
}

// Whether a parsed payload carries anything renderable.
function isEmpty(c: TooltipContent) {
	return !c.content && !c.title && !c.description
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
				const content = parse(record.value)
				if (isEmpty(content)) return
				// Register the anchor now, before the show delay, so CSS anchor()
				// is resolved by the time the tooltip appears (no first-frame flash
				// at the viewport corner). It stays put until another element takes
				// over, so the popover remains anchored while it closes.
				setTooltipAnchor(el)
				showTooltip(el, content)
			},
			leave: () => hideTooltip(el),
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
		updateTooltip(el, parse(binding.value))
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
		clearTooltipAnchor(el)
		closeTooltip(el)
	},
}
