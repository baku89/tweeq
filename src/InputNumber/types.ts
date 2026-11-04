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
	/**
	 * What to make of what is typed that is not a number, in place of evaluating it as
	 * JavaScript: it is up to this what comes of it, and it says what is wrong, if anything.
	 */
	expression?: (text: string) => string | null
	/** Value restored by the right-click "Reset to Default" menu item. */
	default?: number
}
