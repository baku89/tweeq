import type {InputBoxProps} from '../types'

export type ColorChannel = 'r' | 'g' | 'b' | 'a' | 'h' | 's' | 'v'
export type ColorPicker =
	| ColorChannel // For slider
	| `${ColorChannel}${ColorChannel}` // For 2D pad
export type ColorSpace = 'rgb' | 'hsv' | 'hex'

export function colorChannelToIndex(channel: ColorChannel): number {
	switch (channel) {
		case 'r':
			return 0
		case 'g':
			return 1
		case 'b':
			return 2
		case 'a':
			return 3
		case 'h':
			return 4
		case 's':
			return 5
		case 'v':
			return 6
	}
}

export type RGB = {r: number; g: number; b: number}
export type RGBA = [r: number, g: number, b: number, a: number]
export type HSV = {h: number; s: number; v: number}
export type HSVA = {h: number; s: number; v: number; a: number}

export type Channels = {
	r: number
	g: number
	b: number
	a: number
	h: number
	s: number
	v: number
}

export type ColorPickerComponent =
	| [type: 'slider', axis: ColorChannel]
	| [type: 'pad', axes: [ColorChannel, ColorChannel]]
	| [type: 'values']
	| [type: 'presets']

export const DefaultColorPickers: ColorPickerComponent[] = [
	['pad', ['s', 'v']],
	['slider', 'h'],
	['slider', 'a'],
	['values'],
]

export interface InputColorProps extends InputBoxProps {
	alpha?: boolean
	pickers?: ColorPickerComponent[]
	presets?: string[]
}
