import {type InputBoxProps} from '../types'

export interface InputNumberProps extends InputBoxProps {
	min?: number
	max?: number
	step?: number
	snap?: number
	bar?: number | boolean
	clampMin?: boolean
	clampMax?: boolean
	precision?: number
	prefix?: string
	suffix?: string
	leftIcon?: string
	rightIcon?: string
	/** Value restored by the right-click "Reset to Default" menu item. */
	default?: number
}
