import type {TooltipValue} from '../Tooltip'
import type {InputPosition} from '../types'

export interface InputButtonProps {
	invalid?: boolean
	disabled?: boolean
	inlinePosition?: InputPosition
	blockPosition?: InputPosition
	/** Leading icon (before the label). */
	icon?: string
	/**
	 * Trailing icon (after the label), e.g. a dropdown chevron. When set, the
	 * button switches to a spread layout: the label grows and left-aligns so this
	 * icon pins to the right edge — mirroring InputNumber's left/right icons.
	 */
	rightIcon?: string
	label?: string
	/** Hover/focus tooltip: a plain string, or `{title, description}` for the two-line layout. */
	tooltip?: TooltipValue
	blink?: boolean
	/** Achromatic neutral fill at rest that lights up to accent on hover. */
	subtle?: boolean
	/**
	 * Drop the square `input-height` min-width so an icon-only button hugs its
	 * glyph (a slim affordance for tight clusters, e.g. ± steppers flanking an
	 * input). No effect once a label widens the button past the icon.
	 */
	narrow?: boolean
}
