import {type InputCodeProps} from '../InputCode'
import {type InputColorProps} from '../InputColor'
import {type InputNumberProps} from '../InputNumber'
import {type InputRoteryProps} from '../InputRotery'
import {type InputStringProps} from '../InputString'

type ParameterBase = {label?: string; icon?: string}

type Desc<T extends Record<string, unknown>, P> = T & Omit<P, 'modelValue'>

type ParameterDescNumber = Desc<
	{type: 'number'; ui?: undefined},
	InputNumberProps
>
type ParameterDescAngle = Desc<{type: 'number'; ui: 'angle'}, InputRoteryProps>

type ParameterDescString = Desc<
	{
		type: 'string'
		ui?: undefined
	},
	InputStringProps
>
type ParameterDescCode = Desc<{type: 'string'; ui: 'code'}, InputCodeProps>
type ParameterDescColor = Desc<{type: 'string'; ui: 'color'}, InputColorProps>
type ParameterDescBoolean = {type: 'boolean'}

type ParameterDescForType<T> = T extends number
	? ParameterDescNumber | ParameterDescAngle
	: T extends string
		? ParameterDescString | ParameterDescCode | ParameterDescColor
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
