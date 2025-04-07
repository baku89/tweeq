import {vec2} from 'linearly'

import {type InputCodeProps} from '../InputCode'
import {type InputColorProps} from '../InputColor'
import {type InputNumberProps} from '../InputNumber'
import {type InputPositionProps} from '../InputPosition'
import {type InputRoteryProps} from '../InputRotery'
import {type InputStringProps} from '../InputString'
import {InputTimeProps} from '../InputTime'
import {InputVecProps} from '../InputVec'

type ParameterBase = {label?: string; icon?: string}

type Desc<T extends Record<string, unknown>, P> = T & P

type ParameterDescNumber = Desc<
	{type: 'number'; ui?: undefined},
	InputNumberProps
>
type ParameterDescAngle = Desc<{type: 'number'; ui: 'angle'}, InputRoteryProps>
type ParameterDescTime = Desc<{type: 'number'; ui: 'time'}, InputTimeProps>

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
	? ParameterDescNumber | ParameterDescAngle | ParameterDescTime
	: T extends string
		? ParameterDescString | ParameterDescCode | ParameterDescColor
		: T extends boolean
			? ParameterDescBoolean
			: T extends vec2
				? ParameterDescVec2 | ParameterDescPosition
				: never

type ParameterDescVec2 = Desc<
	{type: 'vec2'; ui?: undefined},
	InputVecProps<vec2>
>
type ParameterDescPosition = Desc<
	{type: 'vec2'; ui: 'position'},
	InputPositionProps
>

export type Scheme<T extends Record<string, unknown>> = {
	[K in keyof T]: ParameterDescForType<T[K]> & ParameterBase
}

export interface InputComplexProps<T extends Record<string, unknown>> {
	scheme: Scheme<T>
	title?: string
}
