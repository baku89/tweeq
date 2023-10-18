import {InputProps} from '../types'

export interface Props extends InputProps {
	modelValue: number
	min?: number
	max?: number
	step?: number
	bar?: boolean | 'circle'
	barOrigin?: number | null
	clampMin?: boolean
	clampMax?: boolean
	precision?: number
	prefix?: string
	suffix?: string
	leftIcon?: string
	rightIcon?: string
}
