import type {TooltipValue} from '../Tooltip'
import type {InputPosition} from '../types'

export interface InputButtonProps {
	invalid?: boolean
	disabled?: boolean
	inlinePosition?: InputPosition
	blockPosition?: InputPosition
	icon?: string
	label?: string
	/**
	 * Show a trailing chevron-down marking the button as a disclosure — it opens a
	 * popover / menu / balloon on click. It pins tight to the right edge and so
	 * left-aligns the leading icon + label, instead of the whole content centering.
	 */
	chevron?: boolean
	/** Hover/focus tooltip: a plain string, or `{title, description}` for the two-line layout. */
	tooltip?: TooltipValue
	blink?: boolean
	/** Achromatic neutral fill at rest that lights up to accent on hover. */
	subtle?: boolean
	/**
	 * Nothing but its label or icon at rest, with a fill only while hovered: for what is
	 * there to be pressed and is not what anything is about, such as closing or minimizing.
	 */
	ghost?: boolean
	/**
	 * Drop the square `input-height` min-width so an icon-only button hugs its
	 * glyph (a slim affordance for tight clusters, e.g. ± steppers flanking an
	 * input). No effect once a label widens the button past the icon.
	 */
	narrow?: boolean
}
