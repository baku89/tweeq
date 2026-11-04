import type {InputBoxProps, InputFont, InputTheme, LabelizerProps} from '../types'

export interface InputEnumProps<T> extends LabelizerProps<T>, InputBoxProps {
	/** One for each of the options, in the same order. */
	icons?: readonly string[] | undefined
	theme?: InputTheme
	font?: InputFont
}
