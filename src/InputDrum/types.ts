import {
	type InputBoxProps,
	type InputFont,
	type LabelizerProps,
} from '../types'

export interface InputDrumProps<T> extends LabelizerProps<T>, InputBoxProps {
	font?: InputFont
	/**
	 * Width of each value cell, in px. Smaller values let more of the
	 * neighbouring options peek in at the edges.
	 */
	cellWidth?: number
}
