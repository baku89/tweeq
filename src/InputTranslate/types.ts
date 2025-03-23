import {vec2} from 'linearly'

import {InputProps} from '../types'

export type InputTranslateProps = InputProps<vec2> & {
	min?: vec2 | number
	max?: vec2 | number
	step?: vec2 | number
}
