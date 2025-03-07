import {
	type InputAlign,
	type InputBoxProps,
	type InputFont,
	type InputTheme,
	type Validator,
} from '../types'

export interface InputStringProps extends InputBoxProps<string> {
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
	validator?: Validator<string>
	forceUpdateOnFocusing?: boolean
}
