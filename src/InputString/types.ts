import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
} from '../types'
import {Validator} from '../validator'
export interface InputStringProps extends InputBoxProps<string> {
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
	validator?: Validator<string>
}
