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
	// Attention flash forwarded to the Balloon (scale + accent glow + glowing
	// border). Only has an effect together with `arrow`.
	flash?: boolean
	// Teleport the popover into this selector. Needed when the Popover is
	// declared outside `.TqViewport` (e.g. the global tooltip), so it still
	// inherits Tweeq's CSS reset (font, etc.) instead of the UA defaults.
	teleport?: string
	// Use this fixed CSS anchor name instead of generating one. When set, the
	// caller is responsible for putting `anchor-name` on the reference element
	// (e.g. the tooltip directive does it on hover, well before the popover
	// shows, so CSS anchor() is already resolved on the first frame).
	anchorName?: string
	// Animate the exit (fade-out + the Balloon's scale-down) instead of vanishing
	// instantly. Keeps the element mounted while closed so the native popover's
	// allow-discrete display transition can play. Off by default — most popovers
	// (tooltips, menus) want a snappy instant dismiss.
	exitTransition?: boolean
}
