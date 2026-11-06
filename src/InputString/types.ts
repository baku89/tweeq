import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
} from '../types'
import type {MenuItem, MenuItems} from '../Menu'
import {type Validator} from '../validator'
export interface InputStringProps extends InputBoxProps {
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
	validator?: Validator<string>
	/** Shown while the input is empty. */
	placeholder?: string
	/** An icon at the left. Press it, with `leftIconPressable`, for `leftIconClick`. */
	leftIcon?: string
	leftIconPressable?: boolean
	/** An icon at the right. Press it, with `rightIconPressable`, for `rightIconClick`. */
	rightIcon?: string
	rightIconPressable?: boolean
	/** Value restored by the right-click "Reset to Default" menu item. */
	default?: string
	/** Extra right-click menu items, below "Reset to Default". */
	menuItems?: MenuItems
	/** What there is a reason to choose rather than to arrive at, from a chevron at the right. */
	presets?: MenuItem[]
}
