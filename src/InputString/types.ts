import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
} from '../types'

export interface InputStringProps extends InputBoxProps<string> {
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
}
