import type {MenuItem} from '../Menu'
import {type InputBoxProps} from '../types'

export interface InputNumberProps extends InputBoxProps {
	/** Extra right-click menu items, below "Reset to Default". */
	menuItems?: MenuItem[]
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
	/** The left icon can be pressed, for `leftIconClick`. */
	leftIconPressable?: boolean
	rightIcon?: string
	/** The right icon can be pressed, for `rightIconClick`. */
	rightIconPressable?: boolean
	/** Value restored by the right-click "Reset to Default" menu item. */
	default?: number
}
