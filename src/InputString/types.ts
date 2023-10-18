import {
	InputAlign,
	InputFont,
	InputProps,
	InputTheme,
	Validator,
} from '../types'

export interface Props extends InputProps {
	modelValue: string
	theme?: InputTheme
	font?: InputFont
	align?: InputAlign
	validator?: Validator<string>
	forceUpdateOnFocusing?: boolean
}
