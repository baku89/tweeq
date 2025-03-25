import {InputProps} from '../types'

export type TimeFormat = 'frames' | 'timecode'

export type InputTimeProps = InputProps<number> & {
	frameRate?: number
	min?: number
	max?: number
}
