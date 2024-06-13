import {Props as CodeProps} from '../InputCode'
import {Props as NumberProps} from '../InputNumber'
import {Props as StringProps} from '../InputString'

type ParameterBase = {label?: string; icon?: string}

type Desc<T extends Record<string, unknown>, P> = T & Omit<P, 'modelValue'>

type ParameterDescNumber = Desc<{type: 'number'}, NumberProps>
type ParameterDescString = Desc<
	{
		type: 'string'
		ui?: undefined
	},
	StringProps
>
type ParameterDescCode = Desc<{type: 'string'; ui: 'code'}, CodeProps>
type ParameterDescBoolean = {type: 'boolean'}

type ParameterDescForType<T> = T extends number
	? ParameterDescNumber
	: T extends string
		? ParameterDescString | ParameterDescCode
		: T extends boolean
			? ParameterDescBoolean
			: never

export type Scheme<T extends Record<string, unknown>> = {
	[K in keyof T]: ParameterDescForType<T[K]> & ParameterBase
}

export interface InputComplexProps<T extends Record<string, unknown>> {
	modelValue: T
	scheme: Scheme<T>
	title?: string
}
