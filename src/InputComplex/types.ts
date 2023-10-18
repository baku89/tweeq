type ParameterBase = {label?: string; icon?: string}
import {Props as NumberProps} from '../InputNumber'
import {Props as StringProps} from '../InputString'

type ParameterDescNumber = {type: 'number'} & Omit<NumberProps, 'modelValue'>
type ParameterDescString = {type: 'string'} & Omit<StringProps, 'modelValue'>

type ParameterDescForType<T> = T extends number
	? ParameterDescNumber
	: T extends string
	? ParameterDescString
	: never

export type ParameterDesc = ParameterBase &
	(ParameterDescNumber | ParameterDescString)

export type Scheme<T> = {
	[K in keyof T]: ParameterDescForType<T[K]> & ParameterBase
}

export interface Props<T> {
	modelValue: T
	scheme: Scheme<T>
	title?: string
}
