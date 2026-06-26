import {vec2} from 'linearly'

// floating-ui-compatible placement names, kept so callers read the same as
// before. Positioning is now done with CSS Anchor Positioning (no library).
export type Placement =
	| 'top'
	| 'top-start'
	| 'top-end'
	| 'bottom'
	| 'bottom-start'
	| 'bottom-end'
	| 'left'
	| 'left-start'
	| 'left-end'
	| 'right'
	| 'right-start'
	| 'right-end'

export interface OffsetOptions {
	// Gap between the popover and its anchor, along the placement axis.
	mainAxis?: number
	// Shift along the cross axis (e.g. nudging a submenu up by a padding).
	crossAxis?: number
}

export interface PopoverProps {
	reference: HTMLElement | null
	open: boolean
	placement?: Placement | vec2
	offset?: number | OffsetOptions
	lightDismiss?: boolean
	// Wrap the content in a Balloon (blurred, bordered chrome with an arrow that
	// points back at the reference). The arrow side/offset are derived from the
	// resolved geometry, so they follow flips automatically.
	arrow?: boolean
}
