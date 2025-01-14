import {type InputProps} from '../types'

export interface Props extends InputProps {
	modelValue: number
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
