import {vec2} from 'linearly'

import {InputCheckboxProps} from '../InputCheckbox/types'
import {type InputCodeProps} from '../InputCode'
import {type InputColorProps} from '../InputColor'
import {type InputNumberProps} from '../InputNumber'
import {type InputPositionProps} from '../InputPosition'
import {type InputRotaryProps} from '../InputRotary'
import {type InputStringProps} from '../InputString'
import {InputSwitchProps} from '../InputSwitch/types'
import {InputTimeProps} from '../InputTime'
import {InputVecProps} from '../InputVec'

type ParameterBase = {label?: string; icon?: string}

type Desc<T extends Record<string, unknown>, P> = T & P

type ParameterDescNumber = Desc<
	{type: 'number'; ui?: undefined},
	InputNumberProps
>
type ParameterDescAngle = Desc<{type: 'number'; ui: 'angle'}, InputRotaryProps>
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

type ParameterDescBoolean = Desc<
	{type: 'boolean'; ui?: undefined},
	InputSwitchProps
>
type ParameterDescCheckbox = Desc<
	{type: 'boolean'; ui: 'checkbox'},
	InputCheckboxProps
>

type ParameterDescForType<T> = T extends number
	? ParameterDescNumber | ParameterDescAngle | ParameterDescTime
	: T extends string
		? ParameterDescString | ParameterDescCode | ParameterDescColor
		: T extends boolean
			? ParameterDescBoolean | ParameterDescCheckbox
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
