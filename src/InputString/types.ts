import {
	type InputAlign,
	type InputFont,
	type InputProps,
	type InputTheme,
	type Validator,
} from '../types'

export interface InputStringProps extends InputProps {
	modelValue: string
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
	validator?: Validator<string>
	forceUpdateOnFocusing?: boolean
}
