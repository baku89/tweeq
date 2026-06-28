import type {InputPosition} from '../types'

export interface InputButtonProps {
	invalid?: boolean
	disabled?: boolean
	inlinePosition?: InputPosition
	blockPosition?: InputPosition
	icon?: string
	label?: string
	tooltip?: string
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
