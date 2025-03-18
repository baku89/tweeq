import type {InputHorizontalPosition, InputVerticalPosition} from '../types'

export interface InputButtonProps {
	invalid?: boolean
	disabled?: boolean
	horizontalPosition?: InputHorizontalPosition
	verticalPosition?: InputVerticalPosition
	icon?: string
	label?: string
	tooltip?: string
	blink?: boolean
	subtle?: boolean
}
