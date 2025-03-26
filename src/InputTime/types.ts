import {InputBoxProps} from '../types'

export type TimeFormat = 'frames' | 'timecode'

export type InputTimeProps = InputBoxProps & {
	frameRate?: number
	min?: number
	max?: number
}
