import {Props as CodeProps} from '../InputCode'
import {Props as NumberProps} from '../InputNumber'

type ParameterBase = {label?: string; icon?: string}

type OmitValue<T> = Omit<T, 'modelValue'>

type ParameterDescNumber = {type: 'number'} & OmitValue<NumberProps>
type ParameterDescString = {
	type: 'string'
	ui?: undefined
} & OmitValue<'modelValue'>
type ParameterDescCode = {type: 'string'; ui: 'code'} & OmitValue<CodeProps>
type ParameterDescBoolean = {type: 'boolean'}

type ParameterDescForType<T> = T extends number
	? ParameterDescNumber
	: T extends string
		? ParameterDescString | ParameterDescCode
		: T extends boolean
			? ParameterDescBoolean
			: never

export type ParameterDesc = ParameterBase &
	(
		| ParameterDescNumber
		| ParameterDescString
		| ParameterDescBoolean
		| ParameterDescCode
	)

export type Scheme<T> = {
	[K in keyof T]: ParameterDescForType<T[K]> & ParameterBase
}

export interface Props<T> {
	modelValue: T
	scheme: Scheme<T>
	title?: string
}
