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
	subtle?: boolean
}
