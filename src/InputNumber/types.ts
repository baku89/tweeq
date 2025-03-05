import {type InputBoxProps} from '../types'

export interface InputNumberProps extends InputBoxProps<number> {
	min?: number
	max?: number
	step?: number
	bar?: number | boolean
	clampMin?: boolean
	clampMax?: boolean
	precision?: number
	prefix?: string
	suffix?: string
	leftIcon?: string
	rightIcon?: string
}
