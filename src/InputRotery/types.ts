import type {InputBoxProps} from '../types'

export interface InputRoteryProps extends InputBoxProps<number> {
	quantizeStep?: number
	angleOffset?: number
}
