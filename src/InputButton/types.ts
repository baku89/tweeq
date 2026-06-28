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
}
