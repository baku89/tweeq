import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
	type LabelizerProps,
} from '../types'

export interface InputDropdownProps<T>
	extends LabelizerProps<T>,
		InputBoxProps<T> {
	icons?: string[]
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
}
