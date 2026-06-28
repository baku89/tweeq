import {InputBoxProps} from '../types'

export type TimeFormat = 'frames' | 'timecode'

export type InputTimeProps = InputBoxProps & {
	frameRate?: number
	min?: number
	max?: number
	/** Value restored by the right-click "Reset to Default" menu item. */
	default?: number
}
